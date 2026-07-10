# 하위 에이전트 작업 핸드오프 (Subagent Handoff)

> **용도**: 상위 에이전트/보스가 하위 에이전트에게 작업을 위임할 때 이 문서를 그대로 전달한다.
> 하위 에이전트는 **§1 공통 컨텍스트를 먼저 전부 읽고**, §3 작업 큐에서 지정된 작업 항목만 수행한다.
> 새 작업이 생기면 §3에 항목을 추가하고, 완료되면 상태를 갱신한다.

---

## 1. 공통 컨텍스트 (모든 작업 전 필독)

### 1.1 프로젝트

- MSW(MapleStory Worlds) 생존/채집 게임. 루트: 저장소 루트 (작업 컴퓨터별 상이 — 예: `C:/minho/메이플월드`, `d:/메이플월도`)
- 톱다운 `RectTile` 맵 (영지 `Home_<UserId>` / 공동 마을 `town` / 사냥터 `template_field` / 보스 `template_boss`). 플레이어는 `KinematicbodyComponent`.
- 전체 게임 설계: `game_design.md` (84KB — 필요한 §만 검색해 읽을 것)
- 에이전트 규칙: `AGENTS.md` + `docs/agents/*.md` (특히 하드코딩 금지 룰 §2, 8대 핵심 규칙 §3)

### 1.2 절대 규칙 (위반 시 작업 무효)

1. **하드코딩 금지**: 아이템명/수치/모션명 등 데이터성 값은 `if name == "..."` 분기 금지. 데이터셋(`.csv` + `.userdataset`) 컬럼으로 관리하고 `_DataService:GetTable(...):FindRow(...)`로 조회한다. 불가피하면 **구현 전에 보스에게 질문**.
2. 편집 허용: `RootDesk/MyDesk/**`, `Global/DefaultPlayer.model`, `Global/WorldConfig.config`, `map/*.map`, `ui/*.ui`(빌더 경유). `.codeblock`/`.d.mlua`/`Environment/`는 절대 수정 금지.
3. 좌표는 월드 단위(1 unit = 100px). `SpawnByModelId`의 parent에 nil 금지(`self.Entity.CurrentMap` 사용).
4. 아이템 식별자는 `item_dataset`의 `Name` 컬럼 값(표시명 키)이다. 소문자 `id`와 혼동 금지.
5. 런타임 검증 없이 "동작함"이라고 보고 금지. Maker MCP(`refresh`→`play`→`logs`→`stop`)를 못 쓰는 환경이면 "코드 수정 완료, 런타임 검증 보류"로 정확히 보고.
6. **UI 작업 공통 (2026-07-11 신설 — 보스 지시)**: `.ui` 파일이나 UI 스크립트를 만지는 **모든** 작업은 착수 전에 msw-ui-system 스킬의 SKILL.md와 **`references/ui-aesthetics.md`(디자인 철학) 전문**을 로드한다 — 특히 §0 Gray Box Syndrome 회피, §1 비주얼 아이덴티티 선결정, §2 패널 해부, §5 간격·정렬 리듬. 납품 전 **동 문서 §7 자가 리뷰 루브릭 평가를 수행해 보고서에 표로 첨부**한다(누락 시 작업 미완료). 기존 게임 UI(인벤토리/HUD/상점)와 같은 비주얼 아이덴티티를 유지하고 화면마다 새 스타일을 발명하지 않는다. 레이아웃 작업 시 `references/layout-recipes.md`도 참조.

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
> - **인벤토리→퀵슬롯 드래그&드롭(2026-07-10, Play 검증 PASS)** → `game_design.md` §3.3.2. 구현/함정(플로팅 고스트·LEA-3021·LWA-3047)은 §3 T10 원문 참조.
> - **지형 편집 v2 완결(2026-07-10)** — T5(v1)→T11(서브셀 마스크 재구현: 삽=digPath / 괭이=digHole / 씨앗=plantGrass)→T12(plantGrass 대칭 역연산)→T13(세이브 LEA-3001 근본 수정 + digPath 끝단 캡) → `game_design.md` Phase 14-A. 마스크 연산 상세 스펙은 §3 T11~T13 원문을 의도적으로 유지 — **T6(농사)이 digHole 홀 셀 판정을 재사용**한다. 잔여: 끝단 캡 비주얼 육안 확인(제작자).
> - **농사 MVP(T6, 코드 완료 2026-07-10)** — `CropDataSet`(Carrot) + `Crop.mlua` + `Crop_Carrot.model`, 괭이 홀 셀 파종·서버 타이머 성장·맨손 수확·homeFurniture 영속. 보고서 `reports/T6-farming-mvp.md`. **후속 T24(작물 비주얼): 성숙 스프라이트=공식 잎 식물 `1f4f5c80…`(계정 UGC는 Play unavailable로 배제), StageScales `0.55|0.70|0.80`, 아이콘 불변** — refresh Error=0, 감성 픽만 제작자(안 A 기본 적용, B/C는 CSV 1셀 교체). 보고서 `reports/T24-crop-visual-tuning.md`.
> - **제작창 도감형 개편(14-F, Play 검증 PASS 2026-07-11)** — T14(`RecipeDataSet`에 `Tier`/`Category`/`UnlockId`/`UnlockHint` + 필터/상세 패널) → T25(해금 인프라: `UnlockedRecipesJson`·`GrantRecipeUnlock` 멱등·`ServerRequestCraft` 게이트·1회 마이그레이션) → T26(필터 순환→탭/칩 행, 팝업 1000×780, ui-aesthetics §7 루브릭 8/8 PASS, 칩 라벨 육안 정상). T7 Play에서 게이트·잠금표시 실동작 확인. 보고서 `reports/T14-*`·`T25-*`·`T26-*`. 잔여 해금 소스: 퀘스트=T27.
> - **배치 A/B 1차 완결 — Play 검증 PASS(제작자, 2026-07-11)**: 통합 보고서 `reports/BATCH-A-B-play-verify-2026-07-11.md`.
>   - **T7 연구소**(`ResearchDataSet`+`ResearchLab`+`UIResearchController`, 완료 시 `GrantRecipeUnlock` — 연구 해금 소스) → `game_design.md` Phase 14-C. 보고서 `reports/T7-*`.
>   - **T8 침대**(기존 수면 인프라 + `Item_Bed`/레시피/오프라인≥600s 풀충전) → Phase 14-D. 보고서 `reports/T8-*`.
>   - **T9 희귀 드롭**(도안 `UseUnlockId`→`GrantRecipeUnlock`=도안 해금 소스 / 자원 3% 희귀 변종 / hunt 보물 상자 / `ServerRequestUseItem` 진입점 신설) → Phase 14-E. 보고서 `reports/T9-*`.
>   - **T16 버프 인프라**(`BuffDataSet`+`PlayerBuffs` 세션 버프 / `UseBuffId` consumable / HUD BuffBar / 스탯 훅 4종 / 실증템 Roasted Grass) → Phase 15-A. 보고서 `reports/T16-*`.
>   - **T17 요리**(`Furnace` 레시피 테이블 프로퍼티 일반화=제련 무회귀 / `CookingRecipeDataSet` / 냄비 가구 / 음식 3종=버프) → Phase 15-B. 보고서 `reports/T17-*`.
>   - 해금 3소스 현황: 연구=T7✓ · 도안=T9✓ · **퀘스트=T27(잔여)**. 아트 placeholder(침대/도안/냄비 아이콘)는 기능 PASS — 전용 아트 별도 티켓.

---

## 3. 작업 큐 (하위 에이전트 위임 대상)

> 상태: `[대기]` / `[진행]` / `[완료]` / `[보류]`
> 각 항목은 **Target(파일) / Change(변경) / Acceptance(완료 기준)** 3요소를 반드시 채운다.
>
> 🧭 **실행 계획 (2026-07-11 보스 확정 — Phase 15 대량 발행. 기획서: `docs/design/phase15-living-world.md` 필독)**
> - **✅ Play 검증 PASS(제작자, 2026-07-11)**: **T6·T7·T8·T9·T14·T16·T17·T24·T25·T26** — 14-F 제작창 개편(T14/T25/T26)·작물 비주얼(T24)까지 제작자 육안 확정. 배치 A/B 통합 보고서 `reports/BATCH-A-B-play-verify-2026-07-11.md`.
> - **⏸ 다음 착수 보류(보스 지시 2026-07-11 — 문서로만 유지, 지금 착수 금지)**: **배치 B 잔여 T20(의뢰 게시판) → T18(낚시)** → 배치 C(T19→T21→T22→T23). 잔여 분리 **T27(퀘스트 해금 소스)**·**T15(도구 아트)**·**T4(테라스 아트)**도 대기. 다음 세션에서 보스 지시로 재개.
> - **배치 A (Phase 14 잔여)**: ~~T14 → T25 → T7 → T8 → T9~~ **전부 완료** (T15만 병행 잔여).
> - **배치 B (생활 루프 1차)**: ~~T16 → T17~~(완료) → **T20(의뢰 게시판) → T18(낚시)**
> - **배치 C (살아있는 월드 2차)**: T19(가축) → T21(날씨) → T22(도감·업적) → T23(펫)
> - **배치 내 순차 실행이 기본** — Phase 15 태스크들이 `PlayerController`/`PlayerInventory`/`PersistenceManager`/`item_dataset.csv`를 공유한다. 병렬은 서로 다른 머신+브랜치에서만 허용하며, 각 항목의 **"충돌 주의"** 줄로 파일 소유권을 확인할 것. T4(테라스 아트)는 아트 방향 확정까지 보류 유지.
> - 배치 단위 일괄 위임 시 §5의 **배치 킥오프 프롬프트**를 사용한다.

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

### T6. [코드 완료 — 2026-07-10 | refresh 빌드 Error=0 | 런타임 검증 보류(제작자)] 농사 시스템 MVP (Phase 14-B)
- **배경**: Phase 14-B — "농장" 필러의 실체. 기존 자원 엔티티/드롭/점유 파이프라인을 최대 재사용. **경작 셀 확정(2026-07-10 보스)**: 별도 "경작지 타일"을 신설하지 않는다 — **괭이(digHole, T11)로 판 흙 홀 셀(L2 홀 + L1 Soil)이 곧 밭**이다. 루프: 괭이로 밭 갈기 → 씨앗 파종 → 성장 → 수확 → (재파종 또는 plantGrass로 잔디 복구).
- **Target**: 신규 `CropDataSet.csv` + `Crop.mlua`(성장 컴포넌트) + `Crop_<이름>.model`, `item_dataset`/`RecipeDataSet`/상점 데이터(씨앗), `TileDurabilityManager.mlua`(수확), `PersistenceManager.mlua`(작물 상태 영속화), 설치 검증부(`PlayerInventory` 설치 경로 — 파종 셀 판정 추가)
- **Change**:
  ① `CropDataSet.csv`(SeedItem/GrowthStages/StageDuration/HarvestItem/MinYield/MaxYield). 작물 여부 판정은 이 데이터셋 `FindRow`로만 (이름 분기 금지).
  ② **파종 = 가구 설치 경로 재사용**: 작물 씨앗 아이템은 `Category=furniture`로 등록해 퀵슬롯 설치 모드·Ctrl 설치·서버 설치 검증을 그대로 재사용. 단 **설치 가능 셀 판정에 "흙 홀 셀" 조건 추가** — 대상 셀이 L2 빈 칸 + L1 Soil(= 괭이로 갈았거나 광장 등 흙 노출 상태)일 때만 파종 허용. 판정은 `ResourceSpawner`의 기존 마스크/타일 유틸(T11 `GetCellMask` 등) 재사용 — 새 판정 함수 중복 정의 금지. 잔디/길 에지/점유 셀은 거부 + 피드백 메시지.
  ③ **성장 = 서버 타이머** (2026-07-10 보스 확정: MVP는 낮/밤 주기 §3.11 비연동): 심은 시각 기준 경과 환산으로 단계 계산, 단계별 SpriteRUID 스왑. 재접속 시에도 심은 시각으로 재계산 → 오프라인 성장 포함.
  ④ 성숙 작물 수확 = 기존 `HitResource`/드롭 파이프라인 재사용 (맨손 채집 허용, MinYield~MaxYield 드롭).
  ⑤ 영속화: 작물 셀/작물 종류/심은 시각을 영지 델타로 저장·복원 (설치 가구 JSON 패턴 재사용).
  ⑥ 씨앗 공급처: 마을 상점 데이터 행 추가 + (선택) GrownGrass 드롭 테이블에 씨앗 행.
- **Acceptance**:
  1. 씨앗 구매→괭이로 밭 갈기→파종→단계 성장→수확→재파종 루프가 **CSV 행 추가만으로** 신규 작물 확장 가능.
  2. 잔디/길 에지/점유 셀 파종 거부. 작물이 심긴 셀에 plantGrass(잔디 복구)를 시도하면 점유 검증에 걸려 거부되는지 확인 (작물 = 점유 엔티티).
  3. 재접속 시 성장 경과 반영. LSP 진단 + refresh 빌드 로그 무에러. Play 검증은 제작자 — 보류로 보고.
- **구현 요약 (2026-07-10)**: `CropDataSet` + `Crop.mlua` + `Crop_Carrot.model`. 씨앗=`Carrot Seed`(furniture). 파종 시 `GetCellMask==15`만 허용 → `Crop_Carrot` 스폰·`InitializePlant`. 성장=`os.time` 기준 단계/`StageSprites` Multicast 스왑. 수확=HitResource 성숙 1타 Min~Max. 영속=`homeFurniture`에 `plantedAt`/`isCrop`(PersistenceManager 무수정). 상점+GrownGrass 5% 드롭. 보고서: `docs/agents/reports/T6-farming-mvp.md`.
- **검증**: Maker refresh 빌드 **Error=0**. Play 검증 보류(제작자).

### T7. [완료 — 2026-07-11 | 제작자 Play 검증 PASS] 연구소 가동 (Phase 14-C)
- **배경**: Phase 14-C — town의 `Building_ResearchLab`은 배치만 됨. 사냥 전리품 사용처를 만들어 사냥터 루프를 닫는다. **UI 방향 확정(2026-07-10 보스)**: 연구 UI는 새로 발명하지 않고 **T14가 세운 도감형 하이브리드 골격(티어 탭+그리드+상세 패널)을 재사용**한다 — [docs/agents/crafting_ui_concepts.md](./crafting_ui_concepts.md) 추천안. 잠금 표시 컬럼(`UnlockId`/`UnlockHint`)은 T14가, 해금 보유·지급·게이트 계층은 **T25**가 깔아둔다 — 이 티켓은 "연구"라는 해금 소스 하나를 연결할 뿐이다 (⚖️ 2026-07-11 해금 계층 확정 반영).
- **Target**: 신규 `ResearchDataSet.csv`, `ResearchLab` 상호작용 컴포넌트(F키 — `Furnace.mlua`/`UIChestController` 상호작용 패턴 재사용), 연구 UI(신규 `.ui`는 T14 제작창 레이아웃/컴포넌트 재사용 — 빌더 `scripts/build_ui.js` 경유), 진행 중 연구 상태 영속(연구 시작 시각 — `PersistenceManager`), 연구 완료 → **T25 `GrantRecipeUnlock` 호출** (게이트·잠금 UI·해금 목록은 T25 산출물 그대로 — 재구현 금지)
- **Change**: ① `ResearchDataSet`(ResearchId/InputItem/InputCount/Duration/UnlockRecipeId/DisplayName — UnlockRecipeId 값은 `RecipeDataSet.UnlockId`와 일치) ② 연구소 F 상호작용 → 연구 UI: 재료 투입→타이머(오프라인 경과 환산)→완료 시 `GrantRecipeUnlock(UnlockRecipeId)` ③ 연구 대상 레시피들의 `UnlockId`/`UnlockHint` CSV 배정(T25 정책 준수 — 상위 도구·가공 계열).
- **Acceptance**: 드롭 재료 투입→연구 완료→해당 레시피 해금(토스트)→제작 가능, 재접속 후 해금·진행 중 연구 유지, 미해금 서버 거부+잠금 표시(T25 경로 재사용 확인). LSP 진단 + refresh 빌드 로그 무에러. Play 검증은 제작자 — 보류로 보고.
- **구현 요약 (2026-07-11)**: `ResearchDataSet` 2행(구리/철), `ResearchLab.mlua` F/Touch, `UIResearchController`+`ResearchPopup`, `PlayerInventory` ActiveResearch+Start/Complete+OnUpdate, Persistence 영속, 완료→`GrantRecipeUnlock`. 보고서: `docs/agents/reports/T7-research-lab.md`.
- **검증**: Maker refresh 빌드 **Error=0**. **제작자 Play 검증 PASS (2026-07-11)**. 통합: `docs/agents/reports/BATCH-A-B-play-verify-2026-07-11.md`.

### T8. [완료 — 2026-07-11 | 제작자 Play 검증 PASS] 침대·수면 회복 (Phase 14-D)
- **배경**: Phase 14-D / §2.2 ① — 영지 "쉼" 축. 스탯(HP/스태미나)은 이미 영속화됨.
- **Target**: `item_dataset`/`RecipeDataSet`(침대 가구), `Furniture_Bed` 모델 + 상호작용 컴포넌트, `PlayerController.mlua`(수면 상태), `PersistenceManager.mlua`(수면 시작 시각 저장, 로그인 시 오프라인 경과 환산)
- **Change**: ① 침대 설치(기존 가구 경로) ② F 상호작용 → 수면 상태(이동 잠금+화면 톤) → 10분 경과 시 HP/스태미나 풀충전 ③ 수면 중 로그아웃 시각 저장 → 재접속 시 경과 ≥10분이면 풀충전 입장.
- **Acceptance**: 수면 10분 풀충전, 수면 중 종료→10분 후 재접속 풀충전, 도중 기상 시 부분 회복 없음(또는 비례 — 보스 합의). 빌드 로그 무에러.
- **구현 요약 (2026-07-11)**: 기존 수면 파이프라인 유지. 보강=`Item_Bed.model`, Recipe Bed, 오프라인 ≥600s 풀충전, 피드백. 도중 기상=비례. 보고서: `docs/agents/reports/T8-bed-sleep.md`.
- **검증**: Maker refresh 빌드 **Error=0**. **제작자 Play 검증 PASS (2026-07-11)**. 통합: `docs/agents/reports/BATCH-A-B-play-verify-2026-07-11.md`.

### T9. [완료 — 2026-07-11 | 제작자 Play 검증 PASS] 희귀 드롭 소스 (Phase 14-E)
- **배경**: Phase 14-E / §3.8 — `Rarity`/`Tradable` 컬럼과 등급색 UI는 완료, 정작 희귀템 공급원이 없음.
- **Target**: `ItemDropDataSet.csv`/`item_dataset.csv`(도안 아이템), `Monster.mlua`(보스 드롭), `ResourceSpawner.mlua`(희귀 광맥 변종·보물 상자 산포), 도안 사용 = `item_dataset.UseUnlockId` 컬럼 → T16 consumable 사용 경로 + T25 `GrantRecipeUnlock` 재사용 (전용 사용 로직 재구현 금지)
- **Change**: ① 보스(`slime_king`) 전용 드롭 테이블에 도안(Recipe Scroll) 추가 — 사용 시 `UseUnlockId`로 레시피 영구 해금(도안은 소모) ② 자원 스폰 시 3% 희귀 변종(드롭 배율↑, 등급색 연출) ③ 사냥터 외곽 보물 상자 절차 배치(1회 개봉).
- **Acceptance**: 보스 처치로 도안 획득→사용→레시피 해금 영속, 희귀 변종/보물 상자가 데이터셋 행으로 튜닝 가능. 빌드 로그 무에러.
- **구현 요약 (2026-07-11)**: UseUnlockId+도안 2종, ServerRequestUseItem, ItemDropDataSet 보스/보물, 3% 희귀 변종, TreasureChest hunt01~03. T16은 UseBuffId를 동 진입점에 확장. 보고서: `docs/agents/reports/T9-rare-drops.md`.
- **검증**: Maker refresh 빌드 **Error=0**. **제작자 Play 검증 PASS (2026-07-11)**. 통합: `docs/agents/reports/BATCH-A-B-play-verify-2026-07-11.md`.

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

### T14. [코드 완료 — 2026-07-11 | Play 보류(제작자)] 제작창 UI 개편 — 도감형 + 티어 탭 + 그리드 하이브리드 (Phase 14-F)

- **배경**: 농사(T6)·연구(T7)·희귀 드롭(T9)으로 아이템/레시피 수가 늘면 현행 리스트형 제작창은 스크롤 압박·미해금 표시 불가 한계에 부딪힌다. **2026-07-10 보스 채택**: [docs/agents/crafting_ui_concepts.md](./crafting_ui_concepts.md)의 추천 하이브리드(도감형 + 티어 분리 + 그리드) 조합. 선 연결형 테크 트리(동 문서 §1)는 기각 — MSW UI 컴포넌트로 선 연결 구현 리스크 대비 이득이 낮음. **T7(연구소)의 UI 골격이 되므로 T7보다 선행**한다.
- **Target**:
  1. `RootDesk/MyDesk/item/DataSets/RecipeDataSet.csv` — `Tier` / `Category` / `UnlockId` / `UnlockHint` 컬럼 신설 (⚖️ 2026-07-11 해금 계층 확정 — 舊 `RequiredResearchId` 계획을 대체)
  2. 제작 팝업 `.ui` — 기존 제작 팝업 레이아웃 교체 (빌더 `scripts/build_ui.js` 경유, msw-ui-system 스킬 로드 필수)
  3. `RootDesk/MyDesk/UI/Scripts/UICraftingController.mlua` — 탭/필터/그리드/상세 패널 로직
  4. (수정 불요 확인만) `PlayerInventory.mlua` `ServerRequestCraft` — 서버 검증 로직 무변경 (`UnlockId` 게이트는 T25에서 활성화)
- **Change**:
  ① **데이터 컬럼**: `RecipeDataSet.csv`에 `Tier`(정수, 1부터)·`Category`(tool/material/furniture 등 — 기존 `item_dataset.Category` 값 체계와 정합)·`UnlockId`(공란=기본 해금)·`UnlockHint`(잠금 시 표시 문구) 추가하고 기존 전 레시피에 값을 채운다(해금 배정 정책은 T25 — 이 티켓에서는 전부 공란 허용). **탭·필터 목록은 CSV에 존재하는 값에서 동적 생성** — 티어/카테고리의 이름·개수를 코드에 박지 않는다.
  ② **레이아웃** (crafting_ui_concepts.md "추천 조합" 그대로): 상단 = 티어 탭(미도달 티어 자물쇠 — MVP에선 전 티어 개방, 표시 훅만) / 좌측 = 카테고리 필터 + `GridView`(아이콘, 재료 부족 시 회색 틴트, 미해금 시 실루엣+자물쇠) / 우측 = 상세 패널(큰 아이콘·이름·설명·재료별 `보유/필요` 표기·선행 조건 텍스트·[제작하기] 버튼).
  ③ **조작 유지**: C 열기/닫기, 레시피 선택 후 Space 제작, 제작 성공 시 퀵슬롯 자동 등록·도구 자동 장착 등 기존 흐름 회귀 없음. 서버 검증은 기존 `ServerRequestCraft` 그대로.
  ④ **미해금 표시 훅**: `UnlockId` 비공란 + 미보유면 실루엣+자물쇠+`UnlockHint` 텍스트(힌트 공란이면 "???"). 해금 보유 데이터 연결은 T25 — 이 티켓에서는 전부 해금 상태로 표시 로직 자리만 마련.
- **Acceptance**:
  1. CSV 행/값 추가만으로 신규 티어·카테고리·레시피가 UI에 자동 반영 (코드 무수정).
  2. 기존 제작 플로우(C/Space/자동 퀵슬롯 등록/자동 장착) 회귀 없음. 화로·상자 등 다른 팝업과 열림 충돌 없음.
  3. LSP 진단 + Maker refresh 빌드 로그 무에러. Play 육안(레이아웃/스크롤/틴트/미해금 표시)은 제작자 수행 — 보류로 보고.

### T15. [대기] 지형 편집 도구 전용 아트 — Shovel / Hoe / Grass Seed placeholder 교체 (Phase 14-G)

- **배경**: T5/T11에서 Shovel·Hoe는 스톤 곡괭이 RUID, Grass Seed는 Grass 아이템 RUID를 placeholder로 재사용 중 — 인벤/퀵슬롯/장착 아바타에서 곡괭이와 구분이 안 된다. 코드 무변경 작업이라 다른 T와 병행 가능.
- **Target**: `RootDesk/MyDesk/item/DataSets/item_dataset.csv`의 Shovel/Hoe/Grass Seed 행 — `IconRUID` / `WeaponRUID` 셀 교체 (`EntryId` 드롭 모델은 전용 모델 제작 시에만 — MVP는 placeholder 유지 허용). 코드 파일 수정 없음.
- **Change**:
  ① `IconRUID`: msw-search로 적합한 기존 스프라이트 검색 → 없으면 msw-painter 스킬로 삽/괭이/씨앗 주머니 아이콘 제작 후 asset 업로드로 RUID 획득 → CSV 셀 교체.
  ② `WeaponRUID`: 장착 아바타용은 **아바타 아이템 리소스**여야 하므로 msw-search 아바타 검색 우선 — 적합한 삽/괭이 아바타 아이템이 없으면 placeholder 유지 + 보고 (임의 대체 금지).
  ③ `SwingAction`/`WeaponSlot`/`TerrainEditAction` 값은 절대 불변 (§3 T3/T11 정합 규칙).
- **Acceptance**: 인벤 아이콘·퀵슬롯에서 3종이 전용 아트로 구분 표시(아바타 장착 룩은 ②의 검색 결과에 따름), CSV 외 변경 0, refresh 빌드 무에러. 육안 확인은 제작자.

### T16. [완료 — 2026-07-11 | 제작자 Play 검증 PASS] 공통 버프/스탯 모디파이어 시스템 + 소비 아이템 경로 (Phase 15-A — 배치 B 선두 인프라)
- **검증**: **제작자 Play 검증 PASS (2026-07-11)**. 통합: `docs/agents/reports/BATCH-A-B-play-verify-2026-07-11.md`.

- **배경**: `docs/design/phase15-living-world.md` §3.1. 요리(T17)·날씨(T21)·펫(T23)이 전부 "일시적 스탯 변화"를 요구 — 공통 모듈 1개로 통일하고, `Category=consumable`(퀵슬롯에서 사용하는 세 번째 데이터 주도 분기)을 신설한다. ⚖️ 2026-07-11 확정: 버프는 **세션 한정**(로그아웃 소멸, 영속화 없음), 동일 BuffId 재적용=시간 갱신(refresh).
- **Target**:
  1. 신규 `RootDesk/MyDesk/item/DataSets/BuffDataSet.csv` + `.userdataset`
  2. 신규 `RootDesk/MyDesk/Player/Scripts/PlayerBuffs.mlua` (Player 부착 컴포넌트)
  3. `PlayerInventory.mlua` — `ServerRequestUseItem`(소비 검증+차감+버프 적용 RPC)
  4. `PlayerController.mlua` — 퀵슬롯 활성 아이템 `Category=consumable`이면 Ctrl(기존 사용 키)로 사용 dispatch
  5. `item_dataset.csv` — `UseBuffId` 컬럼 신설(공란=사용 불가)
  6. HUD 버프 아이콘 바 — `UIHUDController.mlua` 또는 신규 `UIBuffController.mlua`(+.ui 빌더)
  7. 스탯 소비처 훅: 이동속도/채집속도/공격력/스태미나 회복의 기존 산출 지점에 modifier 적용 1줄
- **Change**:
  ① `BuffDataSet`(BuffId/DisplayName/StatKey/ModifierType[add|mult]/Value/Duration/IconRUID/StackRule[refresh|ignore]). StatKey 초기 4종: `MoveSpeed`/`GatherSpeed`/`AttackPower`/`StaminaRegen` — StatKey→적용 지점 매핑은 테이블 1곳으로 모은다(분산 if 금지).
  ② `PlayerBuffs`: @Sync 활성 버프 JSON(만료 시각 포함), 서버 권위 ApplyBuff/만료 틱, `GetStatModifier(statKey)` 조회 API — 소비처는 이 API만 호출.
  ③ 사용 경로: 퀵슬롯 consumable 선택+Ctrl → `ServerRequestUseItem` → senderUserId·소유·`UseBuffId` 존재(`FindRow`) 검증 → 1개 차감 → ApplyBuff → HUD 갱신. 이름 분기 금지 — 전부 컬럼 판정.
  ④ HUD: 활성 버프 아이콘+남은 초(간단 텍스트 허용), 만료 시 제거.
  ⑤ 파이프라인 실증용 소비 아이템 1종 추가(예: 구운 풀 — Grass 1 제작, 채집속도 소버프) — T17 전에 전체 경로를 검증할 최소 콘텐츠.
- **Acceptance**:
  1. CSV에 버프/아이템 행 추가만으로 신규 소비 아이템이 동작(코드 무수정).
  2. 적용→스탯 반영→만료→원복 / 재사용 시 시간 갱신 / 로그아웃 시 소멸.
  3. `if itemName==` 분기 0건. LSP+refresh 무에러. Play 검증은 제작자 — 보류 보고.
- **충돌 주의**: `PlayerController`/`PlayerInventory`/`UIHUDController`/`item_dataset.csv` 수정 — T17/T18/T20/T23과 같은 체크아웃 동시 작업 금지 (배치 B 선두로 단독 수행).

### T17. [완료 — 2026-07-11 | 제작자 Play 검증 PASS] 요리 시스템 — 조리 냄비 + 음식 버프 (Phase 15-B, 배치 B)
- **구현 요약**: Furnace 일반화(RecipeTableName) + CookingRecipeDataSet + Furniture_CookingPot + 음식 3종. 보고서: `docs/agents/reports/T17-cooking.md`.
- **검증**: **제작자 Play 검증 PASS (2026-07-11)**. 통합: `docs/agents/reports/BATCH-A-B-play-verify-2026-07-11.md`.

- **배경**: 기획서 §3.2. 작물(T6)·고기의 소비처이자 버프 공급처. 생선 레시피는 T18 이후 CSV 행 추가로 — 이 티켓은 생선 없이 완결되게 구성.
- **Target**:
  1. `Furnace.mlua` — **레시피 테이블명/표시 제목을 컴포넌트 프로퍼티로** 일반화(`RecipeTableName` 등, 기본값=기존 제련 테이블 → 기존 화로 무회귀). 하드코딩된 테이블 참조 제거.
  2. `UIFurnaceController.mlua` — 열린 스테이션의 프로퍼티에 따라 제목/레시피 목록 동적.
  3. 신규 `CookingRecipeDataSet.csv`(OutputItem/Input1/Count1/Input2/Count2/CookDuration) — 연료는 기존 `FurnaceFuelDataSet` 공유.
  4. 신규 `Furniture_CookingPot` 모델(Furnace 컴포넌트 재사용+프로퍼티 오버라이드) + `item_dataset`/`RecipeDataSet` 행(냄비 제작 = Stone+Wood).
  5. 음식 4종±: `Category=consumable`+`UseBuffId`(버프는 `BuffDataSet` 행) — 구운 고기(AttackPower)/당근 수프(GatherSpeed)/야채 볶음(MoveSpeed)/잔치 요리(상위·재료 다수).
- **Change**: ① Furnace 일반화(제련 경로 회귀 금지) ② 냄비 설치(가구 경로)→F→투입/연료/타이머/산출 — 화로 UX 동일 ③ 음식/버프/레시피 CSV 채움 ④ 아이콘은 msw-search 우선, 없으면 placeholder+보고.
- **Acceptance**: 기존 화로 제련 회귀 0 / 냄비에서 CSV 레시피 조리→음식 사용→버프 발동 / 신규 요리는 CSV 행 추가만. LSP+refresh 무에러, Play 보류.
- **충돌 주의**: `Furnace.mlua`/`UIFurnaceController.mlua` 소유. `item_dataset`/`RecipeDataSet`은 행 append만.

### T18. [대기] 낚시 시스템 — 낚시터 픽스처 + 원버튼 타이밍 (Phase 15-C, 배치 B) — ⚠️ 선행: T16(PlayerController 공유)

- **배경**: 기획서 §3.3. 제3의 액티비티. **타일 지형 불가침** — 물은 픽스처 엔티티로만 표현한다(§1.3 타일 스킴에 물 문법 없음).
- **Target**:
  1. 신규 `FishDataSet.csv`(FishItem/SpotType[estate|town|field]/Weight/BiteTimeMin/BiteTimeMax/Rarity)
  2. 신규 `FishingSpot.mlua` + 낚시터 모델(연못/물가 스프라이트 — msw-search로 확보, 없으면 placeholder+보고)
  3. 맵 배치: `map/map01.map`(영지 연못 1)·`map/town.map`(분수/우물 1)·사냥터 템플릿(물가 1) — **픽스처 배치만, 타일 편집 금지**
  4. `item_dataset`(낚싯대 `ToolType=rod` — `SwingAction`/`WeaponSlot` 정합 규칙 §T3 준수 + 물고기 아이템 행 3~5종, field 전용 희귀 1종) / `RecipeDataSet`(낚싯대 = Wood 2)
  5. `PlayerController.mlua` — 낚시 상태 진입/취소 최소 훅(미니게임 로직은 `FishingSpot` 쪽에 두어 PlayerController 변경 최소화)
- **Change**: ① 낚싯대 장착 상태에서 낚시터 F → 캐스팅 → BiteTime 랜덤 대기 → 머리 위 `!` 표시 → **0.8초 윈도우 내 재입력=성공**(Weight 추첨→기존 획득 파이프라인으로 지급), 놓치면 재대기 ② 이동/피격 시 취소 ③ SpotType은 낚시터 컴포넌트 프로퍼티 — 어종 풀은 CSV `SpotType` 필터로만.
- **Acceptance**: 낚싯대 미장착 시 안내 후 거부 / 어종·확률·대기시간이 CSV로만 튜닝 / 성공·실패·취소 흐름 정상. LSP+refresh 무에러, Play 보류.
- **충돌 주의**: `PlayerController` 소폭 수정 — 배치 B 순서(T16→T17→T20→T18) 준수. 맵 파일은 픽스처 추가만.

### T19. [대기] 목장/가축 — 우리·먹이·생산 (Phase 15-E, 배치 C)

- **배경**: 기획서 §3.4. 농사와 대칭인 동물 생산 축. **영지 평화 원칙(전투·피격 없음) 유지**.
- **Target**: 신규 `AnimalDataSet.csv`(AnimalId/PurchaseItem/FeedItem/FeedInterval/ProduceItem/ProduceInterval/SpriteRUID/WanderRadius), 신규 `Animal.mlua`+가축 모델 2종(닭/양), 우리 가구(`item_dataset`/`RecipeDataSet` 행+모델), 상점 데이터(가축 구매권), `PersistenceManager.mlua`(가축 목록·급여/생산 시각)
- **Change**: ① 우리 설치(기존 가구 경로) ② 상점에서 가축 구매권 구매 → 우리 근처에서 사용(T16 consumable 경로 재사용, 전용 컬럼 판정) → 가축 스폰+영속 등록 ③ 우리 반경 내 배회(몬스터 wander 로직 재사용, 전투 없음) ④ 먹이 들고 F → 급여(fedAt 갱신) ⑤ 급여 상태에서 ProduceInterval 경과 시 산출물 드롭(기존 드롭 파이프라인) — 타이머는 타임스탬프 환산(오프라인 포함, T6 패턴) ⑥ 닭(먹이=씨앗, 산출=달걀)/양(먹이=Grass, 산출=양털) + 달걀·양털 아이템 행(달걀은 `CookingRecipeDataSet`에 요리 1행 추가).
- **Acceptance**: 구매→스폰→급여→생산→수집 루프 / 재접속 후 가축·타이머 복원 / 신규 가축은 CSV 행 추가만. LSP+refresh 무에러, Play 보류.
- **충돌 주의**: `PersistenceManager` 수정 — 배치 C 내 순차(T19→T21→T22→T23) 준수.

### T20. [대기] 마을 의뢰 게시판 — 일일 납품 의뢰 (Phase 15-D, 배치 B) — ⚠️ 선행: T16(PlayerInventory 공유)

- **배경**: 기획서 §3.5. 일일 접속 훅. 서버 일 번호 시드 → **전 서버 공통 "오늘의 의뢰 3건"**(커뮤니티 대화거리).
- **Target**: 신규 `RequestPoolDataSet.csv`(RequestId/RequiredItem/RequiredCount/RewardItem/RewardCount/Weight), 신규 `BulletinBoard.mlua`+게시판 픽스처(`map/town.map` 배치), 신규 의뢰 UI(.ui 빌더 — 3행 목록+납품 버튼의 간단 팝업), `PlayerInventory.mlua`(납품 RPC), `PersistenceManager.mlua`(일자별 완료 기록)
- **Change**: ① 일 번호 = 서버 시간 기반 day index, 시드 추첨 3건 — **결정론**(재접속/서버 재시작에도 같은 날 같은 의뢰) ② 게시판 F → 오늘의 의뢰+진행 상태 ③ 납품: senderUserId·보유량 검증→차감→보상 지급(기존 획득 경로)→완료 기록(의뢰당 하루 1회) ④ 일 변경 시 자동 리셋 ⑤ 풀에는 **현존 아이템만** 넣을 것(채집/농사 산출물 중심) — 낚시/가축 산출물은 T18/T19 완료 후 행 추가.
- **Acceptance**: 같은 날 모든 유저 동일 의뢰 / 납품→보상→당일 재납품 거부 / 다음 날 새 의뢰 / 재접속 후 완료 기록 유지 / 의뢰 확장은 CSV 행으로만. LSP+refresh 무에러, Play 보류.
- **충돌 주의**: `PlayerInventory`/`PersistenceManager` 수정 — 배치 B 순서 준수(T17 뒤).

### T21. [대기] 날씨 시스템 — 맑음/비/안개 + 성장·입질 보너스 (Phase 15-F, 배치 C) — ⚠️ 선행: T6(완료)·T18

- **배경**: 기획서 §3.6. **보너스만 주는** 날씨(페널티 금지 ⚖️). 낮/밤 연출 파이프라인 재사용.
- **Target**: 신규 `WeatherDataSet.csv`(WeatherId/Weight/DurationMin/DurationMax/OverlayColor/EffectRUID/CropBoostPerMin/FishBiteMult), 신규 `WeatherManager.mlua`(서버 전역 — 낮/밤 매니저와 동일한 배치 위치), 클라 오버레이(밤 오버레이 구현 파일에 날씨 레이어 추가), `Crop.mlua`(비 가속 틱 훅), `FishingSpot.mlua`(입질 배율 훅)
- **Change**: ① 서버 롤: Weight 추첨→Duration 유지→재추첨, @Sync 브로드캐스트 ② 클라: OverlayColor 틴트+EffectRUID(비 파티클 — msw-search, 없으면 틴트만+보고) ③ 비 훅: 1분마다 영지 작물 `plantedAt -= CropBoostPerMin`(타임스탬프 모델 정합 — 서버 권위 즉시 적용) ④ 낚시 훅: BiteTime에 FishBiteMult 적용 ⑤ 초기 3종: 맑음(기본)/비(보너스)/안개(무드 전용).
- **Acceptance**: 날씨 전환·연출 / 비 동안 성장 단축·입질 단축이 **로그로 검증 가능** / 날씨 추가=CSV 행 / 페널티성 효과 0. LSP+refresh 무에러, Play 보류.
- **충돌 주의**: `Crop.mlua`(T6 산출물)·`FishingSpot.mlua`(T18 산출물) 수정 — 두 티켓 완료 후 착수.

### T22. [대기] 도감 & 업적 — 기록·수집 메타 (Phase 15-G, 배치 C) — ⚠️ 선행: T14(UI 골격)

- **배경**: 기획서 §3.7 + `game_design.md` §3.11 도감 제안의 실행. UI는 T14 도감형 골격 재사용.
- **Target**: 통계 카운터 훅(`PlayerInventory` 획득/제작 경로 + `Monster.mlua` 처치 경로), `PersistenceManager.mlua`(statsJson — 아이템별 누적 획득/제작, 몬스터별 처치), 신규 `AchievementDataSet.csv`(AchievementId/DisplayName/ConditionType[collect|kill|craft]/ConditionTarget/ConditionValue/RewardItem/RewardCount/BadgeId[예약 — 공란]), 도감 UI(신규 .ui — T14 레이아웃 재사용, 탭: 아이템/몬스터/업적), 업적 판정+보상 수령 RPC
- **Change**: ① 카운터: 획득/제작/처치 지점에 1줄 훅 — 모든 획득 경로(픽업/제작/상점/의뢰 보상)가 통과하는 지점을 확인해 누락 없이 ② 도감 항목은 `item_dataset`·몬스터 데이터에서 **파생**(미발견=실루엣, 발견=아이콘+누적 수) — 도감 전용 목록 CSV를 만들지 말 것 ③ 업적: 카운터 갱신 시 조건 판정→달성 표시→UI에서 보상 수령(서버 검증·1회 한정) ④ 초기 업적 10종±(첫 수확/첫 어획/첫 요리/슬라임 10마리 등 — **현존 콘텐츠만** 대상으로).
- **Acceptance**: 카운터가 재접속 후에도 누적 유지 / 도감 자동 파생(신규 아이템 추가 시 코드 무수정) / 업적 달성→보상 1회 수령 / 미발견 실루엣. LSP+refresh 무에러, Play 보류.
- **충돌 주의**: `PlayerInventory`/`PersistenceManager`/`Monster.mlua` 수정 — 배치 C 내 순차(T21 뒤).

### T23. [대기] 펫 동반자 — 추종 + 자동 줍기 (Phase 15-H, 배치 C 마지막) — ⚠️ 선행: T16(사용 경로)

- **배경**: 기획서 §3.8. 파밍 편의+애착. 전투 없음.
- **Target**: 신규 `PetDataSet.csv`(PetId/DisplayName/SpriteRUID/MoveSpeed/PickupRange), 신규 `Pet.mlua`+펫 모델 1종(개), 펫 소환 아이템(`item_dataset` 행 — T16 사용 경로 재사용, 전용 컬럼 `UsePetId` 신설), `itemreact.mlua`(자석 픽업을 펫 위치 기준으로도 발동 — `PickupGrace` 규칙 유지), `PersistenceManager.mlua`(활성 펫), 상점(첫 펫 판매)
- **Change**: ① 소환 아이템 사용 → 기존 펫 제거 후 스폰+영속(소환 아이템은 소모하지 않음 = 재사용 티켓 방식) ② 추종: 플레이어와 거리 유지 팔로우, 맵 이동 시 함께 워프 ③ 자동 줍기: PickupRange 내 드롭에 기존 자석 파이프라인 적용(소유권·PickupGrace 규칙 그대로 준수) ④ 초기 1종(개) — 희귀 펫은 T9/T22 보상 행으로 후속.
- **Acceptance**: 소환→추종→맵 동반 이동→반경 자동 픽업(유예 규칙 위반 0) / 재접속 시 활성 펫 복원 / 신규 펫=CSV 행. LSP+refresh 무에러, Play 보류.
- **충돌 주의**: `itemreact`/`PersistenceManager`/`item_dataset` 수정 — T22 후 착수.

### T24. [완료 — 2026-07-11 | refresh Error=0 | 제작자 Play 검증 PASS(성숙 스프라이트·단계 크기 육안 확인)] 작물 맵 비주얼 튜닝 — 성숙 당근 스프라이트 교체 + 단계별 크기 보정 (Phase 14-B 후속)

- **배경**: 제작자 Play 테스트 피드백(2026-07-11) — ① 파종 직후(1단계)가 너무 작고 성숙(3단계)은 다소 큼 ② 성숙 당근의 맵 표현 이미지가 부적합. **아이템 아이콘(`item_dataset`의 Carrot `IconRUID`)은 불변** — 맵 위 성숙 스프라이트(`CropDataSet.StageSprites` 3번째 RUID)만 교체한다. 현재 값: `StageSprites=f0bce7…|88789d…|ccd086…`, `StageScales=0.2|0.22|0.25`. 크기·이미지 최종 결정권은 제작자 — **CSV 셀 수정만으로 재튜닝 가능해야 한다**.
- **Target**: `RootDesk/MyDesk/MapObjects/DataSets/CropDataSet.csv`(`StageSprites` 3번째 RUID + `StageScales`), 조건부 `Crop.mlua`(단계별 스케일 적용이 누락된 경우에만 최소 수정 — 원칙적으로 코드 무변경)
- **Change**:
  ① **성숙 스프라이트 후보 3안**: msw-search로 맵용 당근/뿌리채소 스프라이트 검색(아이콘풍 제외 — "밭에 심겨 잎이 올라온 모습" 우선). 적합한 것이 없으면 msw-painter로 1안 자체 제작해 후보에 포함. 각 후보를 CSV에 임시 적용해 Maker `play`+`screenshot`으로 **밭 위 실제 모습**을 캡처 → 보고서에 3안 비교(RUID+스크린샷) 첨부. **에이전트 추천 1안을 기본 적용**해 두고, 제작자가 다른 안을 고르면 셀 교체만.
  ② **단계 크기 보정 (보스 기본값 — 제작자가 CSV로 최종 튜닝)**: 시각 목표 = 1단계(새싹) 셀 높이의 **~0.4**, 2단계 **~0.6**, 3단계(성숙) **~0.75** (1셀=1unit=100px 기준). ⚠️ 스프라이트마다 원본 해상도가 달라 **같은 scale 값이 같은 화면 크기가 아니다** — 각 단계 스프라이트의 원본 픽셀 크기를 확인해 `StageScales`를 역산하고, 스크린샷으로 실측 확인 후 값을 확정한다.
  ③ 성숙 스프라이트를 교체하면 3단계 스케일도 반드시 재보정(①↔② 연동).
  ④ 그 외 무변경: 아이콘·수확 드롭·상점·성장 시간 불변. `Crop.mlua`가 단계별 스케일을 미적용 중이면 그때만 최소 수정 후 보고.
- **Acceptance**:
  1. 파종→성숙 3단계가 목표 크기 곡선(0.4→0.6→0.75)으로 자연스럽고, 성숙 이미지가 아이콘과 별개로 교체됨(아이콘 불변).
  2. 보고서에 후보 3안 스크린샷 + 최종 적용값 + "크기/이미지 재튜닝은 `CropDataSet.csv` 셀 수정만"임을 명시.
  3. refresh 빌드 무에러. 최종 픽·감성 판정은 제작자(보고서 §6 체크리스트로 전달).
- **구현 요약 (2026-07-11 재수행)**: 성숙=공식 잎 식물 `1f4f5c80fd3f48c69f4f70ce98284d08`(안 A). 후보 B=`73bf31ff…` C=`8cd44c3…`. StageScales=`0.55|0.70|0.80`. UGC `f5dcd9…` 제외(Play unavailable). 아이콘 `ccd086…` 유지. 보고서: `docs/agents/reports/T24-crop-visual-tuning.md` + `t24-candidates/`.
- **충돌 주의**: `CropDataSet.csv`(+조건부 `Crop.mlua`)만 — 어느 배치와도 병행 가능. 단 T21(날씨 — `Crop.mlua` 훅)과는 순차.


### T25. [코드 완료 — 2026-07-11 | 퀘스트 훅 잔여 | Play 보류] 레시피 해금 계층 인프라 — 유저별 해금 목록 + 지급 API + 제작 게이트 (배치 A: T14 직후, T7/T9의 선행)

- **배경**: ⚖️ 2026-07-11 보스 확정 — **"제작법은 콘텐츠 보상이다"**: 기본 해금은 최소(T1 생존 필수)로 줄이고, 나머지 제작법은 연구(T7)·퀘스트·도안(T9)으로 **하나씩** 획득한다. 세 소스가 공유할 단일 해금 계층을 먼저 깐다. 설계 원문: `game_design.md` §3.3 "레시피 해금 계층". ⚠️ 선행: T14(`UnlockId`/`UnlockHint` 컬럼+잠금 표시 훅).
- **Target**:
  1. `PersistenceManager.mlua` — 유저별 `unlockedRecipeKeys`(문자열 집합) 영속 필드 (구세이브 폴백 `or "[]"` — 마이그레이션 없이 로드)
  2. `PlayerInventory.mlua` — `GrantRecipeUnlock(unlockId)`(@Server, **멱등**: 보유 시 no-op / 신규 시 저장+MarkDirty+클라 토스트 "새 제작법을 익혔다: <레시피명>") + `ServerRequestCraft` 게이트(`UnlockId` 비공란 & 미보유 → 거부+피드백)
  3. `UICraftingController.mlua` — T14의 잠금 표시 훅에 실제 해금 보유 데이터 연결(@Sync 프로퍼티 또는 조회)
  4. `RecipeDataSet.csv` — 기존 전 레시피에 `UnlockId`/`UnlockHint` 배정(아래 정책)
  5. 퀘스트 보상 훅 — 기존 퀘스트 시스템의 보상 지급 지점에 `RewardUnlockId` 처리 추가(퀘스트 데이터에 컬럼 신설). ⚠️ 퀘스트가 MSWPackages 패키지 기반이면 패키지 내부를 수정하지 말고 완료 이벤트 훅으로 연결 — 구조 확인 후 불명확하면 질문.
- **Change**:
  ① **해금 배정 정책(보스 확정)**: **Tier 1 = 기본 해금**(`UnlockId` 공란 — Hand Axe/Stone Pickaxe 등 온보딩 퀘스트 라인이 요구하는 것 전부 포함, 온보딩이 막히면 안 됨). **Tier 2+ = 원칙적으로 잠금**: 상위 도구·가공 계열=연구 해금(T7에서 연결) / 생활 콘텐츠 입문(냄비·낚싯대·우리 등 Phase 15 신규)=퀘스트 보상 / 희귀·특수=도안(T9). 배정은 CSV에서 완결 — 코드에 목록 금지.
  ② `UnlockHint` 문구 규약: "연구소: 'OOO' 연구" / "퀘스트 'OOO' 보상" / "어딘가의 도안…" — 잠금 UI에 그대로 노출(T14 훅).
  ③ **소스 연결 규약**(후속 티켓 준수 사항): 연구 완료(T7)→`GrantRecipeUnlock(ResearchDataSet.UnlockRecipeId)` / 도안 사용(T9)→`item_dataset.UseUnlockId`(T16 consumable 경로) / 퀘스트 보상→⑤ 훅. 신규 소스(업적 보상 등)도 GrantRecipeUnlock 호출만으로 확장.
  ④ **기존 유저 보정(1회)**: 잠금 도입 시 이미 만들어 쓰던 레시피가 잠기면 반발이 크다 — 로드 시 1회, **인벤토리/설치물에 산출물이 존재하는 레시피는 자동 해금** 부여. 구현 부담이 크면 임의 생략하지 말고 보류+질문.
  ⑤ 시범 배정 1건: 기존 온보딩 퀘스트 중 1개에 `RewardUnlockId`를 걸어 퀘스트 소스 실동작을 검증.
- **Acceptance**:
  1. 잠긴 레시피 = 서버 제작 거부 + 제작창 실루엣·자물쇠·힌트(T14 훅 경유). 해금 즉시 UI 갱신+토스트.
  2. `GrantRecipeUnlock` 멱등·영속(재접속 유지). 퀘스트 보상 해금 1건 실동작.
  3. 해금 배정 변경이 CSV 수정만으로 가능. 이름 분기 0건. LSP 진단 + refresh 빌드 로그 무에러. Play 검증은 제작자 — 보류로 보고.
- **충돌 주의**: `PlayerInventory`/`PersistenceManager`/`UICraftingController` 수정 — T14 완료 직후 **단독 수행** (T7/T9/배치 B가 의존).
- **구현 요약 (2026-07-11)**: `UnlockedRecipesJson` 영속 + `Has/GrantRecipeUnlock`(멱등·토스트) + `ServerRequestCraft` UnlockId 게이트 + `UICraftingController.IsRecipeUnlocked` 인벤 보유 조회 + 로드 시 보유 산출물 1회 마이그레이션. Change ①~④ 이행. 보고서: `docs/agents/reports/T25-recipe-unlock-infra.md`.
- **⚠️ 지휘자 검수(2026-07-11)**: (a) **Change ⑤(퀘스트 `RewardUnlockId` 훅) 미이행** — 퀘스트 시스템 구조 확인 필요로 잔여. Acceptance 2의 "퀘스트 보상 해금 1건 실동작" 미충족 → **신규 T27로 분리**. (b) T25 보고서 §4가 "refresh 후 빌드 확인 예정"으로 자체 근거가 비어 반려 대상이었으나, **직후 T26 세션이 동일 파일(`UICraftingController.mlua` 등)을 포함해 refresh 빌드 Error=0을 근거와 함께 확인**했으므로 코드 빌드는 실질 검증된 것으로 간주(T26 보고서 §4). 향후 보고서는 §4에 빌드 근거를 반드시 자체 기재할 것.

### T26. [완료 — 2026-07-11 | refresh Error=0 | 제작자 Play 검증 PASS(칩 탭 표시·라벨 정상 육안 확인)] 제작창 필터 바 비주얼 개편 — 순환 화살표 → 탭/칩 행 + 디자인 철학 준수 (T14 후속)

- **배경**: T14 Play 육안(제작자, 2026-07-11) — 티어/카테고리 필터가 **prev-next 순환(화살표) 방식**으로 구현돼 어색하다. 원 채택안([crafting_ui_concepts.md](./crafting_ui_concepts.md) 추천 조합)은 **명시적 탭**이었다 — 순환 UI는 선택지 전체가 안 보이고 현재 위치 파악이 어렵다. **팝업 크기·비율 변경 허용(보스 승인)** — 탭이 들어갈 공간을 위해 제작창을 키워도 된다.
- **🎨 이 티켓의 최우선 요구 — 디자인 철학 준수 (§1.2 규칙 6)**: 착수 전 msw-ui-system 스킬 SKILL.md + `references/ui-aesthetics.md` **전문** + `references/layout-recipes.md`를 로드하라. 특히 **§0 Gray Box Syndrome 회피 / §1 비주얼 아이덴티티 선결정(기존 인벤토리·HUD와 동일 아이덴티티 — 새 스타일 발명 금지) / §2 패널 해부 / §5 간격·정렬 리듬**을 적용하고, **§7 자가 리뷰 루브릭 평가 표를 보고서에 첨부**한다(누락 시 미완료).
- **Target**: `ui/PopupGroup.ui`(TierBar/CategoryBar 재구성 — 빌더 `scripts/build_ui.js` 경유), `RootDesk/MyDesk/UI/Scripts/UICraftingController.mlua`(탭 클릭 바인딩 — 필터 로직 자체는 무변경)
- **Change**:
  ① **카테고리 필터**: 순환 화살표 → **가로 탭/칩 행** — "전체"+CSV 파생 카테고리를 전부 동시 노출, 선택 탭은 색+형태 이중 하이라이트, 클릭 즉시 필터. CSV 값 동적 생성 유지 — 카테고리 수가 늘면 탭이 자동 증가(개수·이름 하드코딩 금지).
  ② **티어 필터**도 같은 문법의 탭 행으로 통일(순환 화살표 제거). 잠금 티어 표시 훅(T14 ②) 유지.
  ③ **팝업 크기/레이아웃 재배치 허용**: 탭 2행 + 좌측 그리드 + 우측 상세가 ui-aesthetics §5 간격 리듬에 맞게. 해상도·세이프에어리어 점검(msw-ui-system 규칙).
  ④ **기능 회귀 금지**: 필터링 로직·해금 훅(`IsRecipeUnlocked`)·C/Space·`ServerRequestCraft`·T25 게이트 전부 무변경.
  ⑤ Maker `screenshot`으로 **before/after 캡처**를 보고서에 첨부(제작자 최종 육안 판정용).
- **Acceptance**:
  1. 카테고리/티어가 탭 행으로 전 항목 노출 + 선택 상태가 한눈에 구분.
  2. 보고서에 ui-aesthetics §7 루브릭 자가 평가 표 + before/after 스크린샷 첨부.
  3. `RecipeDataSet.csv`에 카테고리/티어 값 추가 시 탭 자동 반영(코드 무수정).
  4. 기능 회귀 0 · LSP+refresh 빌드 무에러. 최종 육안·감성 판정은 제작자(Play 보류로 보고).
- **구현 요약 (2026-07-11)**: 순환 버튼 제거 → `ChipTemplate` Clone으로 티어/카테고리 칩 행. 선택=금색+크기. 팝업 1000×780. 보고서 `docs/agents/reports/T26-crafting-filter-tabs.md` + `t26-screens/before-play.png`·`after-play.png`.
- **충돌 주의**: `PopupGroup.ui`/`UICraftingController.mlua` 소유 — T25(동 파일 수정, 완료됨) 이후이므로 충돌 없음. **T7(연구 UI가 이 골격 재사용) 착수 전에 완료할 것**.

### T27. [대기] 퀘스트 보상 → 레시피 해금 연결 (`RewardUnlockId`) — T25 잔여 분리

- **배경**: T25가 해금 인프라(`GrantRecipeUnlock`)와 연구·도안 소스 규약까지 깔았으나, **퀘스트 보상 소스(Change ⑤ `RewardUnlockId` 훅)는 퀘스트 시스템 구조 확인 필요로 미이행**(T25 보고서 §5). 이 티켓이 그 잔여를 완결한다. §3.3 "레시피 해금 계층"의 3소스(연구/퀘스트/도안) 중 퀘스트 축.
- **선결 조사(착수 전 필수)**: 현행 퀘스트 시스템이 **MSWPackages 퀘스트 패키지 기반인지 자체 구현인지** 먼저 확인하라 (msw-packages 스킬 + 코드 grep). 패키지 기반이면 **패키지 내부 파일 수정 금지** — 완료 이벤트/콜백 훅으로만 연결. 구조가 불명확하면 임의 판단 말고 질문.
- **Target**: 퀘스트 데이터셋(보상 컬럼 `RewardUnlockId` 신설), 퀘스트 완료 보상 지급 지점(패키지면 완료 이벤트 리스너 — 자체 구현이면 해당 스크립트), 필요 시 시범 퀘스트 1건 데이터.
- **Change**: ① 퀘스트 보상 정의에 `RewardUnlockId`(공란=없음) 컬럼 추가 ② 퀘스트 완료 시 값이 있으면 `PlayerInventory:GrantRecipeUnlock(RewardUnlockId)` 호출(T25 API 재사용 — 신규 해금 로직 발명 금지) ③ 시범 배정: 온보딩 퀘스트 1건에 생활 콘텐츠 입문 레시피(예: 조리 냄비 또는 낚싯대 — 해당 레시피 `UnlockId`와 일치) 1개 연결.
- **Acceptance**: 시범 퀘스트 완료 → 해당 레시피 해금 토스트 → 제작창 잠금 해제·제작 가능, 재접속 후 유지. 이름 분기 0건. LSP+refresh 빌드 무에러(§4에 빌드 근거 자체 기재). Play 검증은 제작자 — 보류 보고.
- **충돌 주의**: `PlayerInventory`(GrantRecipeUnlock 호출부만) + 퀘스트 시스템 파일. 배치 A의 T7/T9와 독립이라 병행 가능하나, T7과 같은 세션에서 묶어 수행하면 효율적(둘 다 해금 소스 연결).

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

보고는 **세 곳**에 남긴다 (셋 다 필수 — 하나라도 빠지면 작업 미완료):
1. **채팅 응답** — 위 1~3 요약.
2. **이 문서의 해당 T항목 상태 갱신** — `[대기]`→`[진행]`→`[완료]`/`[보류]` + 검증 수준 병기.
3. **보고서 파일 작성 (2026-07-10 신설)** — [reports/_TEMPLATE.md](./reports/_TEMPLATE.md)를 복사해 `docs/agents/reports/T<n>-<kebab-슬러그>.md`로 저장 (예: `T6-farming-mvp.md`).
   - T항목당 파일 1개. 재작업 시 새 파일을 만들지 말고 같은 파일을 갱신하고 §7 이력에 append.
   - §4 검증 섹션에는 **실행한 검증만** 근거(로그 발췌)와 함께 적고, 못 한 것은 "보류" 명시.
   - §6에 해당 T항목의 제작자 런타임 체크리스트를 체크박스로 복사해 둔다 (제작자가 Play 검증 후 체크).

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
5. 종료 시 반드시 `docs/agents/reports/_TEMPLATE.md` 양식으로 보고서 파일을 `docs/agents/reports/T<n>-<슬러그>.md`에 작성하라 (§4의 세 번째 필수 산출물 — 없으면 작업 미완료).
6. Play 런타임 검증은 네 범위가 아니다 — LSP 진단·refresh 빌드 로그까지만 검증하고, 나머지는 "런타임 검증 보류(제작자 수행)"로 정확히 보고하라.
```

> **배치 킥오프 프롬프트 (여러 T를 일괄 위임할 때 — 2026-07-11 신설)**
> 배치 목록(`T<a> → T<b> → …`)만 §3 상단 실행 계획의 배치 정의로 바꿔 그대로 붙여넣는다.

```
너는 이 저장소(MSW 게임 프로젝트)의 구현 담당 에이전트다. 이번에는 **배치(연속 작업 목록)**를 위임받아 대규모로 수행한다.

1. 먼저 `AGENTS.md`, `docs/agents/subagent-handoff.md` §1(공통 컨텍스트), 그리고 `docs/design/phase15-living-world.md`(해당 시)를 전부 읽어라.
2. §3 작업 큐에서 **T<a> → T<b> → T<c> → T<d>** 를 이 순서대로 하나씩 수행하라. **반드시 순차** — 앞 항목의 보고(상태 갱신+보고서 파일)까지 완료한 뒤 다음 항목에 착수한다. 순서를 바꾸거나 병합하지 마라.
3. 각 항목마다: 시작 시 [진행] 표기 → 구현 → LSP 진단+refresh 빌드 검증 → §4 보고 3종(채팅 요약 / T항목 상태 갱신 / `docs/agents/reports/T<n>-*.md`) 완료. 보고서는 항목당 1개씩 따로 작성한다.
4. 어느 항목이 질문 대기로 막히면(스펙 모호/하드코딩 불가피) 그 항목만 [보류]+질문을 남기고 다음 항목으로 진행하라. 단, 보류 항목에 의존하는 항목(예: T17←T16)은 착수하지 말고 건너뛴 사실을 보고에 명시하라.
5. 배치 도중 새로 발견한 문제는 §3에 신규 T항목으로 추가만 하고 임의 착수하지 마라. Target/Change/Acceptance 밖의 리팩터링 금지.
6. Play 런타임 검증은 네 범위가 아니다 — 항목별로 "런타임 검증 보류(제작자 수행)"로 정확히 보고하라.
7. 배치 종료 시 최종 요약(완료/보류/건너뜀 목록 + 제작자가 Play로 확인할 통합 체크리스트)을 채팅으로 보고하라.
```
