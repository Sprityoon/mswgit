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

> 완료 항목은 `game_design.md`에 반영 완료 — 상세 코드/데이터 이력은 git 로그 참조. 이 문서에는 요약 포인터만 남긴다.
>
> - **타일 스킴 전환(2026-07-07) + 밀착 페어 문법(2026-07-08)** → `game_design.md` §3.5 지형(TileMap) 불릿. 생성기 `scripts/build_maps.cjs`, 런타임 `ResourceSpawner.mlua`(`IsGrassEdgeTileName`/`ComputeGrassTileName` 등), 미니맵 `UIMinimapController.mlua` 반영. **스킴 명세의 최신 단일 소스는 이 문서 §1.3**.
> - **곡괭이 swingT1 무기 미표시 수정 — 양손 슬롯 정합(2026-07-08)** → `game_design.md` Phase 5. `item_dataset.csv` `WeaponSlot` 컬럼 신설, `PlayerInventory.ApplyHeldToolCostume`(twohand→`TwoHandedWeapon` 슬롯·반대 슬롯 해제), `MineState.mlua` 주석 갱신. (스윙 중 도구 렌더 육안 재확인은 §3 T3.)

---

## 3. 작업 큐 (하위 에이전트 위임 대상)

> 상태: `[대기]` / `[진행]` / `[완료]` / `[보류]`
> 각 항목은 **Target(파일) / Change(변경) / Acceptance(완료 기준)** 3요소를 반드시 채운다.

### T1–T2. [완료 — 검증 PASS(2026-07-07), game_design.md §3.5 반영] 타일 스킴 런타임·프린지 검증
- 보스가 직접 `refresh`→`play`→`logs`→`stop` 완주: 자원=잔디 위에만 스폰·길=Soil 노출·미니맵 흙/잔디 색 구분·프린지 방향 정합(거울상 심 없음)·`ResourceSpawner`/`UIMinimapController` 무에러 확인. 이후 07-08 밀착 페어 리네임분은 refresh 빌드 클린(플레이 육안은 제작자).
- ⚠️ **타일 관련 코드 작업(T4/T5) 착수 전 `wall.tileset` 타일명을 반드시 재확인**할 것 — 밀착 페어 리네임으로 `Grass{dir}` 8 + `Grass*Corner` 4 체계(§1.3이 단일 소스). T1에서 발견됐던 MerchantInteract `LEA-1102`는 이후 로그에서 소거됨.

### T3. [완료 — 2026-07-10 제작자 Play 검증 완료] 도구 스윙 모션 런타임 검증 (이월 — 2026-07-08 양손 슬롯 수정 반영)
- **배경**: 스윙 액션은 `item_dataset.csv`의 `SwingAction` 컬럼이 1순위 데이터 소스 (`MineState.mlua`가 조회, 폴백 pickaxe→`swingO1`/axe→`swingO2`, 기본 `stabO2`). 곡괭이 3종=`swingT1`(양손), 도끼=`swingO2`(한손). **2026-07-08 보스 지시로 swingT1 중 곡괭이 미표시 수정 완료(§2 T0c)** — 액션 계열과 장착 슬롯 정합 규칙: `swingO*/stabO*` ↔ `WeaponSlot` 공란(한손), `swingT*/stabT*` ↔ `WeaponSlot=twohand`(양손 아바타 아이템 필수). 신규 도구 추가 시 이 짝을 지킬 것.
- **Target**: 코드 변경 없음. 모션/도구 룩이 어색하면 CSV `SwingAction`/`WeaponRUID`/`WeaponSlot` 값만 교체 (보스 확인 후).
- **Change**: Play → 곡괭이/도끼 장착 → Ctrl 스윙 → 모션·전 구간 도구 렌더 확인(곡괭이 티어별 3종 모두), 대기/이동 중 들고 있는 모습, 도끼↔곡괭이 교체 시 반대 슬롯 잔상 없음, logs 무에러.
- **Acceptance**: 곡괭이=`swingT1` 몸 모션 + 스윙 전 구간 곡괭이 렌더, 도끼=`swingO2` 전 구간 도구 렌더, 장착 교체/해제 시 슬롯 충돌 없음, SwingAction/WeaponSlot 관련 Error 없음.
- **결과**: 제작자 Play 검증 완료 (2026-07-10 확인).

### T4. [대기] 경계 테라스/절벽 아트 정리
- **배경**: `TerraceTop`/`CliffFace`/`Big Wall`은 이전 스킴의 임시 아트 그대로다. 신규 grass 기준 아트와 톤이 안 맞을 수 있고, 상위 레이어 테라스 타일이 깔린 뒤 플레이어 아바타 SortingLayer 최종 판정도 미완(`docs/design/skill-tree-plan.md` §5 4번).
- **Target**: `RootDesk/MyDesk/wall.tileset`(Maker에서 아트 교체) + 필요 시 `scripts/build_maps.cjs` 밴드/데코 페인팅
- **Change**: 신규 타일 아트 확정 후 테라스 링/절벽면 리스킨, 플레이어가 테라스 타일 아래로 숨는지 확인.
- **Acceptance**: 경계 밴드 비주얼이 잔디/흙 아트와 이어지고, 아바타가 지형 위에 정상 렌더.


### T5. [코드 완료 — 단, 파기 문법이 T11로 대체 예정] 영지 타일 편집 — 길 파기/잔디 심기 (Phase 14-A)

> ⚠️ **2026-07-10 보스 결정**: T5의 `removeGrass`(홀 문법 — 셀 통째 Soil 노출)는 밀착 페어 스킴(§1.3 문법 1)과 불일치해 **좁은 길을 팔 수 없는 문제**가 확인됨. 파기 의미론은 **T11**이 대체한다. T5의 나머지 인프라(RPC 검증 5중 체크, 영속 델타, 재생, 씨앗 소비)는 T11이 그대로 재사용.
- **배경**: `game_design.md` §2.2 ① "개인 타일 편집 우선" + Phase 14-A. 신규 타일 스킴(§1.3)을 그대로 활용 — 잔디 커버를 걷으면 길이 된다.
- **✅ 2026-07-09 구현 (6파일)**:
  1. `item_dataset.csv` — `TerrainEditAction` 컬럼 신설(공란=일반). 데이터 주도 2행 추가: `Shovel`(tool/ToolType=shovel/`removeGrass`, 아바타·아이콘은 스톤 곡괭이 RUID 재사용=placeholder / EntryId도 곡괭이 모델 재사용→드롭 무에러) + `Grass Seed`(resource/`plantGrass`, 아이콘·EntryId는 Grass 아이템 재사용). `RecipeDataSet.csv`에 두 제작 레시피 추가(Shovel=Wood2+Stone1, Grass Seed=Grass1).
  2. `ResourceSpawner.mlua` — `TerrainEditsJsonMap` 프로퍼티 + `Get/SetTerrainEditsJson`(설치 타일 JSON과 동일 패턴), **`ApplyTerrainEdit(mapName,map,action,x,y,persist)`**(잔디 셀 마스크 판정→`RectTileMap2` SetTile/RemoveTile→이웃 8셀 `ComputeGrassTileName` 재계산→persist 시 델타 append), `ReconstructTerrainEditsForMap`(순서 재생, 멱등). `ReconstructWorldPlacementsForMap` 말미에서 호출.
  3. `PlayerInventory.mlua` — `ServerRequestTerrainEdit`(@Server): senderUserId·영지(Home_*)·손님 place권한·소유·사거리(≤4)·점유(자원/가구/타일) 5중 검증 → `ApplyTerrainEdit(persist=true)` → plantGrass만 씨앗 1소비 → `MarkPlayerDirty`. 동작은 `TerrainEditAction` 컬럼값으로만 분기(이름 하드코딩 없음).
  4. `PlayerController.mlua` `TryMine` — 활성 퀵슬롯 아이템의 `TerrainEditAction`이 있으면 설치/채광보다 우선 dispatch. removeGrass는 `MINE` 상태로 삽 스윙 모션 재생(MineState는 애니 전용 확인), 대상 셀 프리뷰는 기존 `UpdateMineReticle`이 자동 처리.
  5. `PersistenceManager.mlua` — save `data.homeTerrainEdits` 추가, load(기존/신규 유저 양쪽) `SetTerrainEditsJson` 주입(구세이브는 `or "[]"` 폴백=마이그레이션 불필요), Reconstruct가 재생.
- **검증 상태**: 매 편집 LSP `mlua-diagnose` errors=0/warnings=0(Info는 전부 기존 LIA-1114 크로스스크립트 noise). Maker 미기동으로 `refresh`/빌드 로그/Play **미실행 — 런타임 검증 보류**.
- **설계 근거 메모(재확인용)**: 영지(비절차 경로)는 청크 로딩이 `RectTileMap2`를 **읽기만** 하고 재페인팅 안 함(`ResourceSpawner` L957-975) → 편집이 청크 리로드로 지워지지 않고, 자원 스폰 억제도 편집된 타일 상태에서 emergent(별도 점유 불필요). 이웃 재계산은 편집 셀 인접 8칸만 → 항상 흙 이웃 1칸↑ 보유해 FullGrass 평탄화 안 됨(전맵 `AutotileGrassLayer` 문제와 무관).
- **남은 검증(제작자)**: Maker 기동 후 `refresh`→빌드 로그 무에러 확인 → Play: 삽 장착 Ctrl로 잔디 셀 파기(Soil 노출·프린지 연결), 씨앗 퀵슬롯 등록 후 Ctrl로 복구, 자원/가구 셀에서 거부 메시지, 재접속 후 편집 상태 유지.
- **알려진 한계/후속**: ① Shovel/Grass Seed 아트가 placeholder(곡괭이/풀 RUID 재사용) — 전용 스프라이트는 CSV `IconRUID`/`WeaponRUID`/`EntryId` 셀 교체만으로 반영(msw-painter). ② Grass Seed는 `resource`라 제작 시 퀵슬롯 자동등록 안 됨(수동 드래그 1회 필요) — 필요 시 `PlayerInventory.mlua` 크래프트 자동등록 분기(현 tool/furniture)에 조건 추가. ③ 인접한 손디자인 밀착 페어 길 옆을 파면 접합부가 셀단위 문법으로 재계산돼 미세 심 가능(설계상 "마스크 합집합 자동" 허용 범위).

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

### T10. [완료 — 2026-07-10 | 코드+Play 검증 PASS(제작자)] 인벤토리→퀵슬롯 드래그&드롭
- **배경**: 퀵슬롯↔퀵슬롯 D&D 인프라는 이미 구현되어 있음. 인벤토리 슬롯에서 퀵슬롯으로 직접 끌어 등록하는 UX 보강 (보스 지시, 2026-07-08).
- **Target**: `RootDesk/MyDesk/UI/Scripts/UIInventoryController.mlua`(인벤 슬롯 드래그 시작), 기존 퀵슬롯 D&D 구현 파일(드롭 수신), 필요 시 `PlayerInventory.mlua`(서버 검증)
- **Change**: 인벤 슬롯 드래그 → 퀵슬롯 드롭: ① 빈 퀵슬롯이면 신규 등록 ② 점유 퀵슬롯이면 교체. 기존 퀵슬롯↔퀵슬롯 D&D 인프라·아이템 종류 참조·중복 등록 규칙을 그대로 재사용 (신규 규칙 발명 금지).
- **Acceptance**: 인벤→퀵슬롯 등록/교체 동작, 동일 아이템 중복 등록 규칙 유지, 기존 퀵슬롯↔퀵슬롯 D&D 회귀 없음, 빌드 로그 무에러.
- **구현 요약 (2026-07-10)**: `UIInventoryController`에 인벤 슬롯 UITouch Down/Drag/Up 추가. 드롭 시 HUD 퀵슬롯 좌표 hit-test(UIHUDController와 동일 수식) → 기존 `ServerRegisterQuickSlot`(소유 검증·중복 해제·빈칸 등록/점유 교체). 화로/상자 열림 시 드래그 비활성(기존 더블클릭 전송 경로 유지). `PlayerInventory`/`UIHUDController` 무변경.
  - 후속 수정: 드래그 중 인벤 GridView 클립 밖 가시성 — `PopupGroup` 하위 `uisprite` 플로팅 고스트 + `SetSiblingIndex` (HUDGroup 부모는 인벤 뒤에 가려짐 금지). `AlignmentType.Center` 사용(`MiddleCenter`는 TextAlignment → LEA-3021). Screen UI에서 `OrderInLayer` 직접 변경 금지(LWA-3047).
- **검증**: Maker refresh 빌드 Error=0. **제작자 Play 검증 완료 (2026-07-10)** — 인벤→퀵슬롯 드래그 등록/교체·드래그 아이콘 가시성 포함 PASS.

### T11. [완료 — 코드 완료 2026-07-10 | LSP·refresh 보류(Maker 미기동) | 런타임 검증 보류(제작자 수행)] 지형 편집 v2 — 서브셀 마스크 기반 밀착 페어 길 파기 (삽=digPath / 신규 괭이=digHole / 씨앗=plantGrass)

- **배경**: T5의 삽(`removeGrass`)은 구 홀 문법으로 동작해 셀 하나를 통째로 Soil 홀로 만든다. 현행 밀착 페어 스킴(§1.3)에서 좁은 길 = **방향 에지 페어**(길 셀에 L2 홀 0칸)이므로, 현재 삽으로는 손디자인 길 같은 길을 팔 수 없고 인접 손디자인 페어를 프린지 재계산이 덮어써 훼손할 수도 있다. 런타임 편집을 `scripts/build_maps.cjs`와 동일한 **2×2 서브셀 흙 마스크** 모델 위에 재구현한다. (2026-07-10 보스 확정: 홀 파기는 삽에서 분리해 신규 도구 "괭이"로, 길 밴드 경계는 플레이어 위치 최근접 경계로.)

- **Target**:
  1. `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` — 마스크 유틸 신설 + `ApplyTerrainEdit` 재작성 + `ReconstructTerrainEditsForMap` 레거시 재생
  2. `RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` — `ServerRequestTerrainEdit` 시그니처/검증 확장
  3. `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` — `TryMine` 디스패치에 시선축 전달
  4. `RootDesk/MyDesk/item/DataSets/item_dataset.csv` — shovel 행 `TerrainEditAction=digPath`로 변경, 신규 `hoe` 행 추가
  5. `RootDesk/MyDesk/item/DataSets/RecipeDataSet.csv` — 괭이 제작 레시피 추가
  6. (수정 불요 확인만) `UIMinimapController.mlua` 미니맵 색 / `ResourceSpawner` 자원 스폰 `RequiredTile` 판정 — 이미 "방향 에지=길" 판정이라 자동 정합이어야 함

- **Change**:

  **① 서브셀 마스크 유틸 (ResourceSpawner)**
  - 서브셀 좌표 규약은 §1.3 = `build_maps.cjs` 헤더와 동일: 셀 (x,y)의 서브셀 BL=(2x,2y), BR=(2x+1,2y), TL=(2x,2y+1), TR=(2x+1,2y+1). **타일명↔마스크 매핑의 단일 소스는 `build_maps.cjs`의 `cellTile()`** — 착수 전 반드시 읽고 mlua로 미러링할 것 (흙 0칸=`FullGrass` / 인접 2칸=`Grass{T|D|L|R}` / 3칸=볼록 `Grass{LT|RT|LD|RD}` / 1칸=오목 `Grass*Corner` / 4칸=L2 홀 / 접미사 방향=흙 쪽).
  - `GetCellMask(tilemap2, x, y)` : 칠해진 L2 타일명 → 마스크 역산 (L2 빈 칸 + L1 Soil 있음 = 4칸 홀, L2 빈 칸 + L1 없음 = 편집 불가 셀).
  - `SetCellMask(tilemap2, x, y, mask)` : 마스크 → 타일 재도장. 4칸이면 `RemoveTile`(홀). **대각 2칸 무효 마스크가 들어오면 보정 규칙 적용**: 직전에 추가된 서브셀과 같은 행(수평 편집) 또는 같은 열(수직 편집)의 이웃 서브셀 1개를 추가로 흙 처리해 3칸 볼록으로 승격 (결정론 유지 — 재생 시 동일 결과 필수).
  - 셀 타일 = 자기 마스크만의 함수이므로 **T5의 이웃 8셀 `ComputeGrassTileName` 프린지 재계산 루프는 제거**한다. (`ComputeGrassTileName`/`AutotileGrassLayer` 자체는 절대 삭제·수정 금지 — 다른 경로가 사용.)

  **② `ApplyTerrainEdit` 재작성 — 3개 액션** (시그니처: `(mapName, map, action, x, y, axis, side, persist)`; axis/side는 digPath만 사용)
  - **`digPath` (삽)**: 흙 밴드 = 셀 경계에 밀착한 2서브셀 폭 밴드, 항상 두 셀에 걸침.
    - 수평(axis="h"): side가 지정한 경계(아래 셀 yLow와 위 셀 yLow+1 사이)에 대해, 셀 (x, yLow)의 윗줄 {TL,TR} + 셀 (x, yLow+1)의 아랫줄 {BL,BR}을 기존 마스크에 **합집합**. 수직(axis="v")은 좌 셀 오른열 {BR,TR} + 우 셀 왼열 {BL,TL}로 대칭.
    - 두 셀 **모두** 편집 가능해야 함: L1 Soil 존재 + 벽 밴드 밖 + `GridToEntity` 비점유 (점유 검사를 두 셀로 확장). 아니면 거부.
    - 합집합 결과가 기존과 동일(이미 길)이면 false 반환 → "이미 길입니다" 피드백.
  - **`digHole` (괭이)**: 문법 2(§1.3) 재현 — 대상 셀 마스크=4칸(홀) + **8이웃에 ½셀 프린지 마진 합집합**: 상하좌우 이웃은 대상 쪽 서브셀 행/열 2칸, 대각 이웃은 대상 쪽 모서리 서브셀 1칸. 대상 셀 편집 가능 검증은 digPath와 동일(이웃은 점유여도 마진 합집합만은 허용 — 시각 전이일 뿐 통행/점유 불변).
  - **`plantGrass` (씨앗)**: 대상 셀 마스크를 0(FullGrass)으로 클리어. L1 Soil 필수. 이미 0이면 false. 이웃 마스크는 건드리지 않음 — 홀 둘레에 남는 ½ 프린지는 그 셀에 또 심으면 지워지는 설계(셀 단위 역연산 유지). ⚠️ **이 문단은 T12로 대체됨** — 셀 단위 역연산은 digPath 페어의 반쪽 밴드/프린지를 고아로 남기는 설계 공백으로 판명(2026-07-10 제작자 리포트).
  - **영속 델타 포맷 확장**: `{action, x, y, axis?, side?}`. side는 편집 시점에 확정해 저장 (재생 시 플레이어 위치로 재계산 금지 — 결정론).

  **③ 레거시 세이브 호환 (`ReconstructTerrainEditsForMap`)**
  - 기존 항목 `{action="removeGrass", x, y}`는 **digHole로 재생**해 기존 유저 월드의 파인 자리를 보존. 신규 항목은 액션 그대로 재생. 재생 순서는 배열 순서 유지(멱등).

  **④ RPC/입력 경로**
  - `PlayerInventory.ServerRequestTerrainEdit(itemName, cellX, cellY, dirX, dirY)`로 확장. 기존 5중 검증(senderUserId/Home_*/손님 place권한/소유/사거리≤4) 유지. axis는 dir에서(|dirX|>0 → "h"… 주의: 동서로 팔 때 길은 수평으로 이어지므로 axis="h"=수평 밴드), side는 **서버가 플레이어 월드 좌표의 셀 내 소수부로 계산** (수평: 플레이어가 셀 위쪽 절반이면 위 경계, 아래 절반이면 아래 경계. 수직은 좌/우 대칭).
  - `PlayerController.TryMine` — 기존 `TerrainEditAction` 디스패치에 `LastDirectionX/Y` 전달만 추가. 스윙 모션 분기는 액션 이름이 아니라 **아이템 `Category=="tool"` 여부로** 판정(삽·괭이 공통 MINE 스윙, 씨앗은 무모션 — 이름/액션 하드코딩 제거).
  - 액션별 실패 피드백: digPath "이미 길입니다"/"여기는 팔 수 없습니다", digHole "이미 파여 있습니다", plantGrass "여기엔 잔디를 심을 수 없습니다".

  **⑤ 데이터셋**
  - `item_dataset.csv`: shovel 행 `TerrainEditAction`을 `digPath`로 변경 (설명 텍스트도 "길을 판다"로 갱신). 신규 `hoe` 행: Category=tool / `TerrainEditAction=digHole` / **`SwingAction=swingT1` + `WeaponSlot=twohand` 짝 필수(§3 T3 규칙)** / 아바타·아이콘·EntryId는 T5의 shovel과 같이 스톤 곡괭이 RUID placeholder 재사용 허용(전용 아트는 후속 msw-painter).
  - `RecipeDataSet.csv`: Hoe = Wood 2 + Stone 1 (shovel과 동급 티어).

- **Acceptance**:
  1. LSP `mlua-diagnose` errors=0 + Maker `refresh` 빌드 로그 무에러 (에이전트 수행 범위는 여기까지 — **Play 런타임 검증은 제작자 직접 수행**, 허위 "동작 확인" 보고 금지).
  2. 코드 리뷰 관점 완료 기준: (a) `if itemName == "..."` 류 이름 분기 0건 (b) 대각 2칸 무효 마스크 방어 존재 (c) 레거시 `removeGrass` 델타가 digHole로 재생 (d) digPath 점유/기반 검사가 두 셀 모두 (e) T5의 이웃 8셀 재계산 제거 (f) `AutotileGrassOnSetup=false` 및 `AutotileGrassLayer` 무변경.
  3. 제작자 런타임 체크리스트(보고서에 그대로 전달): 삽으로 동서/남북 길 파기 → 방향 에지 페어 생성(홀 0칸)·손디자인 길과 이음새 자연 / 괭이로 홀+둘레 프린지 / 씨앗 복구 / 자원·가구 셀 거부 / 재접속 후 편집 유지(신규 델타) / 구세이브 유저의 기존 파인 자리 보존 / 미니맵·자원 스폰 억제 정합.

### T12. [완료 — 코드 완료 2026-07-10 | refresh 빌드 로그 Error=0 | 런타임 검증 보류(제작자 수행)] plantGrass를 digHole/digPath의 대칭 역연산으로 — 씨앗 심기 시 주변 반밴드·프린지 자동 복구

- **배경**: T11 런타임 테스트(제작자, 2026-07-10)에서 길을 판 뒤 씨앗을 심으면 대상 셀만 FullGrass로 돌아오고 **페어 반대쪽 반밴드와 이웃 프린지가 고아로 남는** 문제 확인. 원인은 T11 스펙 자체 — plantGrass가 "대상 셀 마스크만 0 클리어"로 정의되어 파기(두 셀 밴드/8이웃 프린지 합집합)와 비대칭이었다. 보스 확정: **plantGrass = digHole의 정확한 대칭 역연산**으로 재정의한다.
- **Target**: `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua`만 (plantGrass 분기 + 대각 보정 감산 모드). RPC/데이터셋/영속 포맷은 무변경.
- **Change**:
  1. **plantGrass 재정의**: 대상 셀 마스크=0 클리어 + **8이웃의 "대상을 향한 비트"를 클리어**(AND NOT). 비트 테이블은 digHole의 fringe 테이블 `{dx,dy,bits}`를 **그대로 재사용**할 것 (상하좌우=대상 쪽 행/열 2칸, 대각=대상 쪽 모서리 1칸 — 별도 테이블 중복 정의 금지). 이웃은 `IsTerrainCellEditable`한 셀만, 점유 이웃도 마진 클리어는 허용(digHole 마진 합집합과 대칭 규칙).
  2. **감산 대각 보정**: 비트를 빼는 연산은 대각 무효 마스크(6=TL|BR, 9=BL|TR)를 만들 수 있다 (예: 볼록 코너 14에서 대각 이웃 비트 8 클리어 → 6). 기존 `FixDiagonalMask`는 **추가** 방식(3칸 승격)이라 심기에 쓰면 흙이 늘어나 방향이 반대다. 감산 보정을 신설: 대각이 남으면 **대상 셀에서 x축으로 먼 쪽 비트를 보존하고 가까운 쪽 비트를 추가 클리어**해 1칸(오목 코너)으로 강등 (dx로 판정: 대상이 동쪽이면 왼쪽 열 비트 보존. dx=0인 상하 이웃은 dy로 y축 대칭 판정). 결정론 필수 — 재생 시 동일 결과.
  3. **`SetCellMask` 호출 정리**: plantGrass 경로에서는 추가식 `FixDiagonalMask`가 절대 개입하지 않도록 보장 (감산 보정을 마친 마스크만 전달하거나 mode 파라미터 분리 — 구현 재량, 단 digPath/digHole 경로의 기존 동작은 회귀 금지).
  4. 영속 델타 포맷 불변(`{action="plantGrass", x, y}`) — 재생이 동일 로직을 타므로 기존 세이브 자동 정합. `ReconstructTerrainEditsForMap` 수정 불요.
- **Acceptance**:
  1. LSP 진단 무에러 + (Maker 기동 시) refresh 빌드 로그 무에러. Play 런타임 검증은 제작자 수행 — 허위 보고 금지.
  2. 코드 리뷰 기준: (a) fringe 비트 테이블이 digHole과 단일 소스 공유 (b) 감산 대각 보정이 결정론적이고 추가식 보정과 분리 (c) 델타 포맷·RPC·데이터셋 무변경 (d) digPath/digHole 동작 회귀 없음.
  3. 제작자 런타임 체크리스트: ① 수평/수직 길 파기 → 한 셀에 씨앗 → 그 지점 양쪽 반밴드 모두 잔디 복구, 잘린 길 양끝이 코너 캡으로 자연 마감 ② 괭이 홀 → 씨앗 → 홀+둘레 프린지 복구 ③ 광장 내부에 심기 → 잔디 섬(island 문법) + 둘레 프린지 자동 생성 ④ 대각 무효 타일(거울상/깨진 프린지) 0건 ⑤ 재접속 후 상태 동일 재현.
- **참고 (의도된 emergent 동작)**: 손디자인 광장/길 가장자리에 심으면 인접 흙이 ½셀씩 깎인다 — 파기가 ½셀씩 퍼지는 것과 대칭인 의도된 동작이며 버그로 보고하지 말 것.

### T13. [완료 — 2026-07-10 | LEA-3001 원인=빈 chestItems 중첩표, 소거 확인 | digPath 끝단 캡 코드+스모크 | 육안 캡 비주얼 보류(제작자)] 지형 편집 v2 후속 — ① 세이브 LEA-3001 근본 수정 ② digPath 자유 끝단 오목 코너 페어 캡

- **배경**: T12 런타임 테스트(제작자, 2026-07-10) 중 두 문제 확인.
  - ① 길 파기 도중 60초 플러시에서 세이브 실패:
    ```
    [LEA-3001] NotSupported : 'LuaTableToJsonType.UnknownType'은/는 지원하지 않습니다.
    [C]: in method 'JSONEncode'
    PersistenceManager.SavePlayerData (at MyDesk/PersistenceManager:442)
    ← SaveDirtyData ← OnBeginPlay(주기 플러시 타이머)
    ```
    저장 실패 = **월드 데이터 유실 위험**이므로 최우선.
  - ② 길의 자유 끝단(흙이 이어지지 않는 끝)이 각진 풀 밴드로 끝남. §1.3 문법 1의 "자유 끝단 = 오목 코너 페어 캡"이 런타임 digPath에 누락됨 — `build_maps.cjs`의 `walk()`는 밴드 서브셀 범위를 `2*x0+1 .. 2*x1+2`로 잡아 **양끝이 반 셀 물러나며 끝 셀 페어가 `Grass*Corner` 1칸짜리 캡**이 된다. T11/T12 스펙 누락(보스 책임)이며 이번에 명세를 보강한다.

- **Target**: `RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua` (①) + `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua`의 digPath 분기 (②). RPC/데이터셋/영속 델타 포맷 무변경.

- **Change ① — LEA-3001 진단 후 근본 수정 (진단이 먼저, 수정은 원인 특정 후)**:
  1. **라인 442를 믿지 말 것** — .codeblock 라인은 .mlua와 오프셋이 있을 수 있다. `SavePlayerData`의 JSONEncode는 3곳: `furnJson=JSONEncode(furnList)` / `permJson=JSONEncode(permList)` / `jsonStr=JSONEncode(data)`. 각 호출을 pcall로 감싸 **실패한 호출과 (data인 경우) 실패 필드를 이진 탐색으로 특정**하는 임시 계측을 넣고, Maker MCP(`refresh`→`play`→삽으로 길 파기→60초 대기 or 즉시 플러시 유도→`logs`)로 재현해 원인을 로그로 확인하라. §1.4의 `scratch/run_lua.py`로 Play 컨텍스트에서 후보 값을 직접 인코드해 봐도 좋다.
  2. 유력 후보 (확인 순서 권장): (a) `furnList`의 `furn.chestItems = comp:GetItems()` 중첩 — MSW `JSONDecode`가 JSON null 등에서 만드는 비직렬화 센티널/userdata 잔존 가능 (b) 빈 테이블 인코드 — `PlayerInventory.SafeEncodeJson`/`Chest.SafeEncodeJson`이 `next(tbl)==nil`이면 인코드를 건너뛰는 가드를 굳이 두고 있음(선례) — PersistenceManager의 `furnList`/`permList` 인코드에는 이 가드가 없다 (c) `data` 테이블 내 특정 프로퍼티 값이 문자열/숫자/불리언이 아닌 경우.
  3. **수정 원칙**: 원인 필드를 특정해 근본 수정. 무차별 pcall로 세이브 전체를 조용히 삼키는 방식 금지 — 인코드 실패 시 `log_error`로 **필드명을 명시**하고 해당 필드만 안전 기본값으로 대체해 나머지 세이브는 보존한다 (`SafeEncodeJson` 패턴을 PersistenceManager에 도입하는 것 허용). 진단용 임시 계측은 수정 완료 후 제거.
- **Change ② — digPath 자유 끝단 캡**:
  1. digPath에서 주 밴드(두 셀) 합집합 후, **축 방향 양쪽 이웃 셀 페어(총 4셀)에 캡 비트를 추가 합집합**한다. 캡 비트 = 파인 셀에 인접한 서브셀 열/행 1칸씩. 수평 밴드 기준: 동쪽 이웃 페어는 아래 셀 TL·위 셀 BL, 서쪽 이웃 페어는 아래 셀 TR·위 셀 BR (수직은 대칭 — 북쪽 페어 좌 BR·우 BL, 남쪽 페어 좌 TR·우 TL). 캡 비트는 해당 셀 풀 밴드 비트의 부분집합이므로 다음 셀을 이어 파면 자동 흡수된다(단조 증가·결정론).
  2. 캡 대상 셀이 `IsTerrainCellEditable`이 아니면 스킵(벽 밑 플러시 컷 — `build_maps.cjs` 클립과 동일). 점유 셀에는 digHole 프린지와 동일하게 **캡 합집합 허용**(시각 전이일 뿐).
  3. "이미 길" 판정 갱신: 주 밴드 2셀 + 캡 4셀 **전부** 변화 없음일 때만 false 반환 (현재는 주 밴드 2셀만 보고 조기 반환 — 캡만 비는 경우를 놓친다).
  4. plantGrass 역연산은 무변경 — T12의 fringe 클리어가 인접 캡 비트(축 방향 이웃의 대상 쪽 열/행)를 이미 포함하므로 자동 정합. 델타 포맷도 무변경(캡은 digPath 적용 시 파생 — 재생 동일).
- **Acceptance**:
  1. Maker MCP로 ① 재현→수정→재현 소거 확인: 길 파기 후 플러시에서 LEA-3001 0건, "Async/Sync save completed" 로그 확인. (Play 조작이 어려우면 재현·확인 로그를 첨부하고 미확인 항목은 보류로 명시.)
  2. refresh 빌드 로그 무에러. 임시 계측 코드 잔존 0.
  3. 코드 리뷰 기준: (a) 세이브 실패가 필드 단위로 격리·로깅되고 전체 세이브는 계속됨 (b) 캡 비트가 축 방향으로만, 편집 가능 셀에만 적용 (c) "이미 길" 판정이 캡 포함 6셀 기준 (d) 델타 포맷·plantGrass·digHole 무변경.
  4. 제작자 런타임 체크리스트: ① 길 파기→끝단 둥근 코너 페어 캡, 이어 파면 캡이 풀 밴드로 흡수 ② 벽/맵 경계로 파면 캡 없이 플러시 컷 ③ 씨앗 심기로 캡 포함 복구 ④ 파기→60초 방치→저장 로그 정상→재접속 복원 ⑤ 대각 무효 타일 0건.

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

보고는 채팅 응답 + 이 문서의 해당 T항목 상태 갱신(`[대기]`→`[진행]`→`[완료]`/`[보류]`) 양쪽으로 남긴다.

---

## 5. 외부 에이전트 킥오프 프롬프트 (복붙용 표준)

> 타사 에이전트(Codex/Cursor/Copilot/기타)에게 작업을 넘길 때 아래 블록의 `T<n>`만 바꿔 그대로 붙여넣는다.
> 대부분의 에이전트는 루트 `AGENTS.md`를 자동 로드하므로 절대 규칙은 이중으로 걸린다.

```
너는 이 저장소(MSW 게임 프로젝트)의 구현 담당 에이전트다. 계획 수립과 의사결정은 이미 끝났고, 너는 지시된 작업만 수행한다.

1. 먼저 `AGENTS.md`와 `docs/agents/subagent-handoff.md`의 §1(공통 컨텍스트)을 전부 읽어라.
2. 그 다음 §3 작업 큐에서 **T<n>** 항목만 수행하라. Target/Change/Acceptance에 명시되지 않은 것은 하지 마라 (리팩터링·기능 추가·다른 T항목 착수 금지).
3. 스펙이 모호하거나 하드코딩이 불가피해 보이면 임의 판단하지 말고 멈춰서 질문하라.
4. 시작 시 해당 T항목 상태를 [진행]으로 바꾸고, 종료 시 §4 보고 형식대로 보고 + 상태를 갱신하라.
5. Play 런타임 검증은 네 범위가 아니다 — LSP 진단·refresh 빌드 로그까지만 검증하고, 나머지는 "런타임 검증 보류(제작자 수행)"로 정확히 보고하라.
```
