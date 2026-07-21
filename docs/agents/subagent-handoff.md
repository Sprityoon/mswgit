# 하위 에이전트 작업 핸드오프 (Subagent Handoff)

> **용도**: 상위 에이전트/보스가 하위 에이전트에게 작업을 위임할 때 이 문서를 그대로 전달한다.
> 하위 에이전트는 **§1 공통 컨텍스트를 먼저 전부 읽고**, §3 작업 큐에서 지정된 작업 항목만 수행한다.
> 새 작업이 생기면 §3에 항목을 추가하고, 완료되면 상태를 갱신한다.
>
> 🧹 **2026-07-16 슬림화(지휘자, 보스 지시)**: 완료 티켓 원문·과거 실행 계획 일지는 **git 이력(커밋 3d9fcce 이전 버전의 이 문서)과 `docs/agents/reports/T<n>-*.md`로 이관**. 이 문서는 살아있는 규칙(§1) + 완료 포인터(§2) + 현재 큐(§3)만 유지한다. 과거 티켓의 스펙 원문이 필요하면 해당 보고서 또는 `git log -p -- docs/agents/subagent-handoff.md`를 볼 것.

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
6. **UI 작업 공통 (2026-07-11 신설 — 보스 지시)**: `.ui` 파일이나 UI 스크립트를 만지는 **모든** 작업은 착수 전에 msw-ui-system 스킬의 SKILL.md와 **`references/ui-aesthetics.md`(디자인 철학) 전문**을 로드한다 — 특히 §0 Gray Box Syndrome 회피, §1 비주얼 아이덴티티 선결정, §2 패널 해부, §5 간격·정렬 리듬. 납품 전 **동 문서 §7 자가 리뷰 루브릭 평가를 수행해 보고서에 표로 첨부**한다(누락 시 작업 미완료 — 루브릭은 **실측 좌표 근거**로 작성). 기존 게임 UI(인벤토리/HUD/상점)와 같은 비주얼 아이덴티티를 유지하고 화면마다 새 스타일을 발명하지 않는다. 레이아웃 작업 시 `references/layout-recipes.md`도 참조.
7. **데이터셋 행 접근 API (2026-07-11 신설 — T35 사고 재발 방지)**: `UserDataSet:FindRow()`가 반환하는 `UserDataRow`는 **`Count()`와 `GetItem(columnName)` 두 메서드만 제공**한다. `row.RowIndex`는 존재하지 않는 프로퍼티(nil)이며 이를 `GetCell`에 넘기면 `[LEA-3005] InvalidArgument`로 호출한 서버 루프가 통째로 중단된다. 행 값 조회는 반드시 `row:GetItem("컬럼명")`으로 하고, 존재가 불확실한 컬럼은 pcall 가드를 쓴다(없는 컬럼 GetItem은 LEA-3011 — `Furnace.mlua` readDur 선례).
8. **크로스 스크립트 API 호출 전 정의 확인 (2026-07-11 신설 — T18 치명 오류 재발 방지)**: 다른 스크립트의 메서드/프로퍼티를 호출하는 코드를 쓰기 전에 **반드시 대상 `.mlua` 파일에서 해당 정의를 검색해 존재와 시그니처를 확인**한다. 정의가 없으면 추정으로 호출하지 말 것 — 소유 레인 밖 파일에 정의를 새로 만들어 붙이는 것도 금지, [보류]+질문으로 전환한다. "아마 있을 것" 추정 호출이 과거 배치의 치명 런타임 오류 원인이었다.
9. **세이브 경로 Yield 금지 (2026-07-11 신설 — T37 인벤토리 전량 유실 사고 재발 방지)**: `SavePlayerData` 등 영속 저장 루틴 안에서 필수 `GetAndWait`/`SetAndWait` 외의 **추가 Yield 호출(다른 GetAndWait, 타이머 대기 등)을 절대 넣지 않는다**. Yield 사이에 플레이어 엔티티가 파괴되면 이후 읽는 컴포넌트 값이 nil → 기본값 폴백으로 **세이브가 빈 데이터로 덮인다**. 저장에 필요한 컴포넌트 값은 루틴 진입 직후 전부 지역 변수로 선캡처하고, 외부 조회가 필요하면 세션 캐시를 쓴다.
10. **UI stretch 앵커 미신뢰 — RectSize 명시 (2026-07-14 신설 — T48 '정체불명 박스' 실증)**: 이 프로젝트 런타임(CoreVersion 26.5.0.0)에서 `.ui` 자식의 stretch 앵커(AnchorsMin≠AnchorsMax)+Offset 0 조합은 **부모 크기로 늘어나지 않고 `RectSize` 값 그대로 렌더**된다(지휘자 Play 캡처 실증). 새/수정 `.ui` 자식은 **명시 anchor+rect_size로 작성**하고, 부모 크기를 바꾸면 stretch 자식의 RectSize 동기화 여부를 반드시 함께 확인한다.
11. **Maker 스테일 저장이 빌더 산출 `.ui`를 되돌린다 (2026-07-15 신설 — 실사고)**: Maker 에디터는 저장 시 **에디터 메모리 상태로 워크스페이스 파일을 통째로 재직렬화**한다. 에디터가 구버전 상태(git pull·빌더 편집을 refresh로 반영하기 전)를 들고 있으면 무관한 저장에도 `ui/*.ui`가 구버전으로 덮인다 — 2026-07-15 실사고(T47·T48·T50 산출물 소실 → 지휘자 HEAD 복구). **규칙**: ① git pull 또는 빌더로 `.map`/`.model`/`.ui`를 바꾼 뒤에는 Maker에서 어떤 저장이든 하기 전에 반드시 `refresh` 먼저 ② 에이전트는 Maker 저장 흔적(git status에 의도치 않은 `.ui`/`.csv` 변경)이 보이면 **덮어쓰기 여부부터 대조**하고 작업을 시작한다(핵심 산출물 존재 검사 — `scratch/inspect_stale_save_check.cjs` 선례) ③ CSV의 BOM 재직렬화는 무해(클린 필터 처리). `.ui` 전량 재직렬화 diff도 **내용이 전수 실존하면 무해** — 되돌리지 말고 커밋에 포함(2026-07-16 판정 선례. 되돌리면 다음 에디터 저장에서 재발).
12. **`_EffectService`/`_ParticleService` instigator에 nil 금지 (2026-07-18 신설 — T71 런타임 실측)**: `PlayEffect`/`PlayBasicParticle` 등의 instigator 인자에 `nil`을 넘기면 **클라이언트에서 생성이 에러 없이 조용히 실패(serial=0)** 한다 — 서버는 nil을 통과시켜 serial>0을 반환하므로 "서버 로그만 성공"으로 오진하기 쉽다. 반드시 유효 엔티티(시전자·대상 등)를 넘기고, 재생 직후 반환 serial을 로그로 남겨 0 여부를 확인한다. `SpawnByModelId` parent nil 금지(핵심 규칙 4)와 동계열 함정.

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

- **서브셀 흙 마스크 (단일 표현)**: 모든 지형 문법은 셀당 2×2 서브셀 흙 마스크 하나로 통일. 셀 패턴 → 타일: 흙 0칸=`FullGrass` / 인접 2칸=`Grass{T|D|L|R}` / 3칸=볼록 `Grass{LT|RT|LD|RD}` / 1칸=오목 `Grass*Corner` / 4칸=L2 홀(L1 Soil 노출) / **대각 2칸=`SubGrass{LTRD|RTLD}` (T51, 2026-07-15 — 마스크 6=TL+BR→LTRD, 9=TR+BL→RTLD. 전 마스크 0~15 표현 가능, 구 FixDiagonalMask 승격/강등 보정 폐기)**. 접미사 방향 = 흙(길) 쪽. ※ 생성기(`build_maps.cjs`)는 대각을 산출하지 않음 — 대각은 런타임 편집 전용, 생성기 산출 검사의 "대각=에러"는 자기 산출물 한정으로 유효.
- **문법 1 — 길 (밀착 에지 페어, L2 홀 0칸)**: 셀 경계 좌표 중심선 폴리라인에서 폭 2서브셀(시각 1셀) 흙 밴드를 파생. 수평 길 = `GrassT|GrassD` 밀착 페어, 수직 길 = `GrassR|GrassL` 페어. ㄱ자 꺾임(바깥 오목 캡+안쪽 볼록), 막다른 끝(오목 코너 페어 캡), 길↔광장 접속은 마스크 합집합으로 전부 자동.
- **문법 2 — 광장/밭/보스 아레나 (홀 유지)**: 셀 사각형 + ½셀 마진. 내부 = L2 홀, 둘레 잔디 셀 = 프린지 에지, 모서리 = 오목 `Grass*Corner`. 광장 안 잔디 섬(정원)은 island 도려냄(같은 ½ 마진 규칙).
- ⚠️ **잔디 스트립 최소 2칸**: 두 흙 영역 사이 잔디가 1칸이면 양쪽 ½마진이 겹쳐 흙으로 병합된다 (map01 밭 고랑이 이 규칙으로 2칸 확보됨 — 밭 A `[-23,-19]`).
- `wall.tileset`은 2026-07-07 리네임으로 프린지가 `Soil{dir}` → **`Grass{dir}` 8종**으로 바뀌었고, `Soil*2`(구 내부 모서리) 폐기 + `Grass*Corner` 4종 추가. 2026-07-15 제작자가 대각 `SubGrass{RTLD|LTRD}` 2종 추가(아트 `tileimg/`). **L2 잔디 패밀리 = `FullGrass` + `Grass{dir}` 8 + `Grass*Corner` 4 + `SubGrass` 2 = 15종** (`IsGrassTileName` 판정 = "FullGrass" | prefix "Grass" | prefix "SubGrass"; 방향 에지 길 판정 `IsGrassEdgeTileName`에 SubGrass 포함).
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

### 1.5 ⚖️ 상시 디자인 정책 (보스 확정 누적 — 위반 금지)

- **PC/모바일 UI 레이아웃 분기 금지 — 단일 고정 레이아웃**(⚖️ 2026-07-15): `IsMobilePlatform()` 등 런타임 분기 배치 금지. 터치 타겟은 상시 ≥88px 지향(T62 스킬바 선례).
- **월드 클릭/터치 상호작용 금지 — 상호작용 = F 키(PC) / BtnInteract(모바일)만**(⚖️ 2026-07-15, T59): 월드 엔티티에 `TouchEvent` 상호작용 부착 금지. 신규 인터랙터블은 자체 F 핸들러(KeyDownEvent — `MerchantInteract` 패턴) + `InteractRequestEvent` 구독(모바일 브리지)의 이중 연결.
- **날씨는 보너스만**(페널티 금지, ⚖️ 2026-07-11) / **영지 평화 원칙**(영지 내 전투·피격 없음) / **허기 시스템 기각**(페널티형 — 아늑한 생활 톤과 충돌) / **도감 보상 = 최초 발견 즉시 자동 지급**(⚖️ 2026-07-13).
- **스킬트리 단순성 가드라인**(⚖️ 2026-07-15 "복잡한 구조 거부"): 단일 부모 · 같은 열 바로 위 행만 · 3행×3열 상한 — `docs/design/skill-tree-plan.md` §8.3. 전직 확장 계약 = 동 문서 §7.

---

## 2. 완료된 작업 기록 (포인터 전용)

> 상세 스펙·구현 이력 = `docs/agents/reports/T<n>-*.md` + git 이력(이 문서의 과거 버전 포함). 설계는 `game_design.md` Phase 트래커에 반영 완료.

- **타일 스킴 전환(07-07/08) + 대각 SubGrass(T51)** — 최신 명세의 단일 소스 = **§1.3**.
- **Phase 14 완결**: 지형 편집 v2(T5·T11~T13 — 마스크 스펙은 git·보고서, T6 농사가 digHole 판정 재사용) · 농사(T6)+작물 비주얼(T24) · 제작창 도감형(T14→T25→T26) · 연구소(T7) · 침대(T8) · 희귀 드롭(T9) · 도구 아트(T15) · 인벤→퀵슬롯 드래그(T10).
- **Phase 15 완결**: 버프(T16) · 요리(T17) · 낚시(T18 — `FishingSpot.mlua`·`FishDataSet`·rod 게이트=`PlayerController.IsEquippedFishingRod`) · 의뢰 게시판(T20) · 목장(T19) · 날씨(T21 — `WeatherManager` @Sync) · 도감·업적(T22, 업적=QuestAndAchievement 패키지 재사용)+분류 칩(T42)+발견 보상(T43)+LEA-3044 수정(T44) · 펫(T23).
- **감사·버그픽스**: 감사 배치 T28~T35(MonsterId 체계·XP 컬럼화·통화/포탈 컬럼화·RowIndex 핫픽스=규칙 7 유래) · 자원 통과 AABB(T36) · 로그아웃 정책+세이브 유실 핫픽스(T37=규칙 9 유래) · 몬스터 전투 체감(T38) · 원거리 포자(T39) · 멧돼지 돌진/도약(T40) · 충돌 정합+점프 순간이동(T41) · 배치 D(T31② 고기 축·T32② Bed=50).
- **Phase 16 스킬**: 해금·장착 정합(T45 — QWER 공백 시작+장착 RPC) · 원작 스킨(T46 — MSWPackages에 스킬 패키지 없음 확인, 원작 리소스+`_EffectService`=공식 방식) · 트리 UX(T47 클릭/투자 분리+HUD 버튼 → T48 부분 → T50 노드 아이콘 칩+상세 사이드 패널) · **트리 위상화(T58 — `ParentRequiredLevel` 연계 게이트+연결선, 설계=skill-tree-plan §8)** · 연결선 선명화(T60). 전직=16-C 예약(설계 계약=skill-tree-plan §7, 티켓 미발행).
- **Phase 17 모바일·입력**: 배치 H — 터치 시전·이름 숨김·툴팁(T52), HUD 88px·UIMyInfo 정합(T53), 팝업 닫기 88px 통일·Furnace 구조 정합(T54) → **⚖️ 단일 레이아웃 정책 전환으로 T62(스킬바 고정 우하단 88px)가 T52 플랫폼 분기부 대체**. **클릭 상호작용 전면 제거+`TryInteract()` 일원화+`InteractRequestEvent` 모바일 브리지(T59)**.
- **Phase 18 소리와 사람**: BGM+날씨 앰비언스(T55 — `BGMManager`+`BGMDataSet`) · 주민 대화 말풍선(T56 — `ChatBalloonComponent` 자작, dialog 패키지 부적합 판정) · 주간 낚시왕(T57 — ranking-basic-package `FishingWeekly`, **Play 실패 → T63 재작업 중**).
- **가축·펫 아트(T49)** — 닭/양/개/우리 전용 RUID 교체(슬라임 placeholder 소멸).
- **운영 사고·인프라**: `.ui` 스테일 저장 사고 2건 판정(규칙 11) · 훅 상대 경로 전환(07-14) · SessionStart 훅 stdin 블록 수정(07-16) — 상세 `docs/agents/hooks.md`.

---

## 3. 작업 큐 (하위 에이전트 위임 대상)

> 상태: `[대기]` / `[진행]` / `[완료]` / `[보류]`
> 각 항목은 **Target(파일) / Change(변경) / Acceptance(완료 기준)** 3요소를 반드시 채운다. **T번호는 단조 증가·재사용 금지 — 현재 최대 = T71.**

> 🧭 **현황판 (지휘자 2026-07-21 — 버그픽스)**
> - **Play PASS 확정**: T50까지의 전 완료분 + T56(주민 대화 말풍선 버그픽스 검증) + T51 · T58 · T59 · T60 · **T62**(⚖️ 2026-07-16 확정) · **T63**(낚시 랭킹 수정 — 핫픽스 포함 확인). 체크포인트 커밋 = 이 갱신과 동시.
> - **Play 대기(제작자 광범위 Play에서 이상 보고 없음 — 개별 명시 확인은 미완)**: T19(목장) · T23(펫) · T27(퀘스트 107 해금 — **미완료 캐릭터로** 확인) · T49(아트 육안) · T54(팝업 여닫기) · T55(BGM) · **T61(지형 쿨다운 0.25s 체감)**. 체크리스트 = 각 `reports/T<n>-*.md` §6.
> - **코드 완료·Play 대기(2026-07-18)**: **T64 낚시 v2** — 지휘자 직접 구현 완료(LSP errors=0). ⚠ Maker 미기동 상태에서 작업 — **첫 refresh에서 신규 스크립트 2종(`UIFishingGaugeController`)·데이터셋(`FishingDifficultyDataSet`) 등록 + Error=0 확인 필요**. 체크리스트 = `reports/T64-fishing-v2-reeling.md` §6.
> - **⚖️ 2026-07-18 보스 지시 3건 → 배치 J (T65→T66→T67) 코드 완료(2026-07-18)**: 세 티켓 모두 refresh Error=0 · **런타임 검증 보류(제작자 Play)**. 보고서 = `T65-mine-attack-sfx.md` · `T66-skill-vfx-dash-damage.md` · `T67-aim-cell-interact-gate.md`. **⚖️ 제작자 1차 Play 피드백(2026-07-18): "선택된 사운드들이 어색" → 커밋 9850556 후 "모든 소리가 어색, 네가 선택하라" 지시 → T68(지휘자 직접)로 11슬롯 전량 재선정 완료.**
> - **⚖️ 2026-07-18 제작자 Play 버그 2건 → 배치 K(T69·T70) 코드 완료 + T71 지휘자 직접 해결**: ① QWER 장착 재접속 초기화 = T69 영속화(Play 확인 대기) ② 스킬 모션 = T70 `CastAction`(런타임 재생 확인) ③ 이펙트 미표시의 진범 = **`PlayEffect` instigator nil(신설 규칙 12)** — T71에서 수정, **시전 경로 클라 serial>0 런타임 검증 완료**(육안 최종 확인만 제작자). 사운드 재선정 잔여분은 ⚖️ 제작자 직접(T68 현황 유지).
> - **병렬 규약(요지)**: ① 상대 레인 소유 파일은 읽기만 ② 이 문서 갱신은 자기 T블록 라인만 ③ 티켓 완료마다 refresh 1회+빌드 Error 수를 보고서 §4에 기재 ④ 무보고 종료 = 반려(§5 조항 11).

### T4. [대기] 경계 테라스/절벽 아트 정리

- **배경**: `TerraceTop`/`CliffFace`/`Big Wall`은 이전 스킴의 임시 아트 그대로. 신규 grass 기준 아트와 톤 불일치 가능 + 테라스 타일 위 아바타 SortingLayer 최종 판정 미완(`docs/design/skill-tree-plan.md` §5 4번).
- **Target**: `RootDesk/MyDesk/wall.tileset`(Maker에서 아트 교체 — 제작자 협업) + 필요 시 `scripts/build_maps.cjs` 밴드/데코 페인팅
- **Change**: 신규 타일 아트 확정 후 테라스 링/절벽면 리스킨, 플레이어가 테라스 타일 아래로 숨는지 확인.
- **Acceptance**: 경계 밴드 비주얼이 잔디/흙 아트와 이어지고, 아바타가 지형 위에 정상 렌더.

### T27. [코드 완료 — 2026-07-11 | refresh Error=0 | Play 대기] 퀘스트 보상 → 레시피 해금 (`RewardUnlockId`)

- 퀘스트 107(넓은 세계로) 완료 → `quest_cooking_pot` 해금(`UserQuestData.Complete` 훅 → `GrantRecipeUnlock`). ⚠️ **이미 107을 완료한 세이브에는 소급 발동하지 않음 — 미완료 캐릭터로 확인.** 상세·체크리스트: `reports/T27-quest-reward-unlock.md` §6.

### T61. [완료 — ⚖️ 보스 승인(2026-07-16) 후 지휘자 직접 적용 | refresh Error=0(total 496) | 체감 확인 보류(제작자)] 지형 편집 반응 지연 개선 — 전용 쿨다운 분리 (T51 제작자 피드백)

- **진단·구현**: 원인 = 채집 스윙 쿨다운(≈0.52s)이 지형 편집에도 적용. `item_dataset.TerrainEditCooldown` 컬럼 신설(Shovel/Hoe/Grass Seed=**0.25**, 공란=기존 폴백) + `TryMine` 게이트를 아이템 선조회 후 쿨다운 선택으로 재배열. 채집·전투 무변경. 상세: `reports/T61-terrain-edit-cooldown.md` (§6 체크리스트 — 연속 길 파기 체감).

### T63. [완료 — 제작자 확인(2026-07-16, 핫픽스 LEA-3036 포함) | refresh Error=0] 낚시 랭킹 즉시 반영 수정 — 30분 캐시 우회 (T57 제작자 Play 실패 2026-07-16)

- **배경**: 제작자 Play — "낚시 랭킹이 제대로 적용 안 됨". **지휘자 진단(코드 확정)**: 점수 적립(`FishingContestLogic.AddCatchPoints` → `SetScoreAndWait` force 누적)은 SortableDataStorage에 즉시 쓰이지만, **리더보드 화면은 `RankingDataStorageLogic.UpdateDataTable()`이 만드는 서버 스냅샷(`RefreshIntervalSeconds=1800` = 30분 주기) + 클라 캐시(`RefreshCacheIntervalSeconds=600` = 10분)를 읽는다** — 어획 직후 게시판을 열면 반영이 안 보이는 것이 구조적으로 보장됨. (T57 보고서 §5가 이 리스크를 예고했음.)
- **Target**: `RootDesk/MyDesk/RankingBasic/Core/FishingContestLogic.mlua`(적립 후 갱신 트리거), `RootDesk/MyDesk/RankingBasic/Core/RankingDataStorageLogic.mlua`(주기 값·강제 갱신 경로), 랭킹 UI 열람 경로(`RankingSampleUILogic` 계열 — Open 시 최신화), (확인만) `NPC/Scripts/FishingLeaderboardInteract.mlua`.
- **Change**:
  ① **적립 직후 서버 스냅샷 갱신**: `AddCatchPoints` 말미에 `UpdateDataTable()` 호출 — 단 **디바운스 필수**(연속 어획 스팸 방지: 최소 간격 프로퍼티, 10s 제안. `GetSortedAndWait` 전량 조회 비용 보호).
  ② **열람 시 최신화**: 리더보드 UI Open 경로에서 서버 스냅샷 최신화 요청 후 목록 표시 + **클라 캐시(600s)도 Open 시 무효화/우회** — 패키지에 기존 강제 갱신 경로(어드민 툴/ForceUpdate 등)가 있으면 재사용(규칙 8: 정의 확인 후), 없으면 최소 RPC 신설.
  ③ **주기 완화(보조)**: `RefreshIntervalSeconds` 1800→300, `RefreshCacheIntervalSeconds` 600→60 (설정값 — 튜닝 자유, 근거 보고).
  ④ **선행 진단 로그**: 구현 전 Play 로그에서 `[T57][FISHRANK] catch ... ok=true` 확인 — 적립 자체가 실패(ok=false / "not ready" 경고)라면 그 로그를 첨부하고 [보류]+질문(원인이 다름).
- **Acceptance**: ① 물고기 잡고 **곧바로** 게시판 F → 내 점수·순위 반영 ② 연속 어획 누적 정상 ③ 디바운스 동작(스팸 어획 시 스토리지 호출 폭주 없음 — 로그 근거) ④ 패키지 타 기능 회귀 0 ⑤ refresh Error=0 + 보고 3종. Play 최종 확인은 제작자.
- **충돌 주의**: `RankingBasic/` 레인 단독. `FishingSpot.mlua`·`PlayerInventory`·`PersistenceManager` 수정 금지(훅은 이미 존재). 보상 지급은 여전히 범위 밖(후속 — T57 보고서 §5 제안 참조).
- **구현 요약 (2026-07-16)**: 선행 `ok=true` 확인 · `ForceRefreshSnapshot` · 적립 디바운스 10s · Open=`RequestFreshDataListWithSenderData` · 주기 300/60. FishingSpot 등 무수정. 보고서: `docs/agents/reports/T63-fishing-rank-immediate-refresh.md`.
- **핫픽스 (2026-07-16)**: 제작자 "여전히 안 보임" → 로그상 스냅샷 `rows=1`인데 UI RPC가 **LEA-3036**(`any myData`)으로 드롭. 원시 필드+평탄 table 전달로 수정. refresh Error=0.
- **검증**: Maker refresh 빌드 **Error=0** (total 497 / Warning 25 / Info 472). **런타임 검증 보류(제작자 수행)** — Open 시 `[T63][FISHRANK] UI apply myScore=` 확인.

### T64. [코드 완료 — 2026-07-18 지휘자 직접 | LSP errors=0 (전 파일) | refresh·Play 검증 보류(Maker 미기동 — 제작자 수행)] 낚시 v2 — 홀드-릴리즈 릴링 미니게임 + 낚시 숙련 레벨 (Phase 15-C v2)

- **배경(⚖️ 보스 지시 원문 요지)**: "낚시가 좀 더 어려워졌으면. **입질 이후 그냥 놓치는 경우는 없애고**, 스타듀밸리처럼 **낚시 레벨에 비례해 나오는 물고기·난이도 편차**가 생기거나, 두근두근타운처럼 **꾹 눌러서 잡되 위험 표시가 뜨면 잠시 풀었다가 다시 눌러야** 하거나. 복잡해도 직접 구현 가능." → **⚖️ 설계 확정(지휘자, 두 안 혼합)**: 릴링 조작 = 두근두근타운식 홀드-릴리즈, 편차 축 = 스타듀식 어종 난이도+숙련 레벨.
- **설계 확정**:
  ① **입질 후 미스 제거**: 기존 "입질(!) 후 0.8초 내 재입력, 놓치면 실패" 폐지 — 입질 시 **자동으로 릴링 페이즈 진입**. 실패는 오직 릴링 중 실수(줄 끊김)로만 발생(실력 기반).
  ② **릴링(홀드-릴리즈)**: F(PC)/BtnInteract(모바일) **꾹 누름** = 릴 감기 → **진행 게이지** 상승. 물고기 저항 순간 = **위험 표시(⚠, 게이지 적색 점멸)** — 즉시 손을 떼야 하고, 위험 중 계속 누르면 **텐션 게이지** 상승 → 가득 차면 줄 끊김(실패, 물고기 도망). 위험 종료 후 다시 홀드. 진행 게이지 만땅 = 어획. 놓고 있는 동안 진행 서서히 감소+텐션 회복(수치 전부 데이터).
  ③ **어종 편차(CSV — FishDataSet 컬럼 신설)**: `Difficulty`(위험 빈도·지속·텐션 상승 배율의 티어), `MinFishingLevel`(추첨 풀 진입 최소 숙련 레벨 — 레벨 비례 어종 개방), `FishingXp`(어획 시 숙련 XP). 기존 Weight/SpotType/RankPoints 유지.
  ④ **낚시 숙련 레벨**: `FishingLevel`/`FishingXp`(@Sync) + `PersistenceManager` 영속(**규칙 9 — 선캡처, Yield 추가 금지**). 레벨 효과 = 텐션 상승 완화(체감 난이도 하강) + 고레벨 어종 풀 개방. 레벨업 곡선·완화율 = 설정값(프로퍼티/CSV — 리터럴 금지).
  ⑤ **UI**: HUD `FishingGauge` 신설(진행 금색 + 텐션 적색 + ⚠ 표시 — 기존 HUD 비주얼 아이덴티티, 규칙 6·10 준수, **단일 레이아웃 §1.5**). 낚시 중에만 표시.
  ⑥ **입력**: F KeyDown/KeyUp 홀드 감지 + 모바일 BtnInteract down/up(ButtonComponent 이벤트 정의 확인 — 규칙 8. T59 `InteractRequestEvent`는 단발 신호라 홀드용 down/up 경로 별도 확인, 미지원 시 [보류]+보스 상의).
- **Target**: `Furniture/Scripts/FishingSpot.mlua`(릴링 상태기 — 기존 세션 관리·RollFish 재사용, BiteTime·날씨 FishBiteMult 유지), `Player/Scripts/PlayerController.mlua`(낚시 입력 홀드/릴리즈 + FishingLevel), `Player/Scripts/PersistenceManager.mlua`(숙련 영속), `item/DataSets/FishDataSet.csv`(컬럼 3종), `ui/HUDGroup.ui`(FishingGauge — UIBuilder), `UI/Scripts/UIFishingGaugeController.mlua`(신규).
- **Acceptance**: ① 입질 후 "그냥 놓침" 0 — 실패는 텐션 초과(줄 끊김)뿐 ② 위험 표시 중 홀드 유지 시 텐션 상승→끊김, 릴리즈-재홀드 리듬으로 어획 가능 ③ 어종별 난이도 체감 차이(Difficulty) + 숙련 레벨업 시 고레벨 어종 등장·텐션 완화(로그 근거) ④ 재접속 후 숙련 레벨 유지 ⑤ 낚시왕 랭킹(T57/T63)·날씨 입질 보너스(T21) 회귀 0 ⑥ 수치·어종 하드코딩 0(전부 CSV/프로퍼티) ⑦ refresh Error=0 + 보고 3종 + §7 루브릭(FishingGauge). 난이도 감성은 제작자 Play.
- **충돌 주의**: 지휘자 단독 레인(FishingSpot·PlayerController·PersistenceManager·HUDGroup.ui). 규칙 9(세이브)·규칙 11(.ui 편집 전 refresh 상태 확인) 준수.
- **구현 요약 (2026-07-18)**: ① 미스 폐지 — `TriggerBite`=자동 릴링 진입, 실패=텐션 초과 `FailReel`뿐 ② 서버 `ReelTick` 0.1s(진행/텐션/위험 랜덤 스케줄) + 클라 홀드 폴링(F `IsKeyPressed` ∨ 모바일 플래그, 변화 시만 `ServerSetReelHold`) ③ `FishDataSet` 컬럼 3종 + 신규 `FishingDifficultyDataSet`(티어별 파라미터 CSV) ④ `FishingLevel/FishingXp` @Sync+영속(선캡처, Yield 무추가) — 텐션 완화·풀 개방 ⑤ HUD `FishingGauge`(공용 프레임+UIMyInfo 바 패밀리+골드, §7 루브릭 8/8) ⑥ 모바일=BtnInteract `ButtonStateChangeEvent` Pressed/Released(정의 실확인 — [보류] 불필요). Target 외 최소 수정: `UIHUDController.mlua`(BtnInteract 배선 소유 파일 — 홀드 핸들러 1쌍). 보고서: `reports/T64-fishing-v2-reeling.md`.

### T65. [코드 완료 — 2026-07-18 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 채집·기본 공격 스윙/타격 사운드 (⚖️ 2026-07-18 보스 지시 — 배치 J ①)

- **배경**: Ctrl 채광/공격에 사운드가 전무. 지휘자 실사(코드 확정): `PlayerController.ClientPlayMineEffect`(825행 부근)가 **주석 "(Disabled)"의 빈 함수** — `RequestMine`이 이미 hitSuccess(true=자원/몬스터 명중, false=허공)와 대상 엔티티를 넘겨 호출 중이라 훅 포인트는 살아 있다. 몬스터 피격 측 훅 = `Monster.HandleHitEvent`(185행 — FlashHit·넉백 선례, 기본 공격·스킬 모두 HitEvent로 수렴). Phase 18 사운드 축(18-D) 연장.
- **Target**: `Player/Scripts/PlayerController.mlua`(스윙/타격 재생), `item/DataSets/item_dataset.csv`(+`SwingSoundRUID`/`HitSoundRUID` 컬럼), `Monster/Scripts/Monster.mlua`(피격음 — HandleHitEvent), (동기화 확인만) `MapObjects/Scripts/ResourceReaction.mlua`
- **Change**:
  ① 음원 확보 = **msw-search 공식 리소스 검색이 1순위**(원작 무기 스윙/타격 SFX — R1). 자작 금지.
  ② `item_dataset`에 `SwingSoundRUID`/`HitSoundRUID` 컬럼 신설 — 도구별 소리 차등(곡괭이/도끼/맨손 등). 공란 폴백 = PlayerController 프로퍼티 기본 RUID(맨손). `if name == "..."` 분기 금지(R3).
  ③ 스윙음: `TryMine`의 MINE 상태 진입 경로(허공 스윙 포함 매 스윙)에서 장착 도구의 SwingSoundRUID 재생. 지형 편집 도구(T61)는 스윙음만 — 별도 타격음 확장 금지.
  ④ 타격음: 자원 명중(`RequestMine` pivotKey 분기) + 몬스터 명중(`Monster.HandleHitEvent`)에서 HitSoundRUID 재생. 서버→클라 전파는 기존 `MulticastPlaySkillSound` 선례 미러. 위치 기반 재생 API 유무는 `_SoundService` `.d.mlua`로 **실확인**(규칙 8) — 없으면 2D 재생으로 확정.
- **Acceptance**: ① Ctrl 스윙마다 스윙음(허공 포함) ② 자원/몬스터 명중 시 타격음 추가 재생 ③ 도구별 소리 차등이 **CSV 행 수정만으로** 반영 ④ 하드코딩 0 ⑤ 스킬 시전 사운드(T46 `SkillDataSet.SoundRUID`) 무수정·회귀 0 ⑥ refresh Error=0 + 보고 3종. 체감(음량·톤)은 제작자 Play.
- **충돌 주의**: `PlayerController.mlua`·`Monster.mlua`는 T66과 공유 — **배치 내 순차 엄수**.
- **구현 요약 (2026-07-18)**: CSV 컬럼 2종+도구 RUID · `ResolveEquippedToolSound`/`ClientPlaySwingSound` · 자원=`ClientPlayMineEffect` · 몬스터=`HandleHitEvent`→`MulticastPlaySkillSound` · `_SoundService:PlaySound` 2D. 보고서: `docs/agents/reports/T65-mine-attack-sfx.md`.
- **검증**: Maker refresh **Error=0** (total 517 / Warning 25 / Info 492). **런타임 검증 보류(제작자 수행)**.

### T66. [부분 완료 — 대시 데미지·피격 훅은 동작(로그 확인) | **이펙트 가시화는 Play 실패(2026-07-18 제작자) → T70 재작업** | 지휘자 로그 진단: 클라 PlayEffect 전건 serial=0(생성 실패), 서버만 serial>0] 스킬 이펙트 실표시 수리 + 원작 이펙트·피격 이펙트 + 대시 데미지 (⚖️ 2026-07-18 보스 지시 — 배치 J ②)

- **배경**: 제작자 Play — "스킬 이펙트가 없다. 원작 메이플처럼 이펙트·데미지를 맞춰라(대시도 데미지)". 지휘자 실사: T46이 `SkillDataSet.EffectRUID` → `MulticastPlayEffect`(`_EffectService:PlayEffect`, 시전 위치)를 이미 구현했고 4스킬 전부 RUID가 채워져 있는데 **비주얼만 안 보임**(사운드는 동일 게이트의 코드가 재생됨) → 유력 원인 ⓐ EffectRUID 무효 ⓑ **렌더 정렬**(톱다운 타일맵에 깔림 — `ExecuteProjectileSkill` 2316~2320행이 `IgnoreMapLayerCheck=true`+`SortingLayer=EntityLayer`를 명시 설정해야 보였던 선례). 또한 피격 이펙트 전무, dash 행 `DamageMultiplier=0`.
- **Target**: `Player/Scripts/PlayerController.mlua`(이펙트 재생 경로·`ExecuteDashSkill`), `Player/DataSets/SkillDataSet.csv`(+`HitEffectRUID` 컬럼, dash 데미지 값), `Player/Scripts/Projectile.mlua`(명중 이펙트 훅), `Monster/Scripts/Monster.mlua`(피격 이펙트 훅 — T65와 같은 파일, 순차라 충돌 없음)
- **Change**:
  ① **진단 선행**: refresh 후 로그로 `PlayEffect` 호출 도달·RUID 유효성 확인 → 원인 확정 후 수정. 정렬 문제면 이펙트에 SortingLayer/레이어 무시를 지정 — `PlayEffect`/`PlayEffectAttached` 등 시그니처의 정렬 옵션 유무를 `.d.mlua`로 **실확인**(규칙 8, 추정 호출 금지). EffectRUID 무효면 msw-search로 원작 스킬(파워 스트라이크/매직 클로/플래시 점프/슬래시 블러스트) 이펙트 RUID 재확보.
  ② 시전 이펙트 원작화: 바라보는 방향 반영(좌우 플립/회전) + 시전자 전방 오프셋 — 오프셋·스케일 수치는 CSV 컬럼 또는 컴포넌트 프로퍼티(리터럴 금지).
  ③ `HitEffectRUID` 컬럼 신설 — 피격 몬스터 위치에 원작 피격 이펙트 재생. 훅 = `Monster.HandleHitEvent`에서 스킬 식별이 HitEvent 페이로드로 가능한지 **실확인 후** 결정, 불가하면 공격측(AttackFast 명중 결과/Projectile 명중)에서 재생.
  ④ **대시 데미지**: `SkillDataSet` dash 행 `DamageMultiplier`>0 + `DamagePerLevel` 부여(제안 1.0/+0.2 — 수치는 CSV, 튜닝은 제작자) + `ExecuteDashSkill`이 시작→도착 경로를 스윕 박스로 판정해 기존 `PendingDamage`+`AttackFast` 경로(ExecuteAreaDamageSkill 미러)로 데미지 적용 + 경로/도착 이펙트.
  ⑤ 기존 3스킬 배율(1.5/2.2/4.5)은 유지 — 전면 리밸런스는 범위 밖(제작자 Play 후 별도 티켓).
- **Acceptance**: ① 4스킬 전부 시전 이펙트 가시(코드 근거=로그·정렬 설정, 육안은 제작자 Play) ② 피격 몬스터에 피격 이펙트 ③ 대시 경로상 몬스터가 데미지를 입음(로그 근거) ④ 이펙트·수치 전부 CSV/프로퍼티 ⑤ 쿨다운·스태미나·사운드·기존 데미지 회귀 0 ⑥ refresh Error=0 + 보고 3종.
- **충돌 주의**: `PlayerController.mlua`·`Monster.mlua` 공유 — T65 완료 후 착수.
- **구현 요약 (2026-07-18)**: EffectRUID 유효 확인·비가시=정렬 누락 → `MulticastPlayEffectEx`(IgnoreMapLayerCheck+EntityLayer+FlipX) · HitEffectRUID+PendingHitEffectRUID · dash 1.0/+0.2+경로 AABB. 보고서: `docs/agents/reports/T66-skill-vfx-dash-damage.md`.
- **검증**: Maker refresh **Error=0** (total 517 / Warning 25 / Info 492). **런타임 검증 보류(제작자 수행)**.

### T67. [코드 완료 — 2026-07-18 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 상호작용 조준선(에임 셀) 게이트 — 근접 판정 폐지 (⚖️ 2026-07-18 보스 지시 — 배치 J ③)

- **배경**: 제작자 — "근처에만 있어도 상호작용돼 다른 오브젝트와 꼬인다. 조준선 안에 있을 때만 되어야 한다". 지휘자 실사(코드 확정): ⓐ PC의 F는 `PlayerController.TryInteract`(근접 1.5셀 최근접 체인)와 **분산 핸들러 6종이 KeyDown F를 동시 독립 리슨**(상인 3.0셀 등 각자 거리 판정) — 겹치면 복수 발동 ⓑ 모바일 `InteractRequestEvent` 브리지도 수신 측 각자 거리 판정이라 동일. 조준선 셀은 이미 존재: `UpdateMineReticle`의 `targetCell = playerCell + LastDirection`.
- **Target**: `Player/Scripts/PlayerController.mlua`(판정 헬퍼 + TryInteract/FindNearby* 교체), 분산 핸들러 6종 = `NPC/Scripts/MerchantInteract.mlua`·`NPC/Scripts/VillagerDialog.mlua`·`NPC/Scripts/FishingLeaderboardInteract.mlua`·`MapObjects/Scripts/ResearchLab.mlua`·`MapObjects/Scripts/BulletinBoard.mlua`·`MapObjects/Scripts/Animal.mlua`
- **Change (🧭 지휘자 설계 확정 2026-07-18)**:
  ① PlayerController에 공개 판정 헬퍼 **`IsAimTarget(Entity target): boolean` 단일 정의** — 조준선 셀(playerCell+LastDirection) 중심 월드 좌표가 대상 점유 범위 안이면 true. 점유 범위 기본 = 대상 위치 중심 1×1셀, 대형 구조물(연구소/게시판/우리/침대 등)은 **컴포넌트 프로퍼티(footprint 셀 폭·높이)**로 확장 — 이름 분기 금지(R3).
  ② 🧭 **트리거형 예외 = 발밑 셀 허용**: 포탈(`ActivePortal` 트리거 유지 — 밟고 서서 F)과 낚시 릴링 상태 분기는 기존 유지. 그 외는 전부 조준선 게이트.
  ③ PC-owned 대상(보물상자/침대/화로/상자/낚시터)의 `FindNearby*` 최근접 검색을 조준선 판정(`IsAimTarget` 필터)으로 교체.
  ④ 분산 핸들러 6종의 거리 판정(`dist <= 3.0` 등)을 `IsAimTarget(self.Entity)` 호출로 교체(LocalPlayer의 PlayerController 취득 — 규칙 8은 이 티켓에서 ①을 먼저 정의하므로 충족). `Animal`은 배회형이라 대상 **현재** 셀 기준 — 체감 불편은 제작자 피드백 후 완화(후속).
  ⑤ `TryInteract` 미처리 → `InteractRequestEvent` 브리지 구조는 유지(T59 회귀 금지). 같은 셀에 복수 후보가 겹치는 예외 상황만 기존 우선순위 체인 유지.
- **Acceptance**: ① 조준선 셀의 대상만 상호작용 — 1.5셀 내 인접해 있어도 조준선 밖이면 무반응 ② 화로+상자+상인 밀집 배치에서 방향 전환만으로 대상이 정확히 갈림(복수 팝업 0) ③ 포탈 밟고 F 워프 정상 ④ 모바일 BtnInteract도 동일 동작 ⑤ 낚시(캐스팅~릴링)/수면/목장 급여 회귀 0 ⑥ refresh Error=0 + 보고 3종.
- **충돌 주의**: `PlayerController.mlua` 공유 — **배치 마지막(T66 완료 후) 착수**. 낚시 릴링 홀드(T64 OnUpdate 폴링)는 무수정.
- **구현 요약 (2026-07-18)**: `IsAimTarget`+`AimFootprintW/H` · FindNearby* 5종 · 분산 6종 거리→조준선 · Animal InteractRequestEvent 추가 · 포탈/낚시 예외 유지. 보고서: `docs/agents/reports/T67-aim-cell-interact-gate.md`.
- **검증**: Maker refresh **Error=0** (total 471 / Warning 25 / Info 446). **런타임 검증 보류(제작자 수행)**.

### T68. [완료 — 2026-07-18 지휘자 직접 | refresh Error=0 | 체감 확인 = 제작자 Play] 전투·채집·스킬 SFX 전면 재선정 (⚖️ 보스 지시 "모든 소리 어색 — 네가 선택")

- **배경**: T65/T46 음원 선정의 구조적 결함(지휘자 실사 — 공식 리소스 API로 배정 RUID 전수 조회): 매직 클로·플래시 점프 시전음 = **UI 알림음**, 곡괭이 타격 = **파괴음**, 도끼·삽 스윙 = 쿨다운 대비 과장(0.84~0.86s). 이전 선정이 검색 결과의 설명·길이·카테고리를 확인하지 않고 채택한 것이 원인.
- **Change**: 11슬롯 전량 재검색·재선정 — 원칙 = ① 내용 일치(용도↔설명, UI음·파괴음·몬스터 울음 배제) ② 길이-쿨다운 정합(채집 ≤0.7s / 지형 0.26s / 스킬 1.2~1.6s) ③ 스킬은 `category=skill` 한정. **코드 무변경** — `SkillDataSet.SoundRUID` 4행 + `item_dataset` Swing/Hit RUID 5계열 + `PlayerController` Default 폴백 2종의 값만 교체. 선정표 = `reports/T68-sfx-reselection.md` §3.
- **Acceptance**: ① 스킬 시전음에서 UI 알림음 감각 소멸 ② 채집 연타·지형 0.25s 쿨다운에서 소리 겹침 없음 ③ 재질감(나무/돌/펀치) 구분 ④ refresh Error=0(달성 — Warning 25/Info 499). 최종 체감 = 제작자 Play, 특정 슬롯 불만 시 슬롯명 지목 → 개별 교체.

### T69. [코드 완료 — 2026-07-18 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] QWER 스킬 장착 영속화 — 재접속 초기화 수정 (⚖️ 2026-07-18 제작자 Play 버그 — 배치 K ①)

- **배경**: 제작자 — "QWER에 배치해도 재접속하면 초기화". **지휘자 진단(코드 확정)**: `EquippedSkillsJson`은 T45에서 **의도적으로 세션 값**으로 설계됨(`PersistenceManager.mlua` 216행 주석 "세이브 경로 무변경"). 세이브 캡처부(531~546행대)에 equipped 캡처 없음, 저장 테이블(640행대)에 필드 없음, 로드 경로에 복원 없음 — 재접속 시 프로퍼티 기본값 `"[]"`으로 시작. `skillLevels`(해금)는 정상 영속(533·655행). ⚖️ **보스 요구로 설계 변경 확정: 장착 목록도 영속화한다.**
- **Target**: `RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua` 단독 (PlayerController 무수정 — `EquippedSkillsJson` 프로퍼티·`SanitizeEquippedSkills`는 기존 정의 재사용, 호출 전 정의 확인 규칙 8).
- **Change**: ① `SavePlayerData` 진입부 선캡처 블록에 `local capEquippedSkills = pc.EquippedSkillsJson or "[]"` 추가(**규칙 9 — 추가 Yield 절대 금지, 기존 선캡처 블록과 같은 위치**) ② 저장 테이블에 `equippedSkills = capEquippedSkills` 필드 추가 ③ 로드 경로에서 `pc.EquippedSkillsJson = data.equippedSkills or "[]"` 복원 — **반드시 211행 `SkillLevelsJson` 복원 후, 217행 `SanitizeEquippedSkills()` 호출 전** 순서(정리 필터가 해금 데이터를 읽으므로) ④ 신규 캐릭 리셋 경로(473행)는 무변경 ⑤ 구 세이브(`equippedSkills` 필드 없음)는 `or "[]"` 폴백으로 기존 동작과 동일.
- **Acceptance**: ① QWER 장착 → 재접속 → 그대로 유지 ② 구 세이브 로드 에러 0(폴백) ③ 미해금 스킬이 세이브에 섞여도 로드 시 sanitize로 제거 ④ 세이브 루틴에 신규 Yield 0(코드 리뷰로 확인 — 규칙 9) ⑤ refresh Error=0 + 보고 3종. 재접속 확인은 제작자 Play.
- **충돌 주의**: `PersistenceManager`는 공유 파일 — 배치 내 순차(T70과 파일 겹침 없음, K 배치 선두).
- **구현 요약 (2026-07-18)**: 선캡처 `capEquippedSkills` · 저장 `equippedSkills` · 로드 순서 SkillLevels→Equipped→Sanitize · Yield 0 · `[T69][SAVE]` 로그. PlayerController 무수정. 보고서: `docs/agents/reports/T69-equipped-skills-persist.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T70. [완료 — 모션 OK | 이펙트는 폴백 3단 전부 serial=0(제작자 로그) → **원인 instigator=nil로 확정, T71에서 수정·런타임 검증 완료**] 스킬 시전 모션 + 이펙트 클라 생성 실패 수정 (⚖️ 2026-07-18 제작자 Play 버그 — 배치 K ②, T66 재작업)

- **배경**: 제작자 — "스킬 사용 시 모션·이펙트가 여전히 없음". **지휘자 런타임 로그 진단(2026-07-18 Play 로그 실측)**:
  - **이펙트**: `[T66][FX] PlayEffect` 로그가 시전마다 쌍으로 발생 — **서버(fromServer=true) serial=2147483665+ (성공·비렌더), 클라(fromServer=false) 전건 serial=0 (생성 실패)**. 즉 T46 시절=옵션 없이 생성돼도 정렬에 가려짐(추정), T66 이후=옵션 딕셔너리를 붙이자 클라 생성 자체가 실패. RUID 8종은 전부 유효한 `animationclip`(지휘자 리소스 API 전수 확인). `EffectService.d.mlua` 시그니처의 7번째 `options` 인자는 실존(FlipX/SortingLayer/OrderInLayer/IgnoreMapLayerCheck 등 키 명시) — **어느 옵션 키가 클라 생성을 죽이는지가 미확정**.
  - **모션**: 시전 경로에 아바타 액션 트리거가 전무 — 채집(`MineState.mlua` — `ActionStateChangedEvent`로 swingO1/O2 재생, `SwingAction` 컬럼 데이터 주도)과 달리 스킬은 어떤 상태/액션도 재생하지 않음.
- **Target**: `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua`(`MulticastPlayEffectEx` 폴백 체인 + 시전 모션 멀티캐스트), `RootDesk/MyDesk/Player/DataSets/SkillDataSet.csv`(+`CastAction` 컬럼), (경로 공유 확인만) `Monster/Scripts/Monster.mlua` 227행 `MulticastPlayEffectEx` 호출 — 시그니처 유지.
- **Change**:
  ① **이펙트 — 런타임 폴백 체인(자가 진단 겸 자가 치유)**: `MulticastPlayEffectEx`에서 (a) 서버면 스킵(`self:IsClient()` 가드 — 서버 생성은 무의미) (b) full 옵션으로 `PlayEffect` → serial 0이면 `{IgnoreMapLayerCheck=true}`만으로 재시도 → 또 0이면 옵션 nil 재시도 — 각 단계 `[T70][FX] variant=<full|min|none> serial=` 로그. 어느 변형이든 성공하면 화면에 뜨고, 로그가 범인 키를 특정한다. 3단계 전부 0이면 RUID 런타임 무효 → `[T70][FX] ALL-FAIL ruid=` 경고 로그(후속: 지휘자 RUID 재선정).
  ② **모션 — `CastAction` 컬럼 신설(데이터 주도, MineState 선례 미러)**: 시전 성공 시(`ServerRequestCastSkill` 검증 통과 지점) Multicast로 아바타 body에 `ActionStateChangedEvent`(CoreActionName=PartsActionName=`CastAction` 값, Onetime, PlayRate 1.33 — MineState 8~58행 미러) 전송. 컬럼 공란이면 모션 생략. **기본값 제안(CSV — 튜닝 자유)**: power_strike=`swingO2` / fireball(매직 클로)=`shoot1` / earth_shatter=`swingT2` / dash=공란(도약 이동 자체가 연출). ⚠ 액션 ID 실존 여부는 **msw-avatar 스킬로 확인 후 기입**(원작 body action 세트 — 규칙 8 준용, 존재하지 않는 액션명 금지). 무기 파츠 유무에 따른 한손/양손 계열 주의(MineState 13~16행 주석).
  ③ 피격 이펙트(`[T66][HITFX]` 경로)·대시 데미지(`[T66][DASH]` — 로그상 정상 동작)는 무수정. `MulticastPlayEffectEx` 시그니처 유지(Monster 227행 호출 호환).
- **Acceptance**: ① 4스킬 시전 시 클라 `[T70][FX] ... serial>0` 로그(제작자 Play 후 로그로 판정 — 어느 variant인지 보고서에 기재) ② 시전 시 아바타 모션 재생(CastAction 공란 스킬 제외) ③ CSV 행 수정만으로 모션 교체 가능 ④ 피격 이펙트·대시 데미지·사운드 회귀 0 ⑤ Monster 227행 경로 정상(시그니처 무변경) ⑥ refresh Error=0 + 보고 3종.
- **충돌 주의**: `PlayerController.mlua`·`SkillDataSet.csv` 수정 — T69(PersistenceManager)와 파일 겹침 없으나 **배치 순차 유지**. 착수 전 msw-scripting + **msw-avatar**(액션 ID 확인) + msw-combat-system 스킬 로드.
- **구현 요약 (2026-07-18)**: 클라 가드+full/min/none 폴백 · `CastAction` CSV+`MulticastPlayCastAction`(MineState 미러) · 액션 ID msw-avatar 실존 확인 · 시그니처 유지. 보고서: `docs/agents/reports/T70-skill-cast-motion-fx-fallback.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T71. [완료 — 2026-07-18 지휘자 직접 | refresh Error=0 | **런타임 검증 완료(시전 경로 클라 serial>0 로그)** | 육안 최종 확인 = 제작자] 스킬 이펙트 미표시 진범 수정 — `PlayEffect` instigator nil 금지 (⚖️ 보스 "직접 원인 찾아 수정" 지시)

- **원인 (지휘자 런타임 실측 — Play `maker_execute_script` 격리 실험)**: `_EffectService:PlayEffect`의 2번째 인자 **instigator에 `nil`을 넘기면 클라이언트에서 이펙트 생성이 조용히 실패(serial=0)** 하고, 유효 엔티티를 넘기면 즉시 성공. 실험 매트릭스: A(nil)=0 / B(LocalPlayer)=2 / C(Attached)=3 / D(다른 클립+nil)=0 / E(ParticleService+nil)=0 — **옵션·RUID·정렬 전부 무관, nil instigator가 유일 변수**. T46부터 모든 호출이 nil을 넘겨 왔음(서버는 nil 관대 통과로 serial>0 반환 — T70 진단의 "서버만 성공" 현상의 정체). 클립 자체는 정상 프레임 기반 원작 스킬 이펙트(리소스 API로 frames·subPath 확인).
- **수정**: `PlayerController.MulticastPlayEffectEx`의 PlayEffect 3곳 `nil` → `self.Entity`(시전자). 전 이펙트 경로(시전/피격/대시/Monster 227행)가 이 메서드로 수렴 — 단일 지점 수정. 폴백 체인·시그니처 유지, 로그 태그 `[T71][FX]`.
- **검증**: refresh **Error=0**(Warning 25/Info 502) + Play에서 `ServerRequestCastSkill` 직접 호출 — 클라 `[T71][FX] variant=full serial=1`(파워 스트라이크)·`serial=2`(대시) + `[T70][CAST] play action=swingO2` 모션 재생 확인. **variant=full 성공 = SortingLayer(MapLayer5)+IgnoreMapLayerCheck 적용 상태로 생성** → 타일 위 렌더 보장. 육안 색감·타이밍 확인만 제작자 몫.
- **재발 방지**: §1.2 규칙 12 신설(아래). 보고서: `reports/T71-effect-instigator-nil.md`.

### T72. [코드 완료 — 2026-07-21 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 아이템 아이콘 교체 및 모델 외형 일치화 (P0-D)
- **배경**: 임시로 잘못 재사용 중인 아이콘을 교체. 또한 아이템 아이콘과 실제 필드 모델 모양이 불일치하는 사례가 많아 일치화 필요. 인벤토리/퀵슬롯뿐만 아니라 모든 UI(제작, 도감 등)에서 일관되게 표시되도록 정비.
- **Target**: `RootDesk/MyDesk/item/DataSets/item_dataset.csv` 등 데이터셋
- **Change**: `artwork-spec.md` §5 표를 참고하되, 해당 RUID 대신 `msw-search`로 실제 인게임 모델과 일치하는 더 적합한 RUID를 새롭게 찾아 교체. 필요 시 다른 아이템들의 IconRUID도 전수 조사하여 외형 불일치 교정.
- **Acceptance**: 아이템 아이콘이 모델 외형과 일치하며, 모든 UI에서 정상 표시. refresh Error=0.
- **구현 요약 (2026-07-21)**: msw-search Icon 10건 + Recipe 6건. Furniture_Bed/Item_Bed 월드 침대 RUID. 보고서: `docs/agents/reports/T72-item-icon-model-match.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T73. [코드 완료 — 2026-07-21 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 마을 광장 분수대 및 우물 리스킨 및 재배치 (P0-A 파트 1)
- **배경**: 마을 중심 광장에 분수와 우물을 더 자연스럽고 심미적인 위치로 재배치. (상점 아트는 수정 불필요)
- **Target**: `RootDesk/MyDesk/MapObjects/Models/` (신규 .model), `map/town.map`
- **Change**: B8(분수대), B9(우물) 아트를 활용하여 `.model` 신규 작성 후 `town.map` 광장에 배치. 기존에 배치했던 어색한 위치를 피해 심미적으로 더 나은 좌표로 재배치. 통행 차단은 기존 `Building_Shop` 미러. 대장간(B7)도 필요시 재배치.
- **Acceptance**: 상점을 제외한 분수대, 우물 등이 구도에 맞게 정상 배치됨. 충돌/정렬 이상 없음. refresh Error=0.
- **구현 요약 (2026-07-21)**: Fountain(0,4.5)·Well(4.5,−4.5)·Blacksmith(9,−1.5). Shop 무수정. 보고서: `docs/agents/reports/T73-plaza-fountain-well.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T74. [코드 완료 — 2026-07-21 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 주거구역 주택 5동 배치 (P0-A 파트 2)
- **배경**: 주거구역을 형성할 버섯집 및 초가집 배치. `docs/design/artwork-spec.md` §2.
- **Target**: `RootDesk/MyDesk/MapObjects/Models/` (신규 .model), `map/town.map`
- **Change**: B1~B5 (주택 5종) RUID 확보. 접지선 및 톱다운 시점 보정 후 신규 `.model` 작성. `town.map`의 주거구역에 심미적으로 배치.
- **Acceptance**: 주택 5동 정상 배치 및 충돌 판정 정상. refresh Error=0.
- **구현 요약 (2026-07-21)**: House 5종 북서·남서·남동 배치. 보고서: `docs/agents/reports/T74-town-houses.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T75. [대기] 상점거리 노점 및 생활 소품 배치 (P0-B, P0-C)
- **배경**: 마을 생활감 증대를 위한 데코 소품 14종 배치. `docs/design/artwork-spec.md` §3, §4.
- **Target**: `RootDesk/MyDesk/MapObjects/Models/` (신규 .model), `map/town.map`
- **Change**: M1~M3(노점) 및 P1~P11(소품 11종) 아트 확보 및 `.model`화. 비충돌 데코는 Body 없이. 다중 배치를 위해 `modelId` 활용하여 곳곳에 배치.
- **Acceptance**: 조명, 벤치, 울타리, 노점 등이 정상 렌더링 및 배치됨. refresh Error=0.

### T76. [대기] 마을 랜드마크 건물 배치 (P0-A 파트 3)
- **배경**: 마을 스카이라인을 형성하는 대형 랜드마크(여관, 시계탑, 헛간) 추가. `docs/design/artwork-spec.md` §2.
- **Target**: `RootDesk/MyDesk/MapObjects/Models/` (신규 .model), `map/town.map`
- **Change**: B6(여관), B10(시계탑), B11(헛간) 아트 확보 및 시점 압축 보정. 신규 `.model` 작성 후 외곽 및 모서리에 배치.
- **Acceptance**: 대형 건물 3동 정상 배치. 캐릭터가 올바르게 앞/뒤로 가려짐. refresh Error=0.

### T77. [코드 완료 — 2026-07-21 | refresh Error=0 | 런타임 검증 보류(제작자 수행)] 비전투 마을 NPC 및 생물 다양화 (P1)
- **배경**: NPC 4인 및 고양이 배치. `docs/design/artwork-spec.md` §6.
- **Target**: `RootDesk/MyDesk/NPC/Models/` (신규 .model), `map/town.map`, `RootDesk/MyDesk/NPC/DataSets/DialogDataSet.csv`
- **Change**: N1~N7의 팩 ID에서 RUID 확보. 기존 `Villager_Elder` 미러링하여 신규 NPC `.model` 작성. `DialogDataSet`에 대사 부여 후 배치.
- **Acceptance**: NPC들이 마을 곳곳에 배치되고 대화 상호작용 동작. 고양이가 배회함. refresh Error=0.
- **구현 요약 (2026-07-21)**: ResidentA~D + Animal_Cat + Dialog 8행. 보고서: `docs/agents/reports/T77-town-npcs-cat.md`.
- **검증**: Maker refresh **Error=0** (total 527 / Warning 25 / Info 502). **런타임 검증 보류(제작자 수행)**.

### T78. [대기] 필드 및 영지 바이옴 오브젝트 변주 (P1)
- **배경**: 단조로운 필드의 나무, 바위 등 변주. `docs/design/artwork-spec.md` §7.
- **Target**: `RootDesk/MyDesk/MapObjects/Models/` (신규 .model), `map/template_field.map`, `map/town.map` (낚시터)
- **Change**: F1~F3, F5, F7~F9 아트 확보 및 `.model` 작성. 변주된 자연물을 사냥터에 배치. 마을 낚시터 리스킨 반영.
- **Acceptance**: 낚시터 리스킨 적용 및 사냥터 시각적 다양성 증가. refresh Error=0.

### (신규 작업 추가 템플릿)

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
3. **보고서 파일 작성** — [reports/_TEMPLATE.md](./reports/_TEMPLATE.md)를 복사해 `docs/agents/reports/T<n>-<kebab-슬러그>.md`로 저장 (예: `T6-farming-mvp.md`).
   - T항목당 파일 1개. 재작업 시 새 파일을 만들지 말고 같은 파일을 갱신하고 §7 이력에 append.
   - §4 검증 섹션에는 **실행한 검증만** 근거(로그 발췌)와 함께 적고, 못 한 것은 "보류" 명시.
   - §6에 해당 T항목의 제작자 런타임 체크리스트를 체크박스로 복사해 둔다 (제작자가 Play 검증 후 체크).

---

## 5. 외부 에이전트 킥오프 프롬프트 (복붙용 표준)

> 타사 에이전트(Codex/Cursor/Copilot/기타)에게 작업을 넘길 때 아래 블록의 `T<n>`만 바꿔 그대로 붙여넣는다.
> 대부분의 에이전트는 루트 `AGENTS.md`를 자동 로드하므로 절대 규칙은 이중으로 걸린다.

> **품질 추가 조항 (아래 5줄을 모든 킥오프 프롬프트 말미에 그대로 덧붙여 전달할 것)**
>
> ```
> 7. .mlua를 만지기 전에 msw-scripting 스킬(SKILL.md + references/verify-checklist.md)을 로드하라.
> 8. 다른 스크립트의 메서드/프로퍼티를 호출하기 전에 대상 파일에서 정의를 검색해 존재를 확인하라(§1.2 규칙 8). 없는 API를 추정으로 호출하지 마라.
> 9. refresh 검증은 티켓 완료마다 1회 수행하고 빌드 Error 수를 보고서 §4에 기재하라(레인 말미 몰기 금지).
> 10. 어떤 이유로든 중단할 때도 T항목 상태 갱신([보류]+사유)과 부분 보고서를 남겨라 — 무보고 종료는 반려다.
> 11. ⛔ [완료] 표기는 보고서 파일(docs/agents/reports/T<n>-*.md)을 먼저 작성한 뒤에만 허용된다. 보고서 없는 완료 표기는 즉시 반려다 — 이 위반이 반복 기록되었다. 작업 시작 시 첫 응답에 이 조항을 인지했음을 한 줄로 명시하라.
> ```
>
> ⚠️ **11번 조항은 킥오프 프롬프트 "최상단"에도 한 번 더 복사해 넣을 것** (2026-07-11 보스 지시 — 무보고 완료 재발 방지).


```
너는 이 저장소(MSW 게임 프로젝트)의 구현 담당 에이전트다. 계획 수립과 의사결정은 이미 끝났고, 너는 지시된 작업만 수행한다.

1. 먼저 `AGENTS.md`와 `docs/agents/subagent-handoff.md`의 §1(공통 컨텍스트)을 전부 읽어라.
2. 그 다음 §3 작업 큐에서 **T<n>** 항목만 수행하라. Target/Change/Acceptance에 명시되지 않은 것은 하지 마라 (리팩터링·기능 추가·다른 T항목 착수 금지).
3. 스펙이 모호하거나 하드코딩이 불가피해 보이면 임의 판단하지 말고 멈춰서 질문하라.
4. 시작 시 해당 T항목 상태를 [진행]으로 바꾸고, 종료 시 §4 보고 형식대로 보고 + 상태를 갱신하라.
5. 종료 시 반드시 `docs/agents/reports/_TEMPLATE.md` 양식으로 보고서 파일을 `docs/agents/reports/T<n>-<슬러그>.md`에 작성하라 (§4의 세 번째 필수 산출물 — 없으면 작업 미완료).
6. Play 런타임 검증은 네 범위가 아니다 — LSP 진단·refresh 빌드 로그까지만 검증하고, 나머지는 "런타임 검증 보류(제작자 수행)"로 정확히 보고하라.
```

> **배치 킥오프 프롬프트 (여러 T를 일괄 위임할 때)**
> 배치 목록(`T<a> → T<b> → …`)만 §3 현황판의 배치 정의로 바꿔 그대로 붙여넣는다.

```
너는 이 저장소(MSW 게임 프로젝트)의 구현 담당 에이전트다. 이번에는 **배치(연속 작업 목록)**를 위임받아 대규모로 수행한다.

1. 먼저 `AGENTS.md`와 `docs/agents/subagent-handoff.md` §1(공통 컨텍스트)을 전부 읽어라.
2. §3 작업 큐에서 **T<a> → T<b> → T<c>** 를 이 순서대로 하나씩 수행하라. **반드시 순차** — 앞 항목의 보고(상태 갱신+보고서 파일)까지 완료한 뒤 다음 항목에 착수한다. 순서를 바꾸거나 병합하지 마라.
3. 각 항목마다: 시작 시 [진행] 표기 → 구현 → LSP 진단+refresh 빌드 검증 → §4 보고 3종(채팅 요약 / T항목 상태 갱신 / `docs/agents/reports/T<n>-*.md`) 완료. 보고서는 항목당 1개씩 따로 작성한다.
4. 어느 항목이 질문 대기로 막히면(스펙 모호/하드코딩 불가피) 그 항목만 [보류]+질문을 남기고 다음 항목으로 진행하라. 단, 보류 항목에 의존하는 항목은 착수하지 말고 건너뛴 사실을 보고에 명시하라.
5. 배치 도중 새로 발견한 문제는 §3에 신규 T항목으로 추가만 하고 임의 착수하지 마라. Target/Change/Acceptance 밖의 리팩터링 금지.
6. Play 런타임 검증은 네 범위가 아니다 — 항목별로 "런타임 검증 보류(제작자 수행)"로 정확히 보고하라.
7. 배치 종료 시 최종 요약(완료/보류/건너뜀 목록 + 제작자가 Play로 확인할 통합 체크리스트)을 채팅으로 보고하라.
```
