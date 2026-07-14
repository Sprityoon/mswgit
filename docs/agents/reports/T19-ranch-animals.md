# T19 작업 보고서 — 목장/가축 (우리·먹이·생산)

- **작업**: T19 목장/가축 — 우리·먹이·생산 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker refresh 수행, Play 미수행
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

영지 우리(Animal Pen) 가구 + 닭/양 가축 티켓 소환 루프를 추가했다. 가축은 우리 반경 배회, F 급여(CSV FeedItem), 타임스탬프 기반 산출 드롭(오프라인 포함), `homeAnimals` 영속을 지원한다. 의뢰 풀에 어류·달걀·양털 행, 달걀 요리 레시피, 상점 판매 행을 CSV로 확장했다. Maker refresh **Error=0**. Play는 제작자.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `MapObjects/Scripts/Animal.mlua` | 신규 — 배회·F 급여·생산 드롭·세이브 엔트리 |
| `MapObjects/DataSets/AnimalDataSet.csv` + `.userdataset` | Chicken/Sheep 2행 |
| `MapObjects/Models/Animal_Chicken.model` · `Animal_Sheep.model` | Kinematicbody+Movement+Animal (Slime 클론·전투 제거) |
| `Furniture/Models/Furniture_AnimalPen.model` · `item/Models/Item_AnimalPen.model` | 우리 가구 |
| `item/DataSets/item_dataset.csv` | UseAnimalId 컬럼 + Pen/Egg/Wool/Ticket/Omelette 행 |
| `item/DataSets/RecipeDataSet.csv` | Animal Pen 제작 |
| `item/DataSets/ShopItemDataSet.csv` | 티켓·우리 판매 |
| `Furniture/DataSets/CookingRecipeDataSet.csv` | Egg→Egg Omelette |
| `MapObjects/DataSets/RequestPoolDataSet.csv` | 어류 4 + Egg/Wool |
| `Player/Scripts/PlayerInventory.mlua` | UseAnimalId 훅 · TrySpawnAnimalFromTicket |
| `Player/Scripts/PersistenceManager.mlua` | homeAnimals 저장/복원 |

`PlayerController.mlua` **무수정**.

## 3. 구현 상세

- **① 우리 설치**: `Category=furniture` `FurnitureKind=pen` — 기존 `ServerRequestPlace` 경로. 모델명 `Furniture_AnimalPen`.
- **② 티켓 사용**: `Category=consumable` + `UseAnimalId` → 영지·자기 홈·우리 거리≤4 검증 후 스폰·티켓 소모·`MarkPlayerDirty`.
- **③ 배회**: Animal.mlua 자체 wander (MonsterAI 전투 미부착). Home 반경 `WanderRadius` CSV.
- **④ 급여**: Animal 클라 F → `ServerRequestFeed` — FeedItem 1 소모, FedAtUnix, ProducedForFeed=false. FeedInterval 쿨다운.
- **⑤ 생산**: `now - FedAtUnix >= ProduceInterval` 이면 `SpawnResourceDrop` 1회.
- **⑥ 콘텐츠**: 닭=Carrot Seed→Egg / 양=Grass→Wool. 달걀 요리·의뢰 풀 확장.
- **⑦ 영속**: `homeAnimals` JSON 배열 (animalId/pen/xy/fedAt/produced).
- **아트**: 스프라이트 placeholder(슬라임 RUID 재사용) — 보고서 명시, 전용 아트 후속.
- **스펙 편차**: 없음. 이름 분기 0(데이터셋 컬럼 판정).

## 4. 수행한 검증과 결과

- **Maker `maker_refresh_workspace`**: status=ok (2회 — LEA-1118 `---@type Animal` 제거 후 재빌드).
- **Build logs**: **Error=0** / Warning=15 / Info=457 / **total=472**.
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 가축·우리 스프라이트 placeholder — 전용 아트 티켓 후보.
- 상점 UI 6슬롯 한도 — 행 증가 시 일부 미표시 가능(기존 한계).
- 동일 우리에 가축 수 상한 없음(MVP).

## 6. 제작자 런타임 체크리스트

- [ ] Animal Pen 제작·영지 설치
- [ ] 상점에서 Chicken/Sheep Ticket 구매
- [ ] 우리 근처 티켓 사용 → 가축 스폰
- [ ] F로 먹이 급여 → 로그/피드백
- [ ] ProduceInterval 후 달걀/양털 드롭
- [ ] 재접속 후 가축·급여 타이머 유지
- [ ] 의뢰 게시판에 어류/달걀/양털 의뢰 출현 가능

## 7. 이력

- 2026-07-14 최초 작성 (Grok worker)
