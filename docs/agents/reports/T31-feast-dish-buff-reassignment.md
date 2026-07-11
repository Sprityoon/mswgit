# T31 작업 보고서 — 버프·요리 콘텐츠 정합 (상위 버프 신설 + Feast Dish 재배정)

- **작업**: T31 버프·요리 콘텐츠 정합 — 상위 버프 신설 + Feast Dish 재배정 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 부분 완료 (① 완료, ② 보스 대기 보류) | LSP·refresh 보류 (레인 마지막에 일괄 수행) | Play 검증 보류(제작자)
- **수행 에이전트/환경**: Antigravity (Gemini 3.5 Flash), Maker 미기동, LSP 미기동
- **날짜**: 2026-07-11

## 1. 요약

최상위 요리인 Feast Dish의 버프 효과가 최하위 Roasted Grass의 집중 버프(1.25배, 60초)와 동일했던 밸런스 오류를 해결하기 위해, 상위 채집 버프인 `gather_boost_big`(1.5배, 120초)을 신설하고 Feast Dish의 적용 버프로 재배정했습니다. 멧돼지 고기 드롭 및 조리와 관련된 고기 축 작업(T31②)은 가축 시스템(T19)과의 조율이 필요하여 보스의 결정을 대기하며 보류 처리했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/item/DataSets/BuffDataSet.csv` | 상위 채집 속도 버프 `gather_boost_big` 행 추가 |
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | Feast Dish(Feast Dish)의 `UseBuffId`를 `gather_boost_big`으로 변경 |

## 3. 구현 상세

- **Change ①**: `BuffDataSet.csv`에 `gather_boost_big` (표시명: "강한 집중", StatKey: `GatherSpeed`, 배율: 1.5×, 지속시간: 120초) 행을 추가했습니다. 그리고 `item_dataset.csv`에서 Feast Dish의 `UseBuffId` 컬럼 값을 `gather_boost_small`에서 `gather_boost_big`으로 재배정하여 희귀도 등급(Rare)에 어울리는 성능을 갖추도록 개편했습니다.
- **Change ② (보류)**: 몬스터(멧돼지) 고기 드롭 및 고기 구이 요리를 포함하는 고기 축 추가는 T19(가축)와의 식재료 및 생활 루프 중복 설계 조정을 위해 보스의 시점 확정이 완료될 때까지 **보류**로 남겨둡니다.

## 4. 수행한 검증과 결과

- **LSP 및 Maker refresh**: 레인 B의 모든 티켓이 완료된 후에 일괄적으로 1회 refresh 검증을 수행할 예정이므로 보류 상태입니다.
- **Play 런타임 검증**: 지휘자 규정에 따라 런타임 검증은 보류(제작자 직접 수행)입니다.

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] Feast Dish 사용 시 상위 버프 `gather_boost_big`(채집 속도 1.5배, 120초 지속)이 정상 발동하는지 확인
- [ ] 기존 Roasted Grass 사용 시 하위 집중 버프 `gather_boost_small`(1.25배, 60초)이 그대로 유지되어 등급별 밸런스가 맞는지 확인
- [ ] (보류 영역) 고기 축 콘텐츠는 보스 확정 후 작업 진행 예정

## 7. 이력

- 2026-07-11 최초 작성 (Antigravity)
