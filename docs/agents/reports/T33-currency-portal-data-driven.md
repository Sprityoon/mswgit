# T33 작업 보고서 — 통화·포탈 특수 분기 컬럼화

- **작업**: T33 통화·포탈 특수 분기 컬럼화 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 코드 완료 | LSP·refresh 보류 (레인 마지막에 일괄 수행) | Play 검증 보류(제작자)
- **수행 에이전트/환경**: Antigravity (Gemini 3.5 Flash), Maker 미기동, LSP 미기동
- **날짜**: 2026-07-11

## 1. 요약

인벤토리 및 가구/포탈 철거 로직, 그리고 세이브 로드 보정부에서 특정 이름(`"Coin"`, `"Portal"`)을 사용하던 하드코딩 분기를 데이터 주도 방식으로 리팩터링했습니다. `item_dataset.csv`에 `IsCurrency`와 `FurnitureKind` 컬럼을, `PortalDestinationDataSet.csv`에 `IsDefault` 컬럼을 신설하여, 각 로직이 데이터셋의 컬럼 값을 바탕으로 동적 판정 및 보정을 수행하도록 구조를 개편했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` | `IsCurrencyItem` 헬퍼 메서드 추가 및 Add/Remove/Has/Count 내 `"Coin"` 하드코딩을 데이터셋 조회 방식으로 교체 |
| `RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua` | 구세이브 포탈 보정 시 Portal 이름 대신 `FurnitureKind`를 사용하고, 목적지 리터럴을 `PortalDestinationDataSet` 조회로 교체 |
| `RootDesk/MyDesk/MapObjects/Scripts/TileDurabilityManager.mlua` | 비영지 맵 포탈 철거 금지 판정 시 이름 대신 `FurnitureKind` 조회 방식으로 교체 |
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | `IsCurrency` 및 `FurnitureKind` 컬럼 추가, Coin 행 및 Portal 행에 각각 값 매핑 |
| `RootDesk/MyDesk/Furniture/DataSets/PortalDestinationDataSet.csv` | `IsDefault` 컬럼 신설 및 `town` 행에 `true` 할당 |

## 3. 구현 상세

- **Change ①**: `item_dataset.csv`에 `IsCurrency` 컬럼을 추가하고, `Coin` 행에 `true`를 부여했습니다. `PlayerInventory.mlua`에 `IsCurrencyItem` 메서드를 추가(핫패스 캐시 테이블 `_T.CurrencyCache` 적용)하여, `AddItem`, `RemoveItem`, `HasItem`, `GetItemCount` 내부의 `"Coin"` 하드코딩 판정을 모두 해당 메서드로 교체했습니다.
- **Change ②**: `item_dataset.csv`에 `FurnitureKind` 컬럼을 추가하여 `portal` 행에 `portal` 값을 매핑했습니다. `TileDurabilityManager.mlua` (철거 제한) 및 `PersistenceManager.mlua` (세이브 보정) 내부의 포탈 감지 구문을 `FurnitureKind == "portal"` 조회로 일반화했습니다.
- **Change ③**: `PortalDestinationDataSet.csv`에 `IsDefault` 컬럼을 추가하고 `town` 행에 `true`를 설정했습니다. `PersistenceManager.mlua`의 구세이브 포탈 목적지 복원 시 하드코딩되었던 `"town"`, `3`, `0` 리터럴을 제거하고, `PortalDestinationDataSet`에서 `IsDefault`가 `true`인 목적지의 맵 이름 및 좌표를 찾아 복원하도록 수정했습니다.

## 4. 수행한 검증과 결과

- **LSP 및 Maker refresh**: 레인 B의 모든 티켓이 완료된 후에 일괄적으로 1회 refresh 검증을 수행할 예정이므로 보류 상태입니다.
- **Play 런타임 검증**: 지휘자 규정에 따라 런타임 검증은 보류(제작자 직접 수행)입니다.

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] Coin 획득, 차감, 보유 확인, 상점 판매 등 기존의 화폐 흐름이 회귀 없이 정상 동작하는지 확인
- [ ] 영지 밖 고정 포탈의 철거/채광 시도 시 정상적으로 거부되는지 확인
- [ ] 구버전 세이브 데이터를 불러올 때 포탈의 목적지가 `PortalDestinationDataSet`의 `IsDefault` 설정에 따라 정상적으로 보정되어 생성되는지 확인

## 7. 이력

- 2026-07-11 최초 작성 (Antigravity)
