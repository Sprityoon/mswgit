# T67 작업 보고서 — 상호작용 조준선(에임 셀) 게이트

- **작업**: T67 상호작용 조준선(에임 셀) 게이트 — 근접 판정 폐지 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP 무에러 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker refresh만, Play 미수행
- **날짜**: 2026-07-18

## 1. 요약 (3~5줄)

F/BtnInteract 근접 거리 판정을 폐지하고 `PlayerController.IsAimTarget` 단일 헬퍼(조준선 셀 ∩ footprint)로 통일했다. PC-owned `FindNearby*` 5종과 분산 핸들러 6종을 교체. 포탈(ActivePortal 발밑)·낚시 릴링 분기는 유지. 대형(연구소/게시판/침대)은 `AimFootprintW/H=2`. refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `Player/Scripts/PlayerController.mlua` | `IsAimTarget`/`ReadAimFootprint` + FindNearby* 조준선 필터 |
| `NPC/Scripts/MerchantInteract.mlua` | 거리→IsAimTarget + footprint |
| `NPC/Scripts/VillagerDialog.mlua` | 동상 |
| `NPC/Scripts/FishingLeaderboardInteract.mlua` | 동상 |
| `MapObjects/Scripts/ResearchLab.mlua` | 동상 + footprint 2×2 |
| `MapObjects/Scripts/BulletinBoard.mlua` | 동상 + footprint 2×2 |
| `MapObjects/Scripts/Animal.mlua` | 조준선 + InteractRequestEvent 브리지 + 서버 검증 |
| `Furniture/Scripts/{Furnace,Chest,Furniture_Bed,FishingSpot}.mlua` | AimFootprint 프로퍼티 |
| `MapObjects/Scripts/TreasureChest.mlua` | footprint + 서버 IsAimTarget 검증 |

## 3. 구현 상세

### ① IsAimTarget
- `aimCell = playerCell + LastDirection`
- 대상 셀 중심 footprint: 기본 1×1, `AimFootprintW/H`로 확장(홀수 기준 half=(n-1)/2).
- `ReadAimFootprint`는 상호작용 컴포넌트 타입 목록에서 프로퍼티 조회(아이템명 분기 없음).

### ② 예외 유지
- `ActivePortal` 발밑 F 워프 유지.
- 낚시 `FishingState`/`Reeling` 분기 무수정(T64 홀드 폴링 무수정).

### ③ FindNearby*
- Furnace/Chest/Bed/Treasure/FishingSpot: `IsAimTarget` 통과분만 최근접 선택.

### ④ 분산 핸들러 6종
- 거리 `<= 3.0` 등 → `LocalPlayer.PlayerController:IsAimTarget(self.Entity)`.
- Animal: 모바일용 `InteractRequestEvent` 브리지 추가 + 서버 급여도 조준선 검증.

### ⑤ T59 브리지
- `TryInteract` 미처리 → `InteractRequestEvent` 구조 유지.

### 스펙 편차
- TreasureChest 서버 `ServerOpenDistance` 거리 검증을 IsAimTarget으로 교체(클라와 정합). 프로퍼티는 잔존(미사용).

## 4. 수행한 검증과 결과

- **LSP**: Error=0 (크로스스크립트 IsAimTarget info만).
- **Maker refresh**: ok.
- **Build**: **Error=0** / Warning=25 / Info=446 / total=471.
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- Animal 배회형 1×1 조준은 체감이 빡셀 수 있음 — 티켓대로 제작자 피드백 후 완화 후속.
- 신규 T항목 발행 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 조준선 셀의 대상만 F 반응 — 인접해도 조준 밖이면 무반응
- [ ] 화로+상자+상인 밀집에서 방향만으로 대상 분리(복수 팝업 0)
- [ ] 포탈 밟고 F 워프 정상
- [ ] 모바일 BtnInteract 동일
- [ ] 낚시 캐스팅~릴링 / 수면 / 목장 급여 회귀 0
- [ ] 로그 `[T67][AIM] ... aim-ok` 확인

## 7. 이력

- 2026-07-18 최초 작성 (Cursor Grok worker)
- 2026-07-18 핫픽스: `method integer, integer ReadAimFootprint` → `method Vector2Int` (LEA-3015 CannotLoad / Sequence contains no elements). refresh Error=0.
