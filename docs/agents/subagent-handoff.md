# 하위 에이전트 작업 핸드오프 (Subagent Handoff)

> **용도**: 상위 에이전트/보스가 하위 에이전트에게 작업을 위임할 때 이 문서를 그대로 전달한다.
> 하위 에이전트는 **§1 공통 컨텍스트를 먼저 전부 읽고**, §3 작업 큐에서 지정된 작업 항목만 수행한다.
> 새 작업이 생기면 §3에 항목을 추가하고, 완료되면 상태를 갱신한다.

---

## 1. 공통 컨텍스트 (모든 작업 전 필독)

### 1.1 프로젝트

- MSW(MapleStory Worlds) 생존/채집 게임. 루트: `C:/minho/메이플월드`
- 톱다운 `RectTile` 맵 (영지 `Home_<UserId>` / 공동 마을 `town` / 사냥터 `template_field` / 보스 `template_boss`). 플레이어는 `KinematicbodyComponent`.
- 전체 게임 설계: `game_design.md` (84KB — 필요한 §만 검색해 읽을 것)
- 에이전트 규칙: `AGENTS.md` + `docs/agents/*.md` (특히 하드코딩 금지 룰 §2, 8대 핵심 규칙 §3)

### 1.2 절대 규칙 (위반 시 작업 무효)

1. **하드코딩 금지**: 아이템명/수치/모션명 등 데이터성 값은 `if name == "..."` 분기 금지. 데이터셋(`.csv` + `.userdataset`) 컬럼으로 관리하고 `_DataService:GetTable(...):FindRow(...)`로 조회한다. 불가피하면 **구현 전에 보스에게 질문**.
2. 편집 허용: `RootDesk/MyDesk/**`, `Global/DefaultPlayer.model`, `Global/WorldConfig.config`, `map/*.map`, `ui/*.ui`(빌더 경유). `.codeblock`/`.d.mlua`/`Environment/`는 절대 수정 금지.
3. 좌표는 월드 단위(1 unit = 100px). `SpawnByModelId`의 parent에 nil 금지(`self.Entity.CurrentMap` 사용).
4. 아이템 식별자는 `item_dataset`의 `Name` 컬럼 값(표시명 키)이다. 소문자 `id`와 혼동 금지.
5. 런타임 검증 없이 "동작함"이라고 보고 금지. Maker MCP(`refresh`→`play`→`logs`→`stop`)를 못 쓰는 환경이면 "코드 수정 완료, 런타임 검증 보류"로 정확히 보고.

### 1.3 ⚖️ 현행 타일 스킴 (2026-07-08 밀착 페어 확정 — 이 문서의 최우선 배경지식)

**grass 기준 사각형 디자인 + 서브셀 흙 마스크, 밀착 페어 문법.** 이전 스킴(좁은 길 = L2 홀)은 2026-07-08 폐기 — 좁은 길은 이제 **L2가 덮인 방향 에지 페어**다(길 셀에 L2 홀 0칸).

| 레이어 | 엔티티 이름 | 내용 |
|---|---|---|
| Layer 1 (SL0) | `RectTileMap` | **`Soil` 전면 깔림** (광장/밭 바닥이자 베이스 지반) |
| Layer 2 (SL1) | `RectTileMap2` | **잔디 커버** — `FullGrass`(중앙) + `Grass{LT,T,RT,L,R,LD,D,RD}`(방향 에지 — 밀착 길·프린지) + `Grass{LT,RT,LD,RD}Corner`(오목 모서리) |
| Layer 3 (SL2) | `RectTileMap3` | 설치 바닥 (런타임 전용, tile1) |
| Layer 4 (SL3) | `RectTileMap4` | `Big Wall` 충돌 밴드 (경계 3겹) |
| Layer 5 (SL4) | `RectTileMap5` | 경계 테라스 비주얼 (TerraceTop 링 + 북벽 CliffFace) |
| MapLayer5 | (엔티티 전용) | 몬스터·NPC·자원·가구·드롭 |

- **서브셀 흙 마스크 (단일 표현)**: 모든 지형 문법은 셀당 2×2 서브셀 흙 마스크 하나로 통일. 셀 패턴 → 타일: 흙 0칸=`FullGrass` / 인접 2칸=`Grass{T|D|L|R}` / 3칸=볼록 `Grass{LT|RT|LD|RD}` / 1칸=오목 `Grass*Corner` / 4칸=L2 홀(L1 Soil 노출) / 대각 2칸=무효(산출 검사 에러). 접미사 방향 = 흙(길) 쪽.
- **문법 1 — 길 (밀착 에지 페어, L2 홀 0칸)**: 셀 경계 좌표 중심선 폴리라인에서 폭 2서브셀(시각 1셀) 흙 밴드를 파생. 수평 길 = `GrassT|GrassD` 밀착 페어, 수직 길 = `GrassR|GrassL` 페어. ㄱ자 꺾임(바깥 오목 캡+안쪽 볼록), 막다른 끝(오목 코너 페어 캡), 길↔광장 접속은 마스크 합집합으로 전부 자동.
- **문법 2 — 광장/밭/보스 아레나 (홀 유지)**: 셀 사각형 + ½셀 마진. 내부 = L2 홀, 둘레 잔디 셀 = 프린지 에지, 모서리 = 오목 `Grass*Corner`. 광장 안 잔디 섬(정원)은 island 도려냄(같은 ½ 마진 규칙).
- ⚠️ **잔디 스트립 최소 2칸**: 두 흙 영역 사이 잔디가 1칸이면 양쪽 ½마진이 겹쳐 흙으로 병합된다 (map01 밭 고랑이 이 규칙으로 2칸 확보됨 — 밭 A `[-23,-19]`).
- `wall.tileset`은 2026-07-07 리네임으로 프린지가 `Soil{dir}` → **`Grass{dir}` 8종**으로 바뀌었고, `Soil*2`(구 내부 모서리) 폐기 + `Grass*Corner` 4종 추가. L2 잔디 패밀리 = `FullGrass` + `Grass{dir}` 8 + `Grass*Corner` 4 = 13종.
- **기록/구현 위치**:
  - 블록아웃 생성기 `scripts/build_maps.cjs` (헤더 주석 = 스킴 명세. `makeDirt`(walk/plaza/island)+`cellTile`이 문법 단일 소스. `--force` 필수 — 손편집 전량 덮어씀. 산출 검사 내장: 무효 타일/길 셀 L2 홀 발견 시 즉시 실패)
  - 런타임 `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` — `IsGrassTileName`(잔디 패밀리) / **`IsGrassEdgeTileName`(방향 에지=길 판정)** / `IsSoilTileName`(정확히 `"Soil"`) / `ComputeGrassTileName` / 자원 스폰 `RequiredTile` 판정: `FullGrass`·`Grass*Corner` → `"FullGrass"`(스폰 가능), 방향 에지 → `"Soil"`(길 — 잔디 요구 자원 억제), L2 홀+L1 Soil → `"Soil"`(광장 바닥) / `AutotileGrassLayer`(⛔ 홀 문법 전용 — 밀착 페어 길을 FullGrass로 평탄화하므로 `AutotileGrassOnSetup` 기본 OFF 절대 유지)
  - 미니맵 `RootDesk/MyDesk/UI/Scripts/UIMinimapController.mlua` `TileColor` — 방향 에지·`Soil`(정확 일치)=흙색, `FullGrass`/`Grass*Corner`=잔디색
  - 설계 기록 `game_design.md` §3.5 "지형 (TileMap)" 불릿
- `BiomeResourceDataSet.csv`의 `RequiredTile=FullGrass` 행(Tree/GrownGrass)은 그대로 유효 — `FullGrass`/`Grass*Corner` 셀에서만 스폰, 길(방향 에지)·광장 홀에서는 억제.

### 1.4 검증 프로토콜 (Maker MCP)

- 브리지 스크립트: `scratch/mcp_probe.py`(연결/툴 목록), `scratch/run_lua.py`(Play 컨텍스트 Lua 실행), `scratch/watch_maker_logs.py`(로그 감시).
- MCP bat 경로 리졸버: `MSW_MCP_BAT` 환경변수 → 프로젝트 `.mcp.json`의 `msw-maker-mcp` args → 알려진 설치 경로 순.
- ⚠️ `watch_maker_logs.py`는 `if __name__ == "__main__"` 가드 없이 모듈 최상위에서 감시 루프가 즉시 실행됨. **import 금지**(import만으로 MCP 브리지가 떠서 라이브 세션과 충돌). 반드시 `python scratch/watch_maker_logs.py`로 직접 실행할 것.
- 표준 절차: Maker 에디터 실행 상태에서 `refresh` → `play` → 시나리오 재현 → `logs(kind=normal)`에서 Error/Warning 확인 → `stop`.

---

## 2. 완료된 작업 기록

### T0. 타일 스킴 전환 (2026-07-07) — **코드/맵 수정 완료, 런타임 검증 보류**

- §1.3의 신규 스킴으로 전면 전환:
  1. `scripts/build_maps.cjs` — 헤더 스킴 명세 갱신, `grassTileName()` 신설(FullGrass/Soil프린지/Grass*Corner 매핑), 페인터 반전(L1=Soil 전면, L2=잔디 커버에서 길 마스크만 뚫음), `disc`/`octagon` 제거 및 전 디자인 rect 전환, 레이어 슬롯 `soil`→`grass` 리네임.
  2. `ResourceSpawner.mlua` — `IsGrassTileName`/`IsSoilTileName` 재정의, `ComputeGrassTileName` 신설, `AutotileSoilLayer`→`AutotileGrassLayer`(스무딩 제거 — Grass*Corner가 있어 불필요), 프로퍼티 `AutotileSoilOnSetup`→`AutotileGrassOnSetup`(기본 false 유지), 절차 지형 잠금 경로 및 손디자인 `RequiredTile` 판정 반전.
  3. `UIMinimapController.mlua` — `TileColor`: `Soil` 정확 일치=흙색, `Soil{dir}` 프린지/`Grass*`=잔디색.
  4. `game_design.md` §3.5 지형 불릿 + `PlayerInventory.mlua` 설치 검증 주석 갱신.
  5. `node scripts/build_maps.cjs --force`로 맵 4종(map01/town/template_field/template_boss) 재페인팅. 산출 검증: 전 맵 L1=`Soil` 전면(카운트 정확), L2 잔디 패밀리 13종만 사용, 무효 tileIndex 0건.
- **남은 검증**: §3 T1 참조.

### T0b. 밀착 페어 타일 문법 전환 (2026-07-08) — **코드/맵 수정 완료 + refresh 빌드 로그 무에러, 플레이 육안 검증은 보스**

- 보스의 wall.tileset 리네임(`Grass{dir}` 8방) 후속으로 §1.3 밀착 페어 스킴 전면 전환:
  1. `scripts/build_maps.cjs` — 서브셀 흙 마스크 모델로 재작성(`makeDirt`/`walk`/`plaza`/`island`/`cellTile`). 4맵 디자인을 길=중심선 폴리라인, 광장·밭·아레나=플라자 사각형으로 변환. 산출 검사 내장(무효 대각 패턴/길 셀 L2 홀 → 즉시 실패). town 대로(폭 5)는 문법 2 유지, template_boss 회랑(폭 3)은 셀 중심 대칭 위해 문법 2 유지.
  2. `ResourceSpawner.mlua` — `IsGrassEdgeTileName` 신설, RequiredTile 판정 재정의(방향 에지=길→`"Soil"`), 절차 지형 브랜치도 동일 규칙(칠한 타일명으로 판정), `IsGrassTileName`의 사어 `Soil{dir}` 브랜치 제거, `AutotileGrassLayer`에 페어 비호환 ⛔ 경고 주석.
  3. `UIMinimapController.mlua` — `TileColor`: 방향 에지=흙색(밀착 길이 미니맵에 흙 선으로 표시), `FullGrass`/`Grass*Corner`=잔디색, 사어 `Soil{dir}` 브랜치 제거.
  4. `node scripts/build_maps.cjs --force` 4맵 재페인팅 — 전 맵 산출 검사 통과(무효 0건·길 L2 홀 0건), 표본 좌표 대조로 페어/꺾임/캡/접속 문법 정합 확인. 밭 A를 `[-23,-19]`로 1칸 축소(잔디 스트립 2칸 규칙).
  5. Maker `refresh` → 빌드 로그 **에러 0건** (Warning 2건은 기존 `slime_king` `BossDropMin/Max` LWA-4012 — 본 작업 무관. T1에서 발견됐던 MerchantInteract LEA-1102도 현 로그에 없음).
- 남은 검증: Play 육안(보스) — 꺾임/캡/접속 점검 포인트는 `build_maps.cjs` 실행 로그의 "점검:" 줄 참조.

### T0c. 곡괭이 swingT1 무기 미표시 수정 — 양손 슬롯 정합 (2026-07-08) — **코드/데이터 수정 완료 + refresh 빌드 무에러, 스윙 육안 검증은 보스(T3)**

- **원인**: 곡괭이 3종의 `WeaponRUID`가 전부 한손(`weapon`) 아바타 아이템(호스맨즈/황금 곡괭이/다이아 곡괭이)이라 두손 액션 `swingT1`의 무기 파츠 프레임이 없음 → 스윙 중 도구만 미렌더. 도끼(`swingO2`=한손 액션)는 정상이었던 이유도 동일 규칙.
- **수정 (액션 계열 ↔ 장착 슬롯 정합)**:
  1. `item_dataset.csv` — `WeaponSlot` 컬럼 신설(공란=한손 기본). 곡괭이 3종 `WeaponSlot=twohand` + `WeaponRUID`를 양손(`twohandweapon`) 곡괭이 아이템으로 교체: stone=`곡괭이`(18a44a9f39a94633b56902492e5b7da6) / copper=`Golden Pickaxe`(1d9a1f0f8a004cce8938dff567313743, 기존 황금=구리 선례 유지) / iron=`Pickaxe`(54a842df20b94f37b0d7bdbc0c1d2acd). copper/iron `IconRUID`도 `thumbnail://<신규 RUID>`로 동기화(stone은 전용 아이콘 유지).
  2. `PlayerInventory.mlua` `ApplyHeldToolCostume` — `WeaponSlot=twohand`면 `TwoHandedWeapon` 슬롯 장착, 아니면 `OneHandedWeapon` 장착. 양손이 한손+보조 슬롯을 점유하는 상호 배타 규칙에 따라 **반대 슬롯은 항상 해제**. `WeaponSlot` 컬럼 미리프레시 대비 pcall 가드(한손 폴백). 장착/해제/영속 복원 전 경로가 이 메서드 단일 지점 경유 확인.
  3. `MineState.mlua` — "한손 액션만 가능" 사어 주석을 정합 규칙(swingO*↔공란 / swingT*↔twohand)으로 갱신. 폴백(swingO1/swingO2)은 컬럼 미존재 시에만 작동 — 그 경우 슬롯도 한손 폴백이라 정합 유지.
- refresh → 빌드 로그 에러 0건 (Warning 2건은 기존 slime_king LWA-4012 — 무관).
- **곡괭이 티어별 룩 배정은 이름 기준 추정** — 썸네일 API 미제공으로 육안 미확인. 보스가 T3 검증 중 룩이 어긋나면 CSV `WeaponRUID`/`IconRUID` 셀만 교체하면 됨.

---

## 3. 작업 큐 (하위 에이전트 위임 대상)

> 상태: `[대기]` / `[진행]` / `[완료]` / `[보류]`
> 각 항목은 **Target(파일) / Change(변경) / Acceptance(완료 기준)** 3요소를 반드시 채운다.

### T1. [검증 PASS — 2026-07-07 에이전트 보스 지시로 수행] 신규 타일 스킴 런타임 검증
- ✅ **2026-07-07 런타임 검증 결과 (보스가 play/캡처/logs 허용해 직접 수행)**: 현재 디스크 상태 기준 `refresh`→`play`→`logs`→`stop` 완주.
  - ① `ResourceSpawner`/`UIMinimapController` Error 0건. 런타임 로그 441줄 전부 Info(에러/워닝 0). `UIMinimapController: Tilemap layers cached ... map01/Home` 정상, ResourceSpawner가 hunt01~04·Home 청크/포탈/보스 무에러 셋업.
  - ② map01 = 십자 Soil 길이 잔디 관통, 가장자리 grass→dirt 프린지 자연스럽게 연결.
  - ③ Home 맵에서 나무/덤불/풀 전부 잔디 위에만, 흙 길·밴드는 자원 없이 비어 있음.
  - ④ 미니맵에 흙색 길이 녹색 잔디 위로 뚜렷이 표시(`TileColor`: `Soil`정확=(0.76,0.60,0.42) vs 잔디군=(0.39,0.60,0.13)로 구분).
  - ⑤ 🔶 시스템 PASS(`Reconstructed ... 2 furniture entities` — 가구 재구성 동작). **인터랙티브 실제 설치**는 이번 세션 미조작.
  - ⚠️ 검증은 **현재 디스크 상태** 기준. 보스가 `wall.tileset` 타일명을 재정리(GrassR/L/T/D 등)하거나 길 폭을 바꾸면 **재검증 필요**.
  - ⚠️ **범위 외 신규 발견 (타일 스킴과 무관)**: `RootDesk/MyDesk/NPC/Scripts/MerchantInteract.mlua`의 `OnBeginPlay` line 2~3에서 빌드 에러 `[LEA-1102] EventHandlerBase ConnectEvent(Type eventType, func eventHandler)` 2건 — `ConnectEvent` 호출 시그니처/인자 문제로 추정. 상점 NPC 이벤트 연결이 조용히 안 걸릴 수 있으니 별도 수정 필요.
- ⚠️ **2026-07-07 보스 인수**: 맵/타일 작업(길 폭 축소 포함)은 보스가 Maker에서 직접 진행 중. 하위 에이전트는 착수 금지 — 보스 맵 작업 중 `wall.tileset` 타일명이 재정리될 수 있으니(예: `GrassR/GrassL/GrassT/GrassD` 계열 언급됨), **타일 관련 코드 작업 전 반드시 wall.tileset 이름을 재확인**할 것.
- **배경**: §2 T0. 맵 4종이 새 스킴으로 재페인팅됐고 `.mlua` 3종이 수정됐으나 Maker 미기동 상태라 런타임 미검증.
- **Target**: 코드 변경 없음 (검증 전용; 실패 시에만 §1.3 기재 파일 수정)
- **Change**: §1.4 절차로 `refresh` → `play`. ① 빌드 로그에 `ResourceSpawner`/`UIMinimapController` 관련 Error 없음 확인 ② map01에서 길(잔디 구멍)이 Soil로 보이고 잔디 프린지/코너 아트가 이어지는지 육안 확인 ③ 자원(나무/풀)이 잔디 위에만 스폰되고 길 위에 스폰 안 되는지 ④ 미니맵에서 길=흙색, 잔디=녹색으로 나오는지 ⑤ 가구 설치가 잔디/길 양쪽에서 동작하는지.
- **Acceptance**: 위 5개 항목 Play 모드 통과 + `logs` 무에러. 실패 항목은 원인 파일과 함께 §3에 신규 T항목으로 보고.

### T2. [검증 PASS — 2026-07-07] 잔디 프린지/코너 아트 방향 확인
- ✅ **검증 결과**: map01 십자 길 + Home 맵 좌측 세로 길·하단 흙 밴드에서 grass→dirt 프린지가 **거울상/역방향 심(seam) 없이 길 쪽을 향해 매끄럽게 연결**됨. `build_maps.cjs grassTileName()`과 `ResourceSpawner ComputeGrassTileName`이 동일 규칙이라 아트가 현재 이름과 정합. ⚠️ 단, **보스가 wall.tileset을 리네임/재정리 중이면** 아트-이름 정합이 깨질 수 있으니 그 작업 후 재확인 필요.
- **배경**: 접미사 컨벤션은 "방향 = 길(마스크가 비는) 쪽"으로 구현했다 (`SoilT` = 위쪽이 길). 새로 리네임된 wall.tileset 아트가 이 방향과 거울상이면 프린지가 반대로 보인다.
- **Target**: (방향이 맞으면 변경 없음) 어긋나면 `scripts/build_maps.cjs`의 `grassTileName()` + `ResourceSpawner.mlua`의 `ComputeGrassTileName`의 접미사 매핑만 스왑 — 두 곳이 동일 규칙이어야 한다.
- **Change**: T1의 육안 확인 중 프린지 8방향 + 코너 4종이 길 방향과 일치하는지 대조. 어긋난 방향만 매핑 교정 후 `node scripts/build_maps.cjs --force` 재실행.
- **Acceptance**: 전 방향 프린지/코너가 길 쪽을 향해 자연스럽게 이어짐 (map01 우물 광장 + S자 길에서 확인).

### T3. [대기] 도구 스윙 모션 런타임 검증 (이월 — 2026-07-08 양손 슬롯 수정 반영)
- **배경**: 스윙 액션은 `item_dataset.csv`의 `SwingAction` 컬럼이 1순위 데이터 소스 (`MineState.mlua`가 조회, 폴백 pickaxe→`swingO1`/axe→`swingO2`, 기본 `stabO2`). 곡괭이 3종=`swingT1`(양손), 도끼=`swingO2`(한손). **2026-07-08 보스 지시로 swingT1 중 곡괭이 미표시 수정 완료(§2 T0c)** — 액션 계열과 장착 슬롯 정합 규칙: `swingO*/stabO*` ↔ `WeaponSlot` 공란(한손), `swingT*/stabT*` ↔ `WeaponSlot=twohand`(양손 아바타 아이템 필수). 신규 도구 추가 시 이 짝을 지킬 것.
- **Target**: 코드 변경 없음. 모션/도구 룩이 어색하면 CSV `SwingAction`/`WeaponRUID`/`WeaponSlot` 값만 교체 (보스 확인 후).
- **Change**: Play → 곡괭이/도끼 장착 → Ctrl 스윙 → 모션·전 구간 도구 렌더 확인(곡괭이 티어별 3종 모두), 대기/이동 중 들고 있는 모습, 도끼↔곡괭이 교체 시 반대 슬롯 잔상 없음, logs 무에러.
- **Acceptance**: 곡괭이=`swingT1` 몸 모션 + 스윙 전 구간 곡괭이 렌더, 도끼=`swingO2` 전 구간 도구 렌더, 장착 교체/해제 시 슬롯 충돌 없음, SwingAction/WeaponSlot 관련 Error 없음.

### T4. [대기] 경계 테라스/절벽 아트 정리
- **배경**: `TerraceTop`/`CliffFace`/`Big Wall`은 이전 스킴의 임시 아트 그대로다. 신규 grass 기준 아트와 톤이 안 맞을 수 있고, 상위 레이어 테라스 타일이 깔린 뒤 플레이어 아바타 SortingLayer 최종 판정도 미완(`docs/design/skill-tree-plan.md` §5 4번).
- **Target**: `RootDesk/MyDesk/wall.tileset`(Maker에서 아트 교체) + 필요 시 `scripts/build_maps.cjs` 밴드/데코 페인팅
- **Change**: 신규 타일 아트 확정 후 테라스 링/절벽면 리스킨, 플레이어가 테라스 타일 아래로 숨는지 확인.
- **Acceptance**: 경계 밴드 비주얼이 잔디/흙 아트와 이어지고, 아바타가 지형 위에 정상 렌더.


### T5. [대기] 영지 타일 편집 — 길 파기/잔디 심기 (Phase 14-A)
- **배경**: `game_design.md` §2.2 ① "개인 타일 편집 우선" + Phase 14-A. 신규 타일 스킴(§1.3)을 그대로 활용 — 잔디 커버를 걷으면 길이 된다.
- **Target**: `RootDesk/MyDesk/item/DataSets/item_dataset.csv`(+RecipeDataSet), `PlayerInventory.mlua`(서버 검증), `PlayerController.mlua`(대상 셀/프리뷰), `PersistenceManager.mlua`(월드 델타 영속화), `ResourceSpawner.mlua`(점유/스폰 상호작용)
- **Change**: ① `item_dataset`에 `TerrainEditAction` 컬럼(removeGrass/plantGrass) — 삽 도구·Grass Seed 아이템 행 추가 ② Ctrl 사용 시 대상 셀의 `RectTileMap2` SetTile/RemoveTile + 주변 8셀 프린지 재계산(`ComputeGrassTileName` 재사용) ③ 편집 델타를 설치 타일과 동일한 월드 데이터 계층으로 영속화·복원 ④ 자원/가구 점유 셀은 편집 불가(서버 검증).
- **Acceptance**: 삽으로 판 셀이 길(Soil 노출)로 보이고 프린지가 이어짐, Seed로 복구 가능, 재접속 후 편집 상태 유지, 점유 셀 편집 거부. 빌드 로그 무에러(플레이 검증은 보스).

### T6. [대기] 농사 시스템 MVP (Phase 14-B)
- **배경**: Phase 14-B — "농장" 필러의 실체. 기존 자원 엔티티/드롭/점유 파이프라인을 최대 재사용.
- **Target**: 신규 `CropDataSet.csv` + `Crop.mlua`(성장 컴포넌트) + `Crop_<이름>.model`, `item_dataset`/`RecipeDataSet`/상점 데이터(씨앗), `TileDurabilityManager.mlua`(수확), `PersistenceManager.mlua`(작물 상태 영속화)
- **Change**: ① `CropDataSet`(SeedItem/GrowthStages/StageDuration/HarvestItem/MinYield/MaxYield) ② 씨앗 설치(가구 설치 경로 재사용, T5의 경작 셀 요구 여부는 보스와 합의) ③ 서버 타이머 성장(단계별 SpriteRUID 스왑) ④ 성숙 작물 채집 = 기존 `HitResource` 경로 ⑤ 작물 셀/단계/심은 시각 영속화.
- **Acceptance**: 씨앗 구매→심기→단계 성장→수확→재파종 루프가 CSV 행 추가만으로 신규 작물 확장 가능. 재접속 시 성장 경과 반영. 빌드 로그 무에러.

### T7. [대기] 연구소 가동 (Phase 14-C)
- **배경**: Phase 14-C — town의 `Building_ResearchLab`은 배치만 됨. 사냥 전리품 사용처를 만들어 사냥터 루프를 닫는다.
- **Target**: 신규 `ResearchDataSet.csv`, `ResearchLab` 상호작용 컴포넌트(F키 — `Furnace.mlua`/`UIChestController` 상호작용 패턴 재사용), 신규 `ResearchPopup` UI(빌더 `scripts/build_ui.js` 경유), `PersistenceManager.mlua`(해금 목록 필드), `UICraftingController.mlua`+`PlayerInventory:ServerRequestCraft`(해금 게이트)
- **Change**: ① `ResearchDataSet`(ResearchId/InputItem/InputCount/Duration/UnlockRecipeId/DisplayName) ② 투입→타이머→완료 시 유저별 영구 해금 ③ `RecipeDataSet`에 `RequiredResearchId` 컬럼 — 미해금 레시피는 제작창 잠금 표시+서버 거부.
- **Acceptance**: 드롭 재료 투입→연구 완료→신규 레시피 제작 가능, 재접속 후 해금 유지, 미해금 레시피 서버 거부. 빌드 로그 무에러.

### T8. [대기] 침대·수면 회복 (Phase 14-D)
- **배경**: Phase 14-D / §2.2 ① — 영지 "쉼" 축. 스탯(HP/스태미나)은 이미 영속화됨.
- **Target**: `item_dataset`/`RecipeDataSet`(침대 가구), `Furniture_Bed` 모델 + 상호작용 컴포넌트, `PlayerController.mlua`(수면 상태), `PersistenceManager.mlua`(수면 시작 시각 저장, 로그인 시 오프라인 경과 환산)
- **Change**: ① 침대 설치(기존 가구 경로) ② F 상호작용 → 수면 상태(이동 잠금+화면 톤) → 10분 경과 시 HP/스태미나 풀충전 ③ 수면 중 로그아웃 시각 저장 → 재접속 시 경과 ≥10분이면 풀충전 입장.
- **Acceptance**: 수면 10분 풀충전, 수면 중 종료→10분 후 재접속 풀충전, 도중 기상 시 부분 회복 없음(또는 비례 — 보스 합의). 빌드 로그 무에러.

### T9. [대기] 희귀 드롭 소스 (Phase 14-E)
- **배경**: Phase 14-E / §3.8 — `Rarity`/`Tradable` 컬럼과 등급색 UI는 완료, 정작 희귀템 공급원이 없음.
- **Target**: `ItemDropDataSet.csv`/`item_dataset.csv`(도안 아이템), `Monster.mlua`(보스 드롭), `ResourceSpawner.mlua`(희귀 광맥 변종·보물 상자 산포), `PlayerInventory.mlua`(도안 사용=레시피 해금 — T7의 해금 계층 재사용)
- **Change**: ① 보스(`slime_king`) 전용 드롭 테이블에 도안(Recipe Scroll) 추가 — 사용 시 레시피 영구 해금 ② 자원 스폰 시 3% 희귀 변종(드롭 배율↑, 등급색 연출) ③ 사냥터 외곽 보물 상자 절차 배치(1회 개봉).
- **Acceptance**: 보스 처치로 도안 획득→사용→레시피 해금 영속, 희귀 변종/보물 상자가 데이터셋 행으로 튜닝 가능. 빌드 로그 무에러.

### T10. [대기] 인벤토리→퀵슬롯 드래그&드롭
- **배경**: 퀵슬롯↔퀵슬롯 D&D 인프라는 이미 구현되어 있음. 인벤토리 슬롯에서 퀵슬롯으로 직접 끌어 등록하는 UX 보강 (보스 지시, 2026-07-08).
- **Target**: `RootDesk/MyDesk/UI/Scripts/UIInventoryController.mlua`(인벤 슬롯 드래그 시작), 기존 퀵슬롯 D&D 구현 파일(드롭 수신), 필요 시 `PlayerInventory.mlua`(서버 검증)
- **Change**: 인벤 슬롯 드래그 → 퀵슬롯 드롭: ① 빈 퀵슬롯이면 신규 등록 ② 점유 퀵슬롯이면 교체. 기존 퀵슬롯↔퀵슬롯 D&D 인프라·아이템 종류 참조·중복 등록 규칙을 그대로 재사용 (신규 규칙 발명 금지).
- **Acceptance**: 인벤→퀵슬롯 등록/교체 동작, 동일 아이템 중복 등록 규칙 유지, 기존 퀵슬롯↔퀵슬롯 D&D 회귀 없음, 빌드 로그 무에러.

### (신규 작업 추가 템플릿)
```
### T<n>. [대기] <제목>
- **배경**: <왜 필요한가, 관련 game_design.md §>
- **Target**: <수정할 파일 경로들>
- **Change**: <단계별 변경 내용, 사용할 데이터셋/API>
- **Acceptance**: <관찰 가능한 완료 기준 + 검증 방법>
```

---

## 4. 하위 에이전트 보고 형식

작업 종료 시 다음을 보고한다:
1. 수정한 파일 전체 목록 (경로)
2. 실제 수행한 검증과 결과 (수행 못 한 검증은 "보류"로 명시 — 허위 "동작 확인" 금지)
3. 새로 발견한 문제 (있다면 §3에 신규 T항목으로 추가)
