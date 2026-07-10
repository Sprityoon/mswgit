# T8 작업 보고서 — 침대·수면 회복

- **작업**: T8 침대·수면 회복
- **상태**: **완료 | refresh 빌드 Error=0 | 제작자 Play 검증 PASS (2026-07-11)**
- **수행 에이전트/환경**: Grok 구현 에이전트, Maker refresh
- **날짜**: 2026-07-11

## 1. 요약

침대 시스템 대부분(가구 모델·F/터치 수면·온라인 600초 비례 회복·세이브 필드)이 이미 존재했다. 이번 패치는 누락된 `Item_Bed` 드롭 모델·제작 레시피·오프라인 ≥600s 명시적 풀충전·피드백 문구를 보강했다. 도중 기상은 **비례 회복**(스펙 허용 옵션)으로 확정.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/item/Models/Item_Bed.model` | 신규 드롭/월드 아이템 모델 |
| `RootDesk/MyDesk/item/DataSets/RecipeDataSet.csv` | Bed 레시피(Wood×10, Tier1 기본 해금) |
| `RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua` | 오프라인 ≥600s 풀충전 분기 명시 |
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | 수면 시작 피드백 문구 |

**기존 유지(변경 없음, 검증 대상)**: `item_dataset` Bed, `ShopItemDataSet` Bed, `Furniture_Bed.model`/`.mlua`, `PlayerController` IsSleeping·ServerRequestSleep/WakeUp·온라인 1초 틱 회복, Persistence isSleeping/sleepStartTimeTicks save.

## 3. 구현 상세

① 설치: 기존 가구 경로 `Furniture_Bed` + Item 구매/제작.  
② F/터치 → `ServerRequestSleep` → 이동 잠금, 키/이동 시 WakeUp.  
③ 온라인: MaxHp/MaxStamina를 600초에 걸쳐 분배 회복(=10분 풀충전).  
④ 오프라인: 경과 비례 회복, **≥600s면 HP/스태미나 풀**, 로그인 시 기상 상태.  
⑤ 도중 기상: 누적분만 유지(부분 회복 = 비례).

**스펙 이탈**: 전용 화면 톤 오버레이는 미구현(메시지 피드백만). 신규 T 제안 없이 후속 폴리시로 보고.

## 4. 검증

- Maker refresh 빌드 **Error=0** (기존 LWA-4012 Warning만).
- Play 런타임 검증 보류(제작자 수행).

## 5. 후속

- 침대 전용 스프라이트(현재 상자 RUID placeholder).
- 수면 중 화면 디밍 오버레이(선택).

## 6. 제작자 런타임 체크리스트

- [x] 상점/제작으로 Bed 획득 → 영지 설치
- [x] F 또는 터치로 수면 시작, 이동 불가
- [x] 이동키로 기상
- [x] 수면 회복 동작 확인

## 7. 이력

- 2026-07-11 최초 작성
- 2026-07-11 제작자 Play 검증 PASS — 통합: `BATCH-A-B-play-verify-2026-07-11.md`
