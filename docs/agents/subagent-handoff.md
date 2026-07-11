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
7. **데이터셋 행 접근 API (2026-07-11 신설 — T35 사고 재발 방지)**: `UserDataSet:FindRow()`가 반환하는 `UserDataRow`는 **`Count()`와 `GetItem(columnName)` 두 메서드만 제공**한다. `row.RowIndex`는 존재하지 않는 프로퍼티(nil)이며 이를 `GetCell`에 넘기면 `[LEA-3005] InvalidArgument`로 호출한 서버 루프가 통째로 중단된다. 행 값 조회는 반드시 `row:GetItem("컬럼명")`으로 하고, 존재가 불확실한 컬럼은 pcall 가드를 쓴다(없는 컬럼 GetItem은 LEA-3011 — `Furnace.mlua` readDur 선례).
8. **크로스 스크립트 API 호출 전 정의 확인 (2026-07-11 신설 — T18 치명 오류 재발 방지)**: 다른 스크립트의 메서드/프로퍼티를 호출하는 코드를 쓰기 전에 **반드시 대상 `.mlua` 파일에서 해당 정의를 검색해 존재와 시그니처를 확인**한다. 정의가 없으면 추정으로 호출하지 말 것 — 소유 레인 밖 파일에 정의를 새로 만들어 붙이는 것도 금지, [보류]+질문으로 전환한다. "아마 있을 것" 추정 호출이 직전 배치의 치명 런타임 오류 원인이었다.
9. **세이브 경로 Yield 금지 (2026-07-11 신설 — T37 인벤토리 전량 유실 사고 재발 방지)**: `SavePlayerData` 등 영속 저장 루틴 안에서 `GetAndWait`/`SetAndWait` 외의 **추가 Yield 호출(다른 GetAndWait, 타이머 대기 등)을 절대 넣지 않는다**. Yield 사이에 플레이어 엔티티가 파괴되면 이후 읽는 컴포넌트 값이 nil → 기본값 폴백으로 **세이브가 빈 데이터로 덮인다**. 저장에 필요한 컴포넌트 값은 루틴 진입 직후 전부 지역 변수로 선캡처하고, 외부 조회가 필요하면 세션 캐시를 쓴다.

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

> - **감사 배치 T28~T35 — 제작자 Play PASS(2026-07-11)**: 몬스터 식별 체계(`MonsterId`)+코인 드롭 복구(T28) / 채집 XP 컬럼화·`SeedDrop*` 죽은 컬럼 정리(T29) / 가구 프리뷰·화로 외형 데이터화(T30) / 버프 정합 ①(T31) / 데이터 위생 ①③(T32) / 통화·포탈 컬럼화 `IsCurrency`·`FurnitureKind`·`IsDefault`(T33) / 스폰 튜닝·보물상자 데이터화 `SpawnTuningDataSet`·`TreasureChestSpawnDataSet`(T34) / `UserDataRow.RowIndex` API 오용 핫픽스(T35 — §1.2 규칙 7의 유래). 상세: `reports/T28-*`~`T35-*`. 지휘자 일괄 refresh 396건 Error=0(2026-07-11).

---

## 3. 작업 큐 (하위 에이전트 위임 대상)

> 상태: `[대기]` / `[진행]` / `[완료]` / `[보류]`
> 각 항목은 **Target(파일) / Change(변경) / Acceptance(완료 기준)** 3요소를 반드시 채운다.
>
> 🧭 **실행 계획 (지휘자 갱신 2026-07-11)**
> - **✅ 감사 배치(T28~T35) Play PASS(제작자, 2026-07-11)** — §2 포인터 참조. 잔존 보류: T31②(고기 축)·T32②(Bed 가격) = 보스 확정 대기(아래 축약 항목).
> - **생활 배치 결산**: 레인 1(T20→T27) 코드 완료·Play 보류 — 통합 확인 항목: 의뢰 게시판 루프 + 퀘스트 107 완료→냄비 레시피 해금. **레인 2(T18→T15)는 반려** — T18이 §4 보고 3종 전부 누락한 채 미완 종료 + 존재하지 않는 PlayerController API 호출로 치명 런타임 오류(제작자 응급 수정). 재작업은 아래 버그픽스 배치 레인 2.
> - **🔧 버그픽스·완결 배치 (⚖️ 2026-07-11 보스 지시 — 2에이전트 병렬)**:
>   - **레인 1 (버그픽스 축)**: **T36(자원 통과 버그) → T37(로그아웃 리스폰 정책) → T38(몬스터 전투 체감)**. 소유: `Player/Scripts/PlayerController.mlua`·`PersistenceManager.mlua`, `MapObjects/Scripts/ResourceSpawner.mlua`·`ResourceOccupiedArea.mlua`, `Monster/Scripts/MonsterAI.mlua`·`MonsterMeleeAttack.mlua`, 몬스터 모델 4종, (필요 시) `ResourceDataSet.csv`.
>   - **레인 2 (낚시 완결 축)**: **T18(반려 재작업 — 스폿 실체화) → T15(도구 아트 잔여)**. 소유: `Furniture/Scripts/FishingSpot.mlua`, 낚시터 모델 신규, `map/map01.map`·`map/town.map`·`map/template_field.map`, `FishDataSet.csv`, `item_dataset.csv`, `RecipeDataSet.csv`. ⚠️ **PlayerController/ResourceSpawner 수정 절대 금지(레인 1 소유)** — 필요해 보이면 [보류]+질문.
>   - **병렬 규약 (2026-07-11 개정)**: ① 상대 레인 소유 파일은 읽기만, 수정 절대 금지 ② 이 문서 상태 갱신은 자기 T항목 블록 라인만 편집 ③ 보고서 파일은 티켓별 분리 ④ **refresh는 티켓 완료마다 1회 수행하고 빌드 Error 수를 보고서 §4에 기재**(레인 말미 몰기 폐지 — 직전 두 배치 연속 검증 공백의 원인). "refresh 진행 중" 에러 시 대기 후 재시도 ⑤ 레인 내부 순서 엄수.
> - **보류 유지**: 배치 C(T19→T21→T22→T23 — T36 완료 후 발행 검토), T4(테라스 아트).
>
> 🧭 **실행 계획 갱신 (지휘자 2026-07-12)**
> - **Play 검증 대기 7건 (제작자 수행)**: T36 · **T37🔴(세이브 유실 핫픽스 — 최우선)** · T38 / T18 · T15 / T20 · T27. 체크리스트는 각 보고서 §6.
> - **⚖️ 2026-07-12 보스 확정**: ① T31② **지금 채택**(T19 가축과 식재료 축 분리 — 독립 진행) ② T32② Bed **BuyPrice=50** ③ T39 원거리 1호 = **HornMushroom**.
> - **🍖 배치 D 발행 (2026-07-12 — 단일 에이전트 순차)**: **T32 → T31 → T39**. 소유: `item/DataSets/*.csv`(+userdataset), `Furniture/DataSets/CookingRecipeDataSet.csv`, `MapObjects/DataSets/ItemDropDataSet.csv`, `Monster/Scripts/MonsterAI.mlua`, `Monster/Models/*`(HornMushroom + 신규 투사체 모델). ⚠️ Play 대기 티켓(T36~38·T18·T15·T20·T27)의 재작업이 발생하면 지휘자가 조정 — 배치 D는 해당 파일 중 `MonsterAI.mlua`만 겹침(보스가 리스크 수용).
> - **T39 경위**: 직전 세션이 큐 항목 없이 착수 후 무보고 종료(커밋 d335015 — 무보고 4회차). `MonsterProjectile.mlua` 컴포넌트만 존재. 지휘자가 실사 후 소급 발행.
> - **배치 C는 버그픽스 배치 Play PASS 후 발행** (지휘자 결정 2026-07-12 — `PersistenceManager` 등 소유 겹침으로 재작업 충돌 방지).
### T4. [대기] 경계 테라스/절벽 아트 정리
- **배경**: `TerraceTop`/`CliffFace`/`Big Wall`은 이전 스킴의 임시 아트 그대로다. 신규 grass 기준 아트와 톤이 안 맞을 수 있고, 상위 레이어 테라스 타일이 깔린 뒤 플레이어 아바타 SortingLayer 최종 판정도 미완(`docs/design/skill-tree-plan.md` §5 4번).
- **Target**: `RootDesk/MyDesk/wall.tileset`(Maker에서 아트 교체) + 필요 시 `scripts/build_maps.cjs` 밴드/데코 페인팅
- **Change**: 신규 타일 아트 확정 후 테라스 링/절벽면 리스킨, 플레이어가 테라스 타일 아래로 숨는지 확인.
- **Acceptance**: 경계 밴드 비주얼이 잔디/흙 아트와 이어지고, 아바타가 지형 위에 정상 렌더.

### T15. [완료 — 지휘자 대리 검수 2026-07-11(4종 전용 RUID 교체 실사 + refresh Error=0) | ⚠️ 에이전트 보고서 부재 | Play 육안 보류(제작자)] 지형 편집·낚시 도구 전용 아트 — Shovel/Hoe/Grass Seed/Fishing Rod placeholder 교체 (Phase 14-G)

- **배경**: Shovel·Hoe는 스톤 곡괭이 RUID, Grass Seed는 Grass RUID 재사용 placeholder — 인벤/퀵슬롯에서 구분 불가. Fishing Rod도 `WeaponRUID`가 스톤 곡괭이 재사용(아이콘은 전용 여부 확인). 코드 무변경 CSV-only.
- **Target**: `item/DataSets/item_dataset.csv`의 Shovel/Hoe/Grass Seed/Fishing Rod 행 — `IconRUID`/`WeaponRUID` 셀 교체(`EntryId` 드롭 모델은 placeholder 유지 허용).
- **Change**: ① `IconRUID`: msw-search 검색 → 없으면 msw-painter 제작·업로드 후 교체 ② `WeaponRUID`: 아바타 아이템 리소스 필수 — msw-search 아바타 검색, 적합 없으면 placeholder 유지+보고(임의 대체 금지) ③ `SwingAction`/`WeaponSlot`/`TerrainEditAction`/`ToolType` 값 절대 불변. ④ (완료됨) RecipeDataSet Cooking Pot 행 `UnlockId=quest_cooking_pot`/`UnlockHint` 셀은 **기입 완료 확인(지휘자 2026-07-11)** — 수행 불요.
- **Acceptance**: 4종 도구가 전용 아트로 구분 표시, CSV 외 변경 0, 티켓 완료 즉시 refresh Error 수 보고서 기재. 육안은 제작자.
- **충돌 주의**: **레인 2 마지막** — T18 재작업 완료 후.

### T18. [완료 — 지휘자 대리 검수 2026-07-11 | ⚠️ 에이전트 보고서 부재(무보고 3회차) | Play 보류(제작자)] 낚시 시스템 완결 — 낚시터 스폿 실체화 + 루프 마감 (Phase 15-C)

- **지휘자 대리 검수(2026-07-11 — 세션이 보고서 없이 종료되어 지휘자가 산출물 실사로 대체)**: ✅ `FishingSpot_Pond.model` 존재 ✅ map01/template_field/town 3맵 배치 확인 ✅ `FishDataSet` town 어종 2행 추가 ✅ rod 게이트는 `PlayerController.IsEquippedFishingRod`(L2216 — `ToolType=="rod"` 컬럼 판정, 이름 분기 없음)+취소 RPC 존재 ✅ 지휘자 refresh 431건 **Error=0**(Warning 8=기존 소음). **잔여 = 제작자 Play**: 세 스폿에서 캐스팅→입질→성공/놓침/조기입력/이동취소 + 낚싯대 미장착 거부.

- **반려 사유(지휘자 검수 2026-07-11)**: 직전 세션이 ① §4 보고 3종(채팅/상태 갱신/보고서 파일) 전부 누락한 채 미완 종료 ② **존재하지 않는 PlayerController API를 추정 호출하는 코드로 치명 런타임 오류** 유발(제작자 응급 수정 — §1.2 규칙 8 신설 계기) ③ 낚시터 스폿 엔티티가 세계에 없어 시스템 기동 불가. 재작업은 아래 실사에서 출발하며 **이미 있는 것을 재구현하지 않는다**.
- **현재 자산 실사(지휘자 확인 2026-07-11 — 그대로 사용, 재구현 금지)**:
  - `Furniture/Scripts/FishingSpot.mlua`: 세션 관리/입질 타이머/0.8s 성공 윈도우/가중치 추첨(`RollFish`) 구현 완료.
  - `PlayerController.mlua`: `FishingState`·`ActiveFishingSpot` 프로퍼티, `FindNearbyFishingSpot`(L2192), `ServerRequestFishingInteract`(L2230), 이동 시 취소 분기(L288/L1978), `ClientShowMineFeedback` — **전부 존재. 이 파일 수정 금지(레인 1 소유)**, 부족하면 [보류]+질문.
  - 데이터: `FishDataSet.csv` 6행(estate/field), `item_dataset` fishing_rod(`ToolType=rod`/`swingT1`/`twohand` ✓)+어류(Carp/Shrimp/Salmon/Tuna), `RecipeDataSet` Fishing Rod(Wood 2) — 전부 존재.
- **잔여 Change (이번 범위)**:
  ① **낚시터 모델 신설**: `RootDesk/MyDesk/Furniture/Models/FishingSpot_Pond.model` — `FishingSpot` 컴포넌트(+`SpotType`)와 상호작용 트리거 부착, SpriteRUID는 msw-search로 연못/물웅덩이 확보(없으면 placeholder+보고). Model Work Preflight(model.md + builder-protocol.md 전문) 필수.
  ② **배치는 맵 파일로만**(절차 스폰 금지 — `ResourceSpawner`는 레인 1 소유): `map01.map` 영지 연못 1(SpotType=estate) / `template_field.map` 물가 1(SpotType=field) / `town.map` 분수 1(SpotType=town) — MapBuilder 경유, 기존 점유·포탈과 겹치지 않는 셀. `FishDataSet`에 town 어종 행 1~2 추가.
  ③ **정합 확인**: 낚싯대 미장착 시 거부+안내가 실제로 동작하는지 확인(`ServerRequestFishingInteract`의 rod 검증 존재 여부 — 없으면 `FishingSpot.StartFishing` 쪽에 `ToolType=rod` 장착 검증 추가. 이름 분기 금지, `item_dataset.ToolType` 컬럼 판정). BiteTime 추첨(StartFishing)과 어종 추첨(PullRod)의 이중 추첨 구조는 **유지 허용** — 임의 리팩터링 금지.
  ④ 캐스팅/입질/성공/실패/취소에 `[FISHING]` 서버 로그(제작자 Play 검증용).
- **Acceptance**: ① 세 스폿에서 F→캐스팅→입질(!)→0.8s 내 재입력 성공 시 SpotType별 어종 지급, 놓침/조기 입력/이동 취소 정상 ② 어종·확률·대기시간 튜닝=CSV만 ③ PlayerController 무수정·이름 분기 0건 ④ **티켓 완료 즉시 refresh 수행, 빌드 Error 수를 보고서 §4에 자체 기재** ⑤ §4 보고 3종 필수 — 누락 시 재반려. Play 최종 확인은 제작자.
- **충돌 주의**: **레인 2** — `PlayerController`/`PersistenceManager`/`ResourceSpawner` 수정 금지(레인 1 소유).

### T19. [대기] 목장/가축 — 우리·먹이·생산 (Phase 15-E, 배치 C)

- **배경**: 기획서 §3.4. 농사와 대칭인 동물 생산 축. **영지 평화 원칙(전투·피격 없음) 유지**.
- **Target**: 신규 `AnimalDataSet.csv`(AnimalId/PurchaseItem/FeedItem/FeedInterval/ProduceItem/ProduceInterval/SpriteRUID/WanderRadius), 신규 `Animal.mlua`+가축 모델 2종(닭/양), 우리 가구(`item_dataset`/`RecipeDataSet` 행+모델), 상점 데이터(가축 구매권), `PersistenceManager.mlua`(가축 목록·급여/생산 시각)
- **Change**: ① 우리 설치(기존 가구 경로) ② 상점에서 가축 구매권 구매 → 우리 근처에서 사용(T16 consumable 경로 재사용, 전용 컬럼 판정) → 가축 스폰+영속 등록 ③ 우리 반경 내 배회(몬스터 wander 로직 재사용, 전투 없음) ④ 먹이 들고 F → 급여(fedAt 갱신) ⑤ 급여 상태에서 ProduceInterval 경과 시 산출물 드롭(기존 드롭 파이프라인) — 타이머는 타임스탬프 환산(오프라인 포함, T6 패턴) ⑥ 닭(먹이=씨앗, 산출=달걀)/양(먹이=Grass, 산출=양털) + 달걀·양털 아이템 행(달걀은 `CookingRecipeDataSet`에 요리 1행 추가).
- **Acceptance**: 구매→스폰→급여→생산→수집 루프 / 재접속 후 가축·타이머 복원 / 신규 가축은 CSV 행 추가만. LSP+refresh 무에러, Play 보류.
- **충돌 주의**: `PersistenceManager` 수정 — 배치 C 내 순차(T19→T21→T22→T23) 준수.

### T20. [코드 완료 — 2026-07-11 | refresh 레인 말미(T27) | 런타임 검증 보류(제작자 수행)] 마을 의뢰 게시판 — 일일 납품 의뢰 (Phase 15-D, 배치 B) — ⚠️ 선행: T16(PlayerInventory 공유)

- **배경**: 기획서 §3.5. 일일 접속 훅. 서버 일 번호 시드 → **전 서버 공통 "오늘의 의뢰 3건"**(커뮤니티 대화거리).
- **Target**: 신규 `RequestPoolDataSet.csv`(RequestId/RequiredItem/RequiredCount/RewardItem/RewardCount/Weight), 신규 `BulletinBoard.mlua`+게시판 픽스처(`map/town.map` 배치), 신규 의뢰 UI(.ui 빌더 — 3행 목록+납품 버튼의 간단 팝업), `PlayerInventory.mlua`(납품 RPC), `PersistenceManager.mlua`(일자별 완료 기록)
- **Change**: ① 일 번호 = 서버 시간 기반 day index, 시드 추첨 3건 — **결정론**(재접속/서버 재시작에도 같은 날 같은 의뢰) ② 게시판 F → 오늘의 의뢰+진행 상태 ③ 납품: senderUserId·보유량 검증→차감→보상 지급(기존 획득 경로)→완료 기록(의뢰당 하루 1회) ④ 일 변경 시 자동 리셋 ⑤ 풀에는 **현존 아이템만** 넣을 것(채집/농사 산출물 중심) — 낚시/가축 산출물은 T18/T19 완료 후 행 추가.
- **Acceptance**: 같은 날 모든 유저 동일 의뢰 / 납품→보상→당일 재납품 거부 / 다음 날 새 의뢰 / 재접속 후 완료 기록 유지 / 의뢰 확장은 CSV 행으로만. LSP+refresh 무에러, Play 보류.
- **충돌 주의**: `PlayerInventory`/`PersistenceManager` 수정 — 배치 B 순서 준수(T17 뒤). **레인 1**.
- **구현 요약 (2026-07-11)**: RequestPool 8행·BulletinBoard·RequestPopup·ServerRequestDeliver·영속 day/완료. ui-aesthetics §7 8/8. 보고서: `docs/agents/reports/T20-bulletin-board.md`.
- **검증**: 레인 말미 T27과 일괄 Maker refresh 빌드 **Error=0**. **런타임 검증 보류(제작자 수행)**.

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

### T27. [코드 완료 — 2026-07-11 | refresh 빌드 Error=0 | 런타임 검증 보류(제작자 수행)] 퀘스트 보상 → 레시피 해금 연결 (`RewardUnlockId`) — T25 잔여 분리

- **배경**: T25가 해금 인프라(`GrantRecipeUnlock`)와 연구·도안 소스 규약까지 깔았으나, **퀘스트 보상 소스(Change ⑤ `RewardUnlockId` 훅)는 퀘스트 시스템 구조 확인 필요로 미이행**(T25 보고서 §5). 이 티켓이 그 잔여를 완결한다. §3.3 "레시피 해금 계층"의 3소스(연구/퀘스트/도안) 중 퀘스트 축.
- **선결 조사 참고(지휘자 확인, 2026-07-11)**: 현행 퀘스트 시스템은 quest-achievement 패키지의 **저장소 개조본** — `UserQuestData.Complete`(L296~)에 이미 `[적응]` 표기의 커스텀 보상 지급 코드(`inv:AddItem`)가 들어가 있다. 즉 순정 패키지가 아니므로 **동일 지점(`Complete`)에 훅을 추가하는 것이 허용·권장 경로**다. 구조가 예상과 다르면 임의 판단 말고 질문.
- **Target**: `QuestAndAchievement/DataSets/QuestDataSet.csv`(보상 컬럼 `RewardUnlockId` 신설 + 107 행 값), `QuestAndAchievement/Core/Quest/QuestData.mlua`(컬럼 파싱)·`UserQuestData.mlua`(`Complete` 훅), `PlayerInventory`는 `GrantRecipeUnlock` 호출만(수정 없음이 이상적).
- **Change**: ① `QuestDataSet.csv`에 `RewardUnlockId`(공란=없음) 컬럼 추가 ② 퀘스트 완료 시 값이 있으면 `PlayerInventory:GrantRecipeUnlock(RewardUnlockId)` 호출(T25 API 재사용 — 신규 해금 로직 발명 금지) ③ **시범 배정(⚖️ 2026-07-11 지휘자 확정 — 크로스 상수)**: 온보딩 퀘스트 **107(넓은 세계로)**에 `RewardUnlockId=quest_cooking_pot`. ⚠️ **`RecipeDataSet.csv` 수정 금지**(레인 2 소유) — Cooking Pot 행의 `UnlockId=quest_cooking_pot`/`UnlockHint=퀘스트 '넓은 세계로' 보상` 셀 기입은 **레인 2(T15 마감 스텝)가 수행**한다.
- **Acceptance**: 퀘스트 107 완료 → `quest_cooking_pot` 해금 토스트·영속(재접속 유지). 이름 분기 0건. refresh 빌드 무에러(§4에 빌드 근거 자체 기재). 제작창 잠금 표시·해제 육안은 레인 2의 셀 기입과 합쳐진 뒤 제작자 통합 Play에서 — 자기 레인 단독으로 확인 불가한 항목은 보고에 그렇게 명시.
- **충돌 주의**: **레인 1** — T20 완료 후 착수(레인 내 순차). 레인 2 파일(`item_dataset`/`RecipeDataSet`/`PlayerController` 등) 수정 금지.
- **구현 요약 (2026-07-11)**: Change ①~③ 이행. Complete 훅 GrantRecipeUnlock. 보고서: `docs/agents/reports/T27-quest-reward-unlock.md`.
- **검증**: Maker refresh 빌드 **Error=0** (total 433 / Warning 9 / Info 424). **런타임 검증 보류(제작자 수행)**.

### T31. [완료 — 배치 D 2026-07-12 | 코드 수정 0 (CSV-only) | refresh 검증 보류(Maker 미가동) | Play 보류(제작자)] 요리 고기 축 — 멧돼지 고기 드롭 + 구운 고기(AttackPower) (T31② 잔여)

- **② 완결(2026-07-12 배치 D)**: `item_dataset`(raw_meat/roasted_meat 행 추가 — 아이콘 2종 msw-search 확보) + `ItemDropDataSet`(boar→raw_meat 1~2 @1.0) + `CookingRecipeDataSet`(Raw Meat 2→Roasted Meat, 10s) + `BuffDataSet`(atk_boost_small=AttackPower mult 1.25/60s). 코드 수정 0. 보고서 `reports/T31-feast-dish-buff-reassignment.md` §7 append.
- ①(gather_boost_big 신설·Feast Dish 재배정)은 완료 — §2 감사 배치 포인터. **⚖️ 2026-07-12 보스 확정: 지금 채택** (T19 가축은 달걀/양털 축이라 식재료 중복 아님 — 독립 진행). AttackPower·StaminaRegen 훅은 코드에 이미 살아있음(T16 산출물 — 콘텐츠만 없음).
- **Target**: `item/DataSets/item_dataset.csv`(Raw Meat/Roasted Meat 행 추가), `MapObjects/DataSets/ItemDropDataSet.csv`(Boar→Raw Meat 행), `Furniture/DataSets/CookingRecipeDataSet.csv`(Raw Meat→Roasted Meat 행), `item/DataSets/BuffDataSet.csv`(`atk_boost_small` 행). **CSV-only가 이상 — 코드 수정 0이 기대값.**
- **Change**: ① `item_dataset`에 Raw Meat(재료)·Roasted Meat(`Category=consumable`+`UseBuffId=atk_boost_small`) 행 — 아이콘 RUID는 msw-search로 확보(없으면 placeholder+보고) ② `ItemDropDataSet`에 Boar 드롭 행 — **T28 `MonsterId` 체계·기존 드롭 행 스키마 그대로 준수** ③ `CookingRecipeDataSet` 1행(기존 행 패턴 준수 — 예: Raw Meat 2 → Roasted Meat, CookDuration은 기존 행 범위 내) ④ `BuffDataSet`에 `atk_boost_small`(StatKey=`AttackPower`) — **기존 `gather_boost_small` 행 패턴 미러**(mult 1.25/60s 제안 — CSV 튜닝 자유).
- **Acceptance**: 멧돼지 처치→Raw Meat 드롭 / 냄비 조리→Roasted Meat / 사용 시 AttackPower 버프가 HUD BuffBar 표시 / 코드 수정 0(불가피하면 [보류]+질문) / refresh(가능 시) Error 수 보고서 기재. Play는 제작자.
- **충돌 주의**: **배치 D** — T32 완료 후 착수. `item_dataset`은 T15(Play 대기)가 셀 단위로 만진 파일 — **행 추가만** 하고 기존 행 수정 금지.

### T32. [완료 — 배치 D 2026-07-12 | refresh 검증 보류(Maker 미가동) | Play 보류(제작자)] 상점 Bed 가격 정상화 (T32② 잔여)

- ①③(RecipeDataSet Category 정합·Description 인용부호 통일)은 완료 — §2 감사 배치 포인터. **⚖️ 2026-07-12 보스 확정: `BuyPrice=50`** (제작 원가 Wood×10=판매가 환산 20코인의 2.5배 — 직접 제작 동기 유지+지름길 허용).
- **② 완결(2026-07-12 배치 D)**: `ShopItemDataSet.csv` Bed `BuyPrice` 1→50, 해당 셀 외 변경 0. 보고서 `reports/T32-data-hygiene.md` §7 append.
- **Target**: `item/DataSets/ShopItemDataSet.csv` Bed 행 — `BuyPrice` 셀 1→50.
- **Acceptance**: 해당 셀 1건 외 변경 0. refresh(가능 시) Error 수 보고서 기재.
- **충돌 주의**: **배치 D 첫 항목**.

### T36. [코드 완료 — 2026-07-11 재작업 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 자원/가구 통과 버그 수정 — ResolveOverlaps 원-대-AABB (재작업 지시 포함)

- **🔁 재작업 지시(지휘자 재진단 2026-07-11 — AABB 수식·프로퍼티·필터 구조는 정상, 결함 2건 특정)**:
  ① **탐지 형상 ≠ 해소 형상**: 후보 수집이 여전히 플레이어 중심 r=0.3 `OverlapAll`이라, 자원 트리거 콜라이더가 해소용 AABB보다 작으면 **AABB에 침투했는데 감지가 안 되는 사각지대**가 생긴다. → 후보 수집 질의 반경을 넓혀라(`CircleShape(currentPos, 2.5)` 등 — 상수는 프로퍼티화). 차단 여부·침투 판정은 지금처럼 `GetObstacleAABB`+`ResolveCircleAABB`가 전담하므로 질의는 "근처 후보 나열"로만 쓰인다 — 트리거 크기 의존이 사라진다.
  ② **SafePos 오염**: 미감지 침투 프레임에서 `hit=false` → `OverlapSafeX/Y`가 침투 지점으로 갱신(L1643-1645) → 뒤늦게 감지되면 start가 이미 중심선 너머라 반대면으로 배출 = 통과 완성. ①을 적용하면 AABB 내부는 항상 hit=true라 자동 해결 — 수정 후 "SafePos는 어떤 차단 AABB 내부에서도 갱신되지 않음"을 코드 리뷰로 확인만.
  ③ **가구 분기 누락(원 스펙 ④ 미이행)**: `IsBlockingOverlapEntity`가 `PlaceableFurniture` 보유 엔티티를 무조건 false 처리 중. → `PlaceableFurniture`에 `property boolean BlocksMovement = true` 신설 + 보유 시 그 값으로 차단. `Furniture_Portal.model`은 `false` 오버라이드(포탈은 밟고 워프 — 현행 "포탈 정상" 유지). ModelBuilder 경유.
  ④ Acceptance는 원 티켓과 동일 + "질의 반경 상수 프로퍼티화" 추가. 보고서는 `T36-*.md` 같은 파일에 §7 이력 append.

- **배경(지휘자 진단 2026-07-11)**: Big Stone 등 다중 셀 자원을 특정 방향(위→아래 등)에서 그냥 통과. 자원·가구는 TriggerBox 콜라이더라 Kinematicbody가 물리로 막지 않으며, 유일한 차단 장치인 `PlayerController.ResolveOverlaps`(L1490~)가 기하적으로 틀렸다:
  (a) 모든 장애물을 **엔티티 피벗 중심 고정 반경 0.45 원**으로 근사 — Big Stone처럼 콜라이더가 피벗에서 오프셋된(`ResourceOccupiedArea.OffsetXMin/XMax/YMin/YMax`) 다중 셀 자원은, 위에서 진입하면 피벗 거리>0.75(0.3+0.45)인 동안 침투 깊이가 0으로 계산돼 **밀어내기가 아예 안 걸린다**.
  (b) 피벗을 지나치는 순간 `dir=플레이어-피벗`이 진행 방향으로 뒤집혀 **오히려 반대편으로 배출** = 관통 완성. 피벗이 진입면에 가까운 방향(아래/옆)은 즉시 밀어내기가 걸려 막힘 → 방향 의존성의 정체.
  (c) 프레임당 20% 소프트 보정이라 빠른 이동은 원형 케이스에서도 관통 가능.
  (d) `entity.Name ~= "GrownGrass"`/`~= "ItemDrop"` 이름 분기 — §1.2 규칙 1 위반이고, 실제 드롭 엔티티 이름은 `Item_<id>`라 **이미 헛도는 필터**.
- **Target**: `Player/Scripts/PlayerController.mlua`(`ResolveOverlaps`), 필요 시 `MapObjects/Scripts/ResourceOccupiedArea.mlua`(플래그 프로퍼티 추가), GrownGrass 모델(통과 허용 플래그 — ModelBuilder 경유).
- **Change**:
  ① **형상 모델 교체**: 원-대-원 폐기 → **원(플레이어 r=0.3) 대 AABB**. 장애물 AABB = 엔티티 피벗 ± 0.5셀 기본에 `ResourceOccupiedArea`의 Offset 4종으로 확장 — **점유 등록에 쓰는 기존 산식을 재사용**(새 산식 발명 금지, `ResourceSpawner`의 점유 계산부를 읽고 동일 수치로. 단 ResourceSpawner 자체는 수정 금지 — 산식만 미러). 컴포넌트 없으면 1셀(±0.5) 기본.
  ② **해소 방식**: AABB 최근접점 기준 침투 깊이/방향(MTV) 산출, **당 프레임 전량 해소**(20% 소프트 폐지). 프레임당 최대 보정량 클램프(예: 0.5) 허용.
  ③ **터널링 방지**: 프레임 시작 위치를 저장해 두고, 이동 후 침투 시 **시작 위치가 있던 면 쪽으로** 되민다(중심을 넘어도 진행 반대면으로 — (b)의 방향 뒤집힘 제거).
  ④ **대상 필터 데이터화**: 이름 분기 제거 — 차단 대상 = `ResourceOccupiedArea` 또는 `PlaceableFurniture` 컴포넌트 보유 엔티티. 통과 허용은 컴포넌트 프로퍼티(`BlocksMovement=false` 등 신설)로: GrownGrass 모델에 false 설정, 드롭 아이템은 `itemreact` 보유로 제외.
  ⑤ 서버 재검증 도입은 범위 밖(현행 클라 보정 구조 유지). `ResolveOverlaps` 외 로직 회귀 금지.
- **Acceptance**: ① Big Stone1/2·Tree1/2·IronNode·설치 가구를 **4방향+대각 전부**에서 통과 불가, 밀착 이동 시 떨림/끼임 없음 ② GrownGrass·드롭 아이템은 기존처럼 통과 ③ 이름 분기 0건 ④ 티켓 완료 즉시 refresh, Error 수 보고서 기재. Play는 제작자(각 자원을 8방향에서 밀어보기).
- **충돌 주의**: **레인 1** — `PlayerController` 소유. 레인 2 파일 수정 금지.
- **구현 요약 (2026-07-11)**: AABB MTV 전량 해소·BlocksMovement·GrownGrass false. 보고서 `docs/agents/reports/T36-resolve-overlaps-aabb.md`.
- **검증**: refresh 빌드 **Error=0** (total 436). **런타임 검증 보류(제작자 수행)**.
- **재작업 요약 (2026-07-11)**: `OverlapQueryRadius=2.5` 후보 수집 + `PlaceableFurniture.BlocksMovement` + Portal false. §7 이력 append. refresh total 440 Error=0.

### T37. [코드 완료 — 2026-07-11 재작업 🔴 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 로그아웃 위치 정책 — 세이브 유실 핫픽스 포함 (재작업 지시 포함)

- **🔁 재작업 지시(지휘자 재진단 2026-07-11 — 유실 경로 특정)**:
  ① **원인**: 이번 구현이 `SavePlayerData` **한가운데에** `storagePeek:GetAndWait("SaveData")`(L498-517, 이전 홈 좌표 조회)를 넣었다. `GetAndWait`는 **Yield 함수** — 로그아웃 동기 저장 중 코루틴이 양보된 사이 플레이어 엔티티/컴포넌트가 파괴되면, 재개 후 읽는 `inv.InventoryDataJson` 등이 nil이 되어 `or "{}"` 폴백으로 **빈 인벤토리가 저장**된다(level/xp/coin도 기본값 오염 가능). 비홈 맵에서 종료할 때만 이 경로를 타므로 "마을 스폰 + 전량 소실" 증상과 정확히 일치.
  ② **수정**: 세이브 경로에서 `GetAndWait` **완전 제거**. 대체 = 세션 캐시: `property table LastHomePos = {}` — mapKind=="home"으로 저장할 때 `LastHomePos[userId]={x,y}` 갱신, LoadPlayerData에서 `data.posX/Y`로 초기화. 비홈 저장 시 캐시 값 사용(캐시 없으면 -3,0 폴백). **§1.2 신설 규칙 9(세이브 경로 Yield 금지 — 컴포넌트 값은 Yield 이전에 지역 변수로 캡처) 준수.**
  ③ 방어 보강: `SavePlayerData` 진입 직후 pc/inv의 모든 저장 대상 값을 **지역 변수로 선캡처**하고 이후 로직은 캡처본만 사용 — 향후 누군가 Yield를 다시 넣어도 유실이 재발하지 않게.
  ④ Acceptance 추가: 사냥터에서 아이템 획득 → 종료 → 재접속 시 마을 스폰 + **인벤토리/코인/레벨 온전**, 영지 좌표 미오염(캐시 경유). 구세이브(lastMapKind 없음) 폴백 유지. 보고서 `T37-*.md`에 §7 이력 append.

- **배경**: 어디서 종료하든 무조건 영지(`Home_`) 리스폰이라 사냥터에서 끊고 오면 어색(제작자). 부가 버그 소지: `SavePlayerData`가 `posX/posY`를 **현재 맵 구분 없이** 저장하므로 사냥터 좌표가 영지 좌표로 적용됨(현재는 `FindSafeSpawnPosition` 보정으로 가려짐).
- **⚖️ 정책(지휘자 제안 2026-07-11 — 보스 이견 시 코멘트로 변경)**: 종료 시 `lastMapKind`(home/town/hunt) 저장. 로드 시 home → 영지 저장 좌표(현행) / town → 마을 기본 스폰 / hunt → **마을 스폰**(사냥터는 세션 동적 인스턴스라 복원 부적합 — 마을이 모험 베이스). 마을 스폰 좌표는 `PortalDestinationDataSet`의 `IsDefault` 행 `MapName`/`ArriveX`/`ArriveY` 재사용(T33 산출물 — 좌표 하드코딩 금지).
- **Target**: `Player/Scripts/PersistenceManager.mlua`(save에 `lastMapKind` + `posX/posY`는 home일 때만 갱신, load에 3분기 워프), (읽기) `PortalDestinationDataSet.csv`.
- **Change**: ① save: 현재 맵 이름으로 kind 판정(`Home_` 접두=home / `town`=town / 그 외=hunt — 접두 판정은 기존 `Home_` 패턴 재사용) ② load: kind별 워프 분기, 구세이브(`lastMapKind` 없음)는 `or "home"` 폴백=현행 동작 ③ posX/posY 오염 제거: kind≠home이면 마지막 home 좌표 유지.
- **Acceptance**: 영지 종료→영지 그 자리 / 마을·사냥터 종료→마을 기본 스폰 / 구세이브 회귀 없음 / 좌표·맵명 하드코딩 0(IsDefault 행 재사용). 티켓 완료 즉시 refresh, Error 수 보고서 기재. Play는 제작자.
- **충돌 주의**: **레인 1** — T36 완료 후 착수(`PersistenceManager` 소유).
- **구현 요약 (2026-07-11)**: lastMapKind save/load + IsDefault 마을 스폰 + pos 오염 방지. 보고서 `docs/agents/reports/T37-logout-map-kind.md`.
- **검증**: refresh 빌드 **Error=0** (total 436). **런타임 검증 보류(제작자 수행)**.
- **재작업 요약 (2026-07-11)**: SavePlayerData 내 GetAndWait 제거 · LastHomePos 세션 캐시 · pc/inv 선캡처. §7 이력 append. refresh total 440 Error=0.

### T38. [코드 완료 — 2026-07-11 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 몬스터 전투 체감 개선 — 접촉 데미지 신설 + 공격 텔레그래프/타이밍·거리 정정 (제작자 피드백 2026-07-11)

- **배경(지휘자 진단 2026-07-11)**: 제작자 리포트 "붙어도 충돌 데미지 0 + 딱 붙어서 어색하게 공격". 코드 원인 확정:
  (a) **접촉 데미지가 설계상 존재하지 않음** — 데미지는 `MonsterAI.EnterState("ATTACK")` 진입 순간의 `DoAttack()` 1회뿐이고, `AttackCooldown`(1.5s) 동안은 몸이 겹쳐 있어도 무해.
  (b) **공격 개시 거리가 하드코딩** — `AttackRange` 프로퍼티가 있는데도 `dSq <= 0.81`(0.9칸) 리터럴(MonsterAI L145)이 우선해 몸에 파고든 뒤에야 공격 개시. CHASE 중 선제 분기(L159)는 AttackRange 사용 — 이중 기준.
  (c) **타격이 윈드업 시작 시점에 즉시 발동**(EnterState("ATTACK")에서 바로 `DoAttack()`) — 모션(0.5s 윈드업)과 타격이 어긋나고 회피 여지 0. 텔레그래프 없음.
  참고: 플레이어 피격 게이트 `IFrameTimer` 1.0s(PlayerController L1976~L1999)가 이미 있어, 접촉 데미지를 추가해도 연타는 자연 억제된다.
- **Target**: `Monster/Scripts/MonsterAI.mlua`, `Monster/Scripts/MonsterMeleeAttack.mlua`, 몬스터 모델 4종(신규 프로퍼티 기본값 오버라이드 — ModelBuilder+model.md 프리플라이트), (확인만) `PlayerController.mlua`의 i-frame 게이트.
- **Change**:
  ① **접촉 데미지 신설**: `MonsterMeleeAttack`에 `TouchDamage`(기본=ContactDamage 절반 내림)·`TouchTickInterval`(기본 0.5)·`TouchRadius`(기본 0.55) 프로퍼티. `MonsterAI.OnUpdate`에서 사망/넉백 상태 제외하고 주기 타이머로 최근접 플레이어 거리 ≤ TouchRadius면 소형 박스 `AttackFast` — `attackInfo="touch"` 태깅, `CalcDamage`에서 attackInfo로 TouchDamage/ContactDamage 분기(attackInfo 태깅 규약 — 이름 분기 아님). 연타 억제는 기존 플레이어 i-frame에 위임(신규 무적 로직 발명 금지). ⚠ AttackComponent 훅 오버라이드에 `@ExecSpace` 부착 금지(LEA-3014).
  ② **타격 타이밍 정정**: `DoAttack()` 호출을 ATTACK 진입 시 → **StateTimer(AttackWindup) 만료 시점**으로 이동(`attackInfo="attack"`).
  ③ **텔레그래프**: 윈드업 동안 스프라이트 틴트 플래시 — @Sync 프로퍼티 변경 → `OnSyncProperty`(ClientOnly)에서 연출(서버에서 Color 직접 조작 금지). CONTACT형의 윈드업 중 추적 이동은 유지하되 속도 50% 감쇠.
  ④ **거리 기준 단일화**: 리터럴 `0.81` 제거 → `AttackRange` 단일 기준(L145·L159 통일). `StopDistance`(기본 0.8) 프로퍼티 신설 — CHASE에서 이 거리 이내면 접근 중단(파고들기 제거).
  ⑤ **몬스터-플레이어 물리 차단은 도입하지 않음(⚖️ 설계 확정)** — 접촉 데미지가 생기면 겹침 자체가 회피 대상 게임플레이가 된다. T36의 ResolveOverlaps 차단 대상에 몬스터를 추가하지 말 것.
- **Acceptance**: ① 몬스터와 겹치면 ~1초 간격(i-frame 주기)으로 접촉 데미지 ② 공격은 AttackRange 경계에서 개시 → 윈드업 텔레그래프 → 만료 시점 타격(회피 가능) ③ 파고들기 없이 StopDistance에서 정지 ④ 신규 수치 전부 프로퍼티/모델 값(코드 리터럴 0) ⑤ 넉백·리쉬·어그로 유예·보스 회귀 0 ⑥ 티켓 완료 즉시 refresh, Error 수 보고서 §4 기재. Play는 제작자(일반 3종+보스, 접촉/공격/회피 체감).
- **충돌 주의**: **레인 1** — T37 완료 후 착수. 레인 2 파일 수정 금지.
- **구현 요약 (2026-07-11)**: Touch 틱·윈드업 타격·TelegraphOn·AttackRange/StopDistance. 보고서 `docs/agents/reports/T38-monster-combat-feel.md`.
- **검증**: refresh 빌드 **Error=0** (total 439). **런타임 검증 보류(제작자 수행)**.

### T39. [진행 — 배치 D 2026-07-12] 몬스터 원거리 공격 — HornMushroom 포자 투사체 (T38 후속)

- **경위(지휘자 소급 발행 2026-07-12)**: 직전 세션이 **큐 항목 없이 착수 후 무보고 종료**(커밋 d335015 — §5 조항 11 위반 4회차). 지휘자 실사 후 이 항목으로 소급 정식화. 배경: T38로 근접 전투는 정비됐으나 전 몬스터가 근접 단일 패턴 — 원거리 1종으로 전투 다양화. **⚖️ 2026-07-12 보스 확정: HornMushroom**(버섯 포자 — 원거리 전형).
- **현재 자산 실사(지휘자 2026-07-12 — 그대로 사용, 재구현 금지)**:
  - `Monster/Scripts/MonsterProjectile.mlua`(+`.codeblock` 쌍): **컴포넌트 완성** — `AttackComponent` 확장, `Fire(owner, dir, dmg, speed, hitRadius, lifeTime)` 주입식(모델 프로퍼티 아님 — 스폰 시점 결정 설계), `OnUpdate` Translate 비행+수명 소멸, HitBox 오버랩 시 `AttackFast(shape, "projectile")`→Destroy, `CalcDamage` attackInfo 태깅 분기, `IsAttackTarget` 플레이어 한정. **로직 수정 금지** — 주석 오타 2건("시뫤레이터"→"시뮬레이터", "덄백"→"넉백")만 수정 허용.
  - 없음: 투사체 **모델**(.model) / MonsterAI **발사 분기** / HornMushroom 원거리 설정.
- **Target**: 신규 `Monster/Models/Projectile_Spore.model`(ModelBuilder — Model Work Preflight 필수), `Monster/Scripts/MonsterAI.mlua`(원거리 분기), `Monster/Models/HornMushroom.model`(프로퍼티 오버라이드 — ModelBuilder), (로직 수정 없음) `MonsterProjectile.mlua`.
- **Change**:
  ① **투사체 모델 신설**: TransformComponent + SpriteRendererComponent + `MonsterProjectile` 컴포넌트. SpriteRUID는 msw-search로 포자/구체 탄환 확보(없으면 msw-painter 제작) — **빈 RUID 금지(8대 규칙 3)**. Body 없음(Translate 비행 설계 유지).
  ② **MonsterAI 원거리 프로퍼티 신설**: `property string ProjectileModelId = ""`(빈 값=근접 전용 — 모델 ID 데이터 주도, **이름 분기 금지**) + `ProjectileSpeed`/`ProjectileDamage`/`ProjectileLifeTime`/`ProjectileHitRadius`(전부 프로퍼티 — 코드 리터럴 0).
  ③ **발사 분기**: T38이 만든 **ATTACK 윈드업 만료 시점**(StateTimer 만료 → 현 `DoAttack()` 지점)에서 `ProjectileModelId ~= ""`이면 근접 대신 `_SpawnService:SpawnByModelId(..., parent=self.Entity.CurrentMap)`(**parent nil 금지 — 8대 규칙 4**) 후 `Fire(...)` — 방향 = 최근접 플레이어 방향. 텔레그래프/쿨다운/StopDistance 등 **T38 파이프라인 그대로 재사용**(신규 상태 발명 금지).
  ④ **HornMushroom 설정**: 모델에 `ProjectileModelId`+수치 오버라이드, 원거리답게 `AttackRange` 상향(3.0 제안)+`StopDistance` 상향(2.5 제안) — 전부 모델 프로퍼티(튜닝 자유). Slime/Boar/SlimeKing은 무변경(빈 `ProjectileModelId`).
- **Acceptance**: ① HornMushroom이 AttackRange 경계에서 윈드업 텔레그래프→포자 발사→명중 시 정식 히트 파이프라인(i-frame/데미지 스킨) 경유 데미지 ② 빗나감 시 LifeTime 후 소멸(잔존 엔티티 0) ③ Slime/Boar/SlimeKing 근접 회귀 0 ④ 수치/이름 하드코딩 0 ⑤ refresh(가능 시) Error 수 보고서 기재 + §4 보고 3종. Play는 제작자(발사·명중·소멸·근접몹 회귀).
- **충돌 주의**: **배치 D 마지막** — T31 완료 후 착수. `MonsterAI.mlua`는 T38(Play 대기) 산출물 — T38 재작업 발생 시 지휘자가 조정(보스 리스크 수용 2026-07-12). `MonsterMeleeAttack.mlua`·`PlayerController.mlua` 수정 금지.

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

> **품질 추가 조항 (2026-07-11 신설 — 아래 4줄을 모든 킥오프 프롬프트 말미에 그대로 덧붙여 전달할 것)**
>
> ```
> 7. .mlua를 만지기 전에 msw-scripting 스킬(SKILL.md + references/verify-checklist.md)을 로드하라.
> 8. 다른 스크립트의 메서드/프로퍼티를 호출하기 전에 대상 파일에서 정의를 검색해 존재를 확인하라(§1.2 규칙 8). 없는 API를 추정으로 호출하지 마라.
> 9. refresh 검증은 티켓 완료마다 1회 수행하고 빌드 Error 수를 보고서 §4에 기재하라(레인 말미 몰기 금지).
> 10. 어떤 이유로든 중단할 때도 T항목 상태 갱신([보류]+사유)과 부분 보고서를 남겨라 — 무보고 종료는 반려다.
> 11. ⛔ [완료] 표기는 보고서 파일(docs/agents/reports/T<n>-*.md)을 먼저 작성한 뒤에만 허용된다. 보고서 없는 완료 표기는 즉시 반려다 — 이 위반이 이미 3회 기록되었다(§3 T18 이력 참조). 작업 시작 시 첫 응답에 이 조항을 인지했음을 한 줄로 명시하라.
> ```
>
> ⚠️ **11번 조항은 킥오프 프롬프트 "최상단"에도 한 번 더 복사해 넣을 것** (2026-07-11 보스 지시 — 무보고 완료 3회차 재발 방지).


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
