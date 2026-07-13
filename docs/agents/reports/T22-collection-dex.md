# T22 작업 보고서 — 도감 & 업적 (수집 도감 신규 + 업적 패키지 재사용)

- **작업**: T22 도감 & 업적 (`docs/agents/subagent-handoff.md` §3 T22)
- **상태**: 코드 완료 | mlua-diagnose errors=0 | refresh 빌드 Error=0 | 런타임(카운터/3탭) 로그 검증 PASS | Play 육안 보류(제작자)
- **수행 에이전트/환경**: 구현자(Claude, claude-sonnet-5), Maker 기동(MCP refresh/play/execute_script), LSP 사용
- **날짜**: 2026-07-13

## 1. 요약

착수 조사에서 **QuestAndAchievement 패키지에 업적 시스템이 이미 완비**돼 있음을 확인(데이터·조건·완료·보상+처치/채집/제련/워프 훅). 티켓 원문의 "신규 AchievementDataSet 생성"은 패키지와 중복이라 보스가 **"도감 신규 + 업적 재사용"**으로 확정. 실제 빈 곳인 **수집 도감**(아이템/몬스터, 실루엣→발견, 누적 수, 영속)을 신규 구현하고, 업적은 도감 UI의 '업적' 탭으로 기존 `AchievementDataSet` + 플레이어 상태를 노출했다. 카운터는 모든 획득이 통과하는 `AddItem` 1곳 + `Monster.Dead` 막타 훅으로 집계하며 `PlayerInventory`의 평탄 JSON 2개에 저장, `PersistenceManager`가 영속한다. 런타임에서 카운터 저장·3탭 구성·오류 0을 로그로 확인. Play 육안은 제작자.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` | `DexItemsJson`/`DexMonstersJson`(@Sync, 평탄) + `RecordItemAcquired`/`RecordMonsterKill`/`DecodeFlatJson` + `AddItem`에 획득 훅 1줄 |
| `RootDesk/MyDesk/Monster/Scripts/Monster.mlua` | `Dead()`에서 막타 플레이어(`LastAttacker`)의 `PlayerInventory:RecordMonsterKill(mid)` 호출 |
| `RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua` | save/load에 `dexItems`/`dexMonsters` 추가(선캡처, Yield 없음) |
| `RootDesk/MyDesk/Monster/DataSets/MonsterCoinDropDataSet.csv` | `DisplayName`/`IconRUID` 2컬럼 보강(슬라임/뿔버섯/멧돼지/슬라임킹 — 모델 StandRUID) |
| `ui/PopupGroup.ui` | `CollectionPopup` 서브트리 추가(UIBuilder) — Bg/Title/Close/3탭/스크롤 리스트/행 템플릿 |
| `RootDesk/MyDesk/UI/Scripts/UICollectionController.mlua` | **신규** — 3탭 도감 컨트롤러(파생/실루엣/카운트/업적 상태/open·close 트윈) |
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `OnKeyDown`에 `J` 키 → 도감 토글 |

## 3. 구현 상세 (Change ①~④)

- **① 카운터(데이터 주도)**: `AddItem`은 통화(Coin)를 상단에서 early-return하므로, 그 뒤 공통 지점에 `RecordItemAcquired(itemName, count)` 1줄만 추가 → 픽업/제작/상점/의뢰 보상 등 **모든 획득 경로 커버**(별도 훅 불필요). 처치는 기존 `Monster.Dead`의 `LastAttacker`(=`event.AttackerEntity`)에 `RecordMonsterKill(mid)` 호출. `mid`는 `Monster:GetMonsterId()`(코인 드롭과 동일 키).
- **② 영속**: `PersistenceManager` LoadPlayerData에 `inv.DexItemsJson = data.dexItems or "{}"`(+monsters), SavePlayerData에 선캡처(`capDexItems`/`capDexMonsters`)→saveData 필드. 구세이브는 `or "{}"` 폴백.
- **③ 자동 파생**: 아이템=`item_dataset` 전 행(Name/IconRUID), 몬스터=`MonsterCoinDropDataSet`(몬스터당 1행 레지스트리에 표시명/아이콘 컬럼 보강 — **도감 전용 CSV 신설 아님**), 업적=`AchievementDataSet`(기존) 행 + 로컬 `PlayerAchievement.UserDataTable[id].State`(`_AchievementStateEnum`로 완료/진행/미시작 방어적 판정). 발견=카운트>0 → 미발견은 실루엣(어두운 아이콘 + "???" + "미발견"), 발견은 아이콘+이름+누적 수.
- **④ UI**: `CollectionPopup`(1000×780 센터). 기존 팝업 **비주얼 아이덴티티 재사용**(패널 bg RUID `25e9e895…`, 골드 액센트 `#F0A830`, 서페이스 타일). 3탭은 **단일 ScrollLayoutGroup(Type=1 세로 리스트)** 를 탭 전환 시 재구성(제작창에서 검증된 template-clone 패턴 — GridView 런타임 프리팹 복잡성 회피). `J` 키 토글(기존 I/C/K 팝업 패턴과 동일).

### 스펙에서 벗어난 결정 (근거 포함)
- **업적 = 신규 구축 대신 패키지 재사용** — 착수 조사에서 완비된 패키지 확인, 중복 금지(§1.2 규칙 1·msw-packages). 보스 확정(2026-07-13).
- **중첩 JSON → 평탄 JSON 2개** — MSW `_HttpService:JSONEncode`가 중첩 테이블에서 `LEA-3001 UnknownType`을 던짐(런타임 확인). 이 코드베이스의 모든 JSONEncode 용례가 평탄 테이블인 이유. 그래서 `{items,monsters}` 중첩 대신 `DexItemsJson`+`DexMonstersJson`로 분리.
- 하드코딩(이름/수치 분기) 0건.

## 4. 수행한 검증과 결과

- **mlua-diagnose**: 수정 4개 스크립트 errors=0 (남은 info/warning은 전부 기존 크로스스크립트 오탐·기존 코드).
- **Maker refresh 빌드**: **Error=0** (total 454).
- **런타임(server_main + client execute_script)**:
  - 서버에서 `RecordItemAcquired("Wood",5)`/`("Carp",2)`/`RecordMonsterKill("slime")×2`/`("boar")` 호출 후 → `DexItemsJson={"Carp":2,"Wood":5}`, `DexMonstersJson={"boar":1,"slime":2}` (슬라임 2회 누적=2 확인).
  - `UICollectionController:Open()` + 탭 전환 → item rows=39 / monster rows=4 / achv rows=5, CollectionPopup 관련 런타임 오류 0.
  - `DecodeLocalDex()`가 @Sync된 평탄 JSON을 정상 파싱.
- **버그 발견·수정(검증 중)**: 최초 구현은 `{items,monsters}` 중첩 JSON을 썼는데 `SafeEncodeJson`이 항상 "{}" 반환 → 원인 = MSW JSONEncode 중첩 불가(LEA-3001, pcall 로그로 확정) → 평탄 2필드로 리팩터 후 재검증 PASS.
- **Play 육안 보류(제작자)**: J로 열기, 실루엣/발견 표시, 탭 전환, 재접속 후 카운트 유지.

## 5. 발견한 문제 / 후속 제안

- **`InventoryPopup/CoinText` LEA-3044(FontColor/OutlineColor 직렬화 실패) — T22 범위 밖**: 이 엔티티는 **커밋(HEAD)에 없고 이전 미커밋 세션이 추가**한 것(HEAD엔 coin 엔티티가 `ShopPopup/Bg/CoinText` 1개, 작업트리엔 +`InventoryPopup/CoinText`). 내 이번 작업은 `CollectionPopup`만 추가했고 내 엔티티에선 동 오류가 없음. 값 자체는 정상 형태(`{r,g,b,a}`)로 보이나 런타임 역직렬화가 실패 — 별도 조사 필요. **미커밋 타 작업 산출물이라 임의 수정하지 않음**(보스/원작성자 확인 권장).
- 후속(선택): 도감 그리드(현재 세로 리스트)로 UX 개선, 업적 탭에 진행도 바/보상 표기, 신규 몬스터 추가 시 `MonsterCoinDropDataSet` 행에 표시명/아이콘만 채우면 자동 반영.

## 6. 제작자 런타임 체크리스트

- [ ] `J` 키로 도감 팝업 열림/닫힘(스케일 트윈)
- [ ] 아이템 탭: 미획득=실루엣+"???"+"미발견", 획득=아이콘+이름+"N 개 획득"
- [ ] 몬스터 탭: 미처치=실루엣, 처치=아이콘+표시명+"N 처치"
- [ ] 업적 탭: 업적 이름 + 완료/진행 중/미시작 상태 표시
- [ ] 아이템 획득/몬스터 처치 시 카운트 증가, 재접속 후에도 누적 유지
- [ ] 신규 아이템/몬스터는 데이터(행)만으로 도감 자동 반영(코드 무수정)

## 7. 이력

- 2026-07-13 최초 작성 (구현자 Claude). 도감 신규 + 업적 재사용. 중첩 JSON→평탄 2필드 리팩터(LEA-3001 회피). refresh Error=0, 런타임 카운터/3탭 로그 PASS, Play 육안 제작자.
