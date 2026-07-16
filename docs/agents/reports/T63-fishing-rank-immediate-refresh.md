# T63 작업 보고서 — 낚시 랭킹 즉시 반영 (30분 캐시 우회)

- **작업**: T63 낚시 랭킹 즉시 반영 수정 — 30분 캐시 우회 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker refresh 가능, Play 미수행
- **날짜**: 2026-07-16

## 1. 요약

적립은 SortableDS에 즉시 쓰이지만 화면이 30분 스냅샷+10분 캐시를 읽어 반영이 안 보이던 T57 Play 실패를 고친다. 적립 성공 후 디바운스(10s) 스냅샷 갱신, UI Open 시 `ForceRefreshSnapshot` 강제 갱신, 주기 완화(300s/60s)를 적용했다. `FishingSpot`/`PlayerInventory`/`PersistenceManager` 무수정.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/RankingBasic/Core/RankingDataStorageLogic.mlua` | 주기 300/60 + `ForceRefreshSnapshot()` |
| `RootDesk/MyDesk/RankingBasic/Core/FishingContestLogic.mlua` | 적립 성공 후 디바운스 스냅샷 갱신 |
| `RootDesk/MyDesk/RankingBasic/Sample/RankingViewLogic.mlua` | `RequestFreshDataListWithSenderData` + 어드민 ForceUpdate 재사용 |
| `RootDesk/MyDesk/RankingBasic/Sample/UI/UIRanking.mlua` | `BeforeOpen` → Fresh 경로 |
| (확인만) `NPC/Scripts/FishingLeaderboardInteract.mlua` | OpenUI→BeforeOpen 경유 — 수정 없음 |

## 3. 구현 상세

### Change ④ 선행 진단 (구현 전)
- Maker runtime logs: `[T57][FISHRANK] catch fish=Shrimp pts=3 ... ok=true` (2026-07-16T16:51:47) — **적립 성공 확인**. 원인 = UI 스냅샷/캐시 지연(지휘자 진단과 일치). 보류 전환 없음.

### Change ① 적립 직후 스냅샷
- `AddCatchPoints` 성공 시 `MaybeRefreshSnapshotAfterCatch()` → `_RankingDataStorageLogic:ForceRefreshSnapshot()`.
- 디바운스: `SnapshotRefreshDebounceSeconds=10`, `LastSnapshotRefreshElapsed` 기준. 스킵 시 `[T63][FISHRANK] snapshot refresh debounced` 로그.

### Change ② 열람 시 최신화
- 기존 어드민 `RequestForceUpdate` 본문을 `ForceRefreshSnapshot()`으로 통합 재사용(규칙 8 정의 확인).
- 비어드민 Open용 `RequestFreshDataListWithSenderData` 신설: ForceRefresh → `ProcessDataListWithSenderData`.
- `UIRanking.BeforeOpen`이 Fresh RPC 호출 (기존 `RequestDataListWithSenderData` 대체).

### Change ③ 주기 완화
| 설정 | 변경 전 | 변경 후 | 근거 |
|---|---|---|---|
| `RefreshIntervalSeconds` | 1800 | **300** | 백그라운드 스냅샷 5분 — Open/적립 경로가 즉시 반영의 주력 |
| `RefreshCacheIntervalSeconds` | 600 | **60** | 내 점수 캐시 1분 — Open 시 Clear로 우회 |

### 스펙 편차
- 없음. 대규모 패키지 리팩터링 없음.

## 4. 수행한 검증과 결과

- 선행 로그: catch `ok=true` 확인(위 §3).
- Maker `maker_refresh_workspace` → build: **total 497 / Error=0 / Warning=25 / Info=472**.
- Play 런타임 검증 **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 디바운스 창(10s) 안 연속 어획은 스토리지 점수만 갱신되고 스냅샷은 다음 Open/`ForceRefresh`에서 반영 — Open 경로가 항상 강제 갱신하므로 Acceptance ① 충족.
- 보상 지급은 여전히 범위 밖(T57 §5 제안 유지).
- **🔴 진짜 표시 실패 원인(제작자 재신고 후 로그 확정)**: 캐시가 아니라 `ResponseDataListWithSenderData(..., any myData)`의 **LEA-3036 InvalidCast** — T57이 빌드용으로 `RankingData`→`any` 치환한 것이 런타임에서 UI 응답을 전부 드롭. 서버는 `rows=1`·점수 적립 정상인데 화면만 빈 상태였음. → §7 핫픽스.

## 6. 제작자 런타임 체크리스트

- [ ] 물고기 잡고 **곧바로** FishingRankBoard F → 내 점수·순위 반영
- [ ] 연속 어획 누적 정상 (`prev`/`new` 로그)
- [ ] 연속 어획 시 `[T63][FISHRANK] snapshot refresh debounced` 출현(10s 이내) + 스토리지 폭주 없음
- [ ] Open 시 `[T63][FISHRANK] ForceRefreshSnapshot` / `RequestFreshDataList` / **`UI apply ... myScore=`** 로그
- [ ] Open 시 **LEA-3036 없음**
- [ ] 패키지 어드민 F4 ForceUpdate·페이지 Prev/Next 회귀 0

## 7. 이력

- 2026-07-16 최초 작성 (Cursor Grok worker)
- 2026-07-16 핫픽스: LEA-3036 — `any myData` RPC 제거, 원시 필드+평탄 table로 UI 전달. refresh 재검증.
