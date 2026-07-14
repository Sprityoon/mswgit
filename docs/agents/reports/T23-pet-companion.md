# T23 작업 보고서 — 펫 동반자 (추종 + 자동 줍기)

- **작업**: T23 펫 동반자 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker refresh 수행, Play 미수행
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

개 펫 1종을 소환 아이템(Dog Whistle, 비소모)으로 활성화하고 플레이어를 추종한다. 맵 이동 시 펫이 소유자 맵으로 재스폰 워프한다. 드롭 자석은 펫 `PickupRange` 기준으로도 발동하되 Collect는 소유 플레이어·PickupGrace 규칙을 유지한다. `ActivePetId` 영속. Maker refresh **Error=0**. Play는 제작자.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `MapObjects/Scripts/Pet.mlua` | 신규 — 추종·맵 워프 |
| `MapObjects/DataSets/PetDataSet.csv` + `.userdataset` | Dog 1행 |
| `MapObjects/Models/Pet_Dog.model` | Kinematicbody+Movement+Pet |
| `item/DataSets/item_dataset.csv` | `UsePetId` 컬럼 + Dog Whistle |
| `item/DataSets/ShopItemDataSet.csv` | Dog Whistle 판매 |
| `Player/Scripts/PlayerInventory.mlua` | ActivePetId · TrySummonPet · UsePetId 훅 |
| `Player/Scripts/PersistenceManager.mlua` | activePetId 저장/복원 + 로드 시 재소환 |
| `item/Scripts/itemreact.mlua` | 펫 위치 자석 (grace/소유권 유지) |

`PlayerController.mlua` **무수정**.

## 3. 구현 상세

- **① 소환**: `UsePetId` consumable 경로 — 기존 소유 펫 제거 후 스폰, **아이템 비소모**.
- **② 추종**: FollowDistance≈1.2, 과도 거리 시 순간이동, MovementComponent.
- **③ 맵 동반**: `owner.CurrentMap ~= pet.CurrentMap` → Destroy+Spawn on owner map.
- **④ 자동 줍기**: itemreact가 Pet 컴포넌트 거리 ≤ PickupRange면 펫 위치로 당기고 Collect는 소유 플레이어. PickupGrace>0이면 기존과 동일 스킵.
- **⑤ 영속**: `inv.ActivePetId` → SaveData `activePetId` → 로드 후 TrySummonPet.
- **아트**: placeholder 스프라이트(슬라임 RUID).
- **스펙 편차**: 없음.

## 4. 수행한 검증과 결과

- **Maker `maker_refresh_workspace`**: status=ok.
- **Build logs**: **Error=0** / Warning=17 / Info=473 / **total=490**.
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 펫 전용 스프라이트 placeholder.
- 로드 시 홈 맵에서만 즉시 재소환 — 마을 리스폰(T37) 경로에서는 홈 로드 분기가 아닐 수 있음 → 제작자 확인 후 필요 시 후속 티켓.

## 6. 제작자 런타임 체크리스트

- [ ] 상점 Dog Whistle 구매 → 사용 → 개 소환 (휘슬 수량 유지)
- [ ] 펫이 플레이어를 따라다님
- [ ] 마을/사냥터 이동 시 펫 동반
- [ ] 펫 근처 드롭 자동 줍기 (본인 인벤)
- [ ] 폐기 드롭 PickupGrace 동안 펫도 줍지 않음
- [ ] 재접속 후 활성 펫 복원

## 7. 이력

- 2026-07-14 최초 작성 (Grok worker)
