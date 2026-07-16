# T57 작업 보고서 — 주간 낚시왕 콘테스트 (전 서버 리더보드)

- **작업**: T57 주간 낚시왕 콘테스트 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker refresh 가능, Play 미수행
- **날짜**: 2026-07-15

## 1. 요약

`ranking-basic-package`를 통합해 주간(`CycleEnum.Week`) 낚시 점수를 SortableDataStorage에 적립하고, 마을 낚시꾼 옆 게시판 F로 패키지 랭킹 UI를 연다. 어획 확정 지점(`FishingSpot.PullRod`)에 최소 훅만 추가. `PlayerInventory`/`PersistenceManager`/`PlayerController` 무수정. v1 보상 지급 없음.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/RankingBasic/**` | ranking-basic-package Core+Sample UI 통합 + T57 커스터마이즈 |
| `RootDesk/MyDesk/RankingBasic/Core/FishingContestLogic.mlua` | 어획 점수 누적 적립 |
| `RootDesk/MyDesk/NPC/Scripts/FishingLeaderboardInteract.mlua` | 리더보드 픽스처 F 오픈 |
| `RootDesk/MyDesk/NPC/Models/FishingRankBoard.model` | 게시판 복제 픽스처 |
| `RootDesk/MyDesk/Furniture/Scripts/FishingSpot.mlua` | 어획 성공 시 점수 훅 1곳 |
| `RootDesk/MyDesk/item/DataSets/FishDataSet.csv` | `RankPoints` 컬럼 |
| `map/town.map` | FishingRankBoard 배치 (낚시꾼 옆) |

## 3. 구현 상세

- **R1**: `ranking-basic-package` 채택 (기본 랭킹 + UI 모델 스폰). 프로젝트에 `DefaultGroup` 없어 UI 부모를 `/ui/PopupGroup`으로 변경 — **`.ui` 파일 무수정**, 런타임 스폰만.
- **주간 키**: 패키지 `RankingConfigData.GetCycleIndex` + `_CycleEnum.Week` + `ReleaseBaseTime=2025-01-01` (결정론, T20 day index와 동일 철학).
- **점수**: `FishDataSet.RankPoints` (Common 3~5 / Uncommon 15 / Rare 40). 기존 점수 조회 후 **누적** (`SetScoreAndWait` force=true — 패키지 기본은 max-only).
- **훅**: `FishingSpot.PullRod` 어획·지급 직후 `_FishingContestLogic:AddCatchPoints`.
- **열람**: `FishingRankBoard` F → `_RankingSampleUILogic:OpenUI()` (패키지 UI). F3도 패키지 기본 핫키 유지.
- **빌드 정합**: 패키지 `---@type` / RPC `RankingData` 파라미터를 프로젝트 LEA-1118/4002에 맞게 `any`·주석 제거 (T19 선례).
- **스펙 편차**: 없음 (보상 의도적 배제).

## 4. 수행한 검증과 결과

- Maker `maker_refresh_workspace` 후 build: **total 495 / Error=0 / Warning=17 / Info=478**.
- (중간 빌드 Error=20은 패키지 타입 주석 이슈 — 수정 후 0).
- Play 런타임 검증 **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- **보상 지급 후속안** (v1 제외 — `PlayerInventory` Play 대기 레인): 주간 1위 코인 N / 2~3위 소량 코인 / 참가상 소량 XP. 수령은 리더보드 픽스처 F 시 `Grant` RPC 1회로 멱등.
- 패키지 목록 새로고침 주기 30분 — Play 직후 반영 지연 가능. 어드민 F4 툴/ForceUpdate 또는 적립 직후 `UpdateDataTable` 호출 후속 검토.

## 6. 제작자 런타임 체크리스트

> **각주 (T59 2026-07-16)**: 월드 `TouchEvent`/클릭 상호작용은 T59에서 전면 제거됨. 리더보드 픽스처는 **F 키 / BtnInteract**만 유효 — 클릭·터치로 UI가 안 열리는 것이 정상.

- [ ] 물고기 낚기 → 로그 `[T57][FISHRANK] catch ... pts=... new=...`
- [ ] 동일 주 연속 어획 시 점수 누적
- [ ] 마을 FishingRankBoard F → 랭킹 UI 오픈, 유저·점수 표시
- [ ] 주간 키 전환 시 새 보드(로그 week 증가 / 점수 리셋 체감)
- [ ] `PlayerInventory`/`PersistenceManager`/`PlayerController` 회귀 없음
- [ ] CSV RankPoints 변경만으로 점수 가중 변경

## 7. 이력

- 2026-07-15 최초 작성 (Grok worker)
- 2026-07-15 핫픽스: 랭킹 UI X 버튼 안 닫힘 — `OnClickBtn_Exit`에 `ButtonClickEvent` 인자 누락 + 핸들러 미보관 가능성. ESC/X 키 보조 닫기, `Close`에서 Enable+Visible 동시 해제, Open 시 Visible 복구. refresh Error=0 (497).
