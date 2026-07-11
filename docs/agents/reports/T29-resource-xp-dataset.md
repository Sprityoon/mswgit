# T29 작업 보고서 — 채집 XP 데이터셋화 + ResourceDataSet 죽은 컬럼 정리

- **작업**: T29 채집 XP 데이터셋화 + ResourceDataSet 죽은 컬럼 정리 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 코드 완료 | LSP·refresh 보류 (레인 마지막에 일괄 수행) | Play 검증 보류(제작자)
- **수행 에이전트/환경**: Antigravity (Gemini 3.5 Flash), Maker 미기동, LSP 미기동
- **날짜**: 2026-07-11

## 1. 요약

`TileDurabilityManager.mlua`에서 하드코딩되어 있던 자원별 채집 획득 XP를 `ResourceDataSet`에 `XpReward` 컬럼을 신설하여 데이터 주도 방식으로 리팩터링했습니다. 또한, 소비 코드가 전혀 없는 `SeedDropChance`와 `SeedDropCount` 죽은 컬럼을 삭제하여 데이터 정합성을 높였으며, `SpawnResourceDrop`에서 ID 매치 실패 시 Name으로 찾을 수 있도록 폴백 처리 안전망을 추가했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Scripts/TileDurabilityManager.mlua` | XP 하드코딩 제거 및 `XpReward` 데이터셋 조회 교체, `SpawnResourceDrop`에 `Name` 기반 폴백 검색 추가 |
| `RootDesk/MyDesk/MapObjects/DataSets/ResourceDataSet.csv` | `XpReward` 컬럼 추가, `SeedDropChance` / `SeedDropCount` 컬럼 제거 |

## 3. 구현 상세

- **Change ①**: `ResourceDataSet.csv`에 `XpReward` 컬럼을 신설하여 기존 하드코딩되어 있던 수치들을 그대로 이관했습니다.
  - GrownGrass: 5, Stone: 10, Tree1: 15, Big Stone1: 20, Tree2: 25, Big Stone2: 30, IronNodeResource: 40, AroundItem_Stone: 5
- **Change ②**: `TileDurabilityManager.mlua`의 `HitResource` 메서드 내부에서 `sourceName`에 따라 XP를 부여하던 `if ... then ... else` 분기를 제거하고, `ResourceDataSet`에서 `XpReward`를 조회하도록 수정했습니다. 행이나 값이 누락되었을 때의 폴백 수치는 기존과 동일하게 5로 설정하였습니다.
- **Change ③**: `ResourceDataSet.csv`에서 사용되지 않는 `SeedDropChance`, `SeedDropCount` 컬럼을 삭제했습니다.
- **Change ④**: `TileDurabilityManager.SpawnResourceDrop` 내부에서 `FindRow("id", itemId)` 실패 시 `FindRow("Name", itemId)`로 한 번 더 조회하는 폴백 라인을 추가하여, T28의 코인 ID 정합성 수정 등의 작업 시 유연하게 폴백되도록 보장했습니다.

## 4. 수행한 검증과 결과

- **LSP 및 Maker refresh**: 레인 B의 모든 티켓이 완료된 후에 일괄적으로 1회 refresh 검증을 수행할 예정이므로 보류 상태입니다.
- **Play 런타임 검증**: 지휘자 규정에 따라 런타임 검증은 보류(제작자 직접 수행)입니다.

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] GrownGrass, Stone, Tree1 등 자원을 채집(파괴)할 때 정상적으로 `XpReward` 수치만큼 XP가 오르는지 확인
- [ ] `SpawnResourceDrop` 호출 시 `id`나 `Name` 중 어느 형태로 아이템 지정을 하든 드롭이 정상 작동하는지 확인

## 7. 이력

- 2026-07-11 최초 작성 (Antigravity)
