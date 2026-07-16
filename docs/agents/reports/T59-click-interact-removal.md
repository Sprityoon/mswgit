# T59 작업 보고서 — 클릭 상호작용 전면 제거 + F/BtnInteract 일원화

- **작업**: T59 클릭 상호작용 전면 제거 + 상호작용 경로 일원화(F/BtnInteract) (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker refresh 가능, Play 미수행
- **날짜**: 2026-07-16

## 1. 요약

월드 `TouchEvent` 클릭/터치 상호작용 7곳을 제거하고, PC `F`와 모바일 `BtnInteract`가 동일 `TryInteract()`를 쓰도록 일원화했다. PlayerController가 자체 대상(낚시/보물상자/포탈/침대/화로/보관함/낚시터)을 못 처리할 때만 `InteractRequestEvent`를 발신해 상점·게시판·연구소·주민·리더보드 분산 핸들러로 브리지한다. F 키의 기존 동시 리슨 구조는 유지. T58 스킬 게이트·시전 로직 무접촉.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Util/InteractRequestEvent.mlua` | 신규 `@Event` — BtnInteract 브리지 신호 |
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | F 본문 → `TryInteract()` 추출; `OnInteractButton` 통일 + 미처리 시 이벤트 발신 |
| `RootDesk/MyDesk/Furniture/Scripts/Furniture_Bed.mlua` | TouchEvent/OnTouch 제거 (마커만 유지) |
| `RootDesk/MyDesk/MapObjects/Scripts/TreasureChest.mlua` | TouchEvent/OnTouch/TryOpenLocal 제거 |
| `RootDesk/MyDesk/MapObjects/Scripts/BulletinBoard.mlua` | Touch 제거; `TryInteract` + InteractRequestEvent 클로저 구독 |
| `RootDesk/MyDesk/MapObjects/Scripts/ResearchLab.mlua` | 동상 |
| `RootDesk/MyDesk/NPC/Scripts/MerchantInteract.mlua` | 동상 (+터치 전용 거리 피드백 삭제) |
| `RootDesk/MyDesk/NPC/Scripts/VillagerDialog.mlua` | 동상 |
| `RootDesk/MyDesk/NPC/Scripts/FishingLeaderboardInteract.mlua` | 동상 |
| `docs/agents/reports/T56-villager-dialog-balloon.md` | §6 클릭/터치 무효 각주 |
| `docs/agents/reports/T57-weekly-fishing-leaderboard.md` | §6 클릭/터치 무효 각주 |

## 3. 구현 상세

### Change ① TouchEvent 7곳 제거
- 착수 전 Grep 재확인: `RootDesk/MyDesk/**/*.mlua`에서 월드 `TouchEvent`/`OnTouch` = **티켓 명시 7파일과 일치**, 추가 발견 0.
- `PlayerController.OnScreenTouch`는 빈 스텁(IsPointerOverUI 가드) — 스펙대로 유지.
- Bed: 컴포넌트 껍데만 유지(수면은 `FindNearbyBed`). TreasureChest: 개봉은 PC `FindNearbyTreasureChest`→`ServerRequestOpen`만.

### Change ② `TryInteract()` 추출·통일
- KeyDown F 본문을 **로직 변경 없이** `TryInteract(): boolean`으로 이동.
- `OnInteractButton`의 포탈/화로 중복 코드 삭제 → `TryInteract()` 호출로 대체.
- T58 스킬 게이트(`ParentSkillId` ~L2106)·`TryCastSlot` 무수정.

### Change ③ 분산 핸들러 브리지
- Merchant/BulletinBoard/ResearchLab/Villager/Leaderboard: OnKeyDown 본문 → 각자 `TryInteract()`, KeyDown F 유지.
- `LocalPlayer:ConnectEvent(InteractRequestEvent, closure)` + OnEndPlay Disconnect.
- PC `TryInteract()==false`일 때만 `self.Entity:SendEvent(InteractRequestEvent())` (F 경로에서는 미발신 → 이중 오픈 방지, F 동시 리슨 회귀 0).
- **빌드 함정**: `@ExecSpace("ClientOnly") method void OnInteractRequest(InteractRequestEvent event)` → **LEA-4002** 5건. 클로저 구독으로 해소(이벤트 페이로드 불필요).

### Change ④ T56/T57 각주
- 각 보고서 §6에 클릭/터치 무효·F/BtnInteract만 유효 각주 1줄.

### 스펙 편차
- 없음 (LEA-4002 우회는 구독 형태만 변경, Acceptance 동일).

## 4. 수행한 검증과 결과

- 착수 전 TouchEvent Grep: 7파일만 (추가 0).
- Maker `maker_refresh_workspace` → build: **total 507 / Error=0 / Warning=25 / Info=482**.
- 1차 refresh는 LEA-4002×5(커스텀 Event를 ClientOnly 메서드 파라미터로 선언) → 클로저로 수정 후 2차 refresh **Error=0**.
- Play 런타임 검증 **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- **LEA-4002**: ClientOnly 메서드 시그니처에 유저 `@Event` 타입 파라미터 불가. ConnectEvent는 클로저(또는 ExecSpace 없는/ServerOnly 핸들러 — ActionEvent 선례)로.
- NPC `OnBeginPlay` 시 `LocalPlayer` nil이면 InteractRequestEvent 미연결(경고 로그). 실기기에서 재현 시 UserEnter 후 재구독 검토.

## 6. 제작자 런타임 체크리스트

- [ ] PC: 침대/보물상자/상점/게시판/연구소/주민/리더보드 **클릭 무반응**
- [ ] PC: 동일 대상 **F** 정상 (회귀 0)
- [ ] 모바일: `BtnInteract`로 F와 동일 전 대상(침대·상자·보관함·상점·게시판·연구소·주민·리더보드 포함)
- [ ] 모바일: 이중 오픈 0 (PC 소유 대상 처리 시 분산 UI 미오픈)
- [ ] T58 스킬 게이트·시전 / T56 말풍선 / T57 리더보드 회귀 0
- [ ] 로그 `[T59] InteractRequestEvent sent` — BtnInteract로 분산 대상만 열 때

## 7. 이력

- 2026-07-16 최초 작성 (Cursor Grok worker)
