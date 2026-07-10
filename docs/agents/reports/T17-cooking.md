# T17 작업 보고서 — 요리 시스템

- **작업**: T17 요리 (조리 냄비 + 음식 버프)
- **상태**: **완료 | refresh 빌드 Error=0 | 제작자 Play 검증 PASS (2026-07-11)**
- **날짜**: 2026-07-11

## 1. 요약

`Furnace`를 `RecipeTableName`/`StationTitle`/`DurationColumn` 프로퍼티로 일반화하고, `CookingRecipeDataSet` + `Furniture_CookingPot` + 음식 3종(consumable+UseBuffId)을 추가했다. 기존 화로는 기본값으로 제련 테이블을 유지한다. FindNearbyFurnace가 `script.Furnace`를 찾으므로 냄비도 동일 F 상호작용.

## 2. 수정 파일

| 파일 | 요지 |
|---|---|
| `Furnace.mlua` | 레시피 테이블 프로퍼티 일반화 |
| `UIFurnaceController.mlua` | 제목·레시피 테이블 동적 |
| `CookingRecipeDataSet.csv` | Carrot/Grass/Roasted Grass 요리 |
| `Furniture_CookingPot.model` | Furnace+요리 테이블 오버라이드 |
| `item_dataset` | Cooking Pot, Carrot Soup, Veggie Stir Fry, Feast Dish |
| `RecipeDataSet` | Cooking Pot 제작 |
| `BuffDataSet` | move_boost_small |

## 3. 스펙 노트

- 1-input 레시피 스키마(제련과 동일) — Input2는 MVP 생략(CSV 단일 입력). 다재료 요리는 후속 T.
- 잔치 요리 입력 = Roasted Grass×2.

## 4. 검증

- refresh 빌드 **Error=0**.
- **제작자 Play 검증 PASS (2026-07-11)**.

## 5. 제작자 체크리스트

- [x] 냄비 제작·설치 후 F → 제목 "조리 냄비"
- [x] 재료 투입(더블/Shift/드래그) → 조리 → 음식 버프
- [x] 단일 클릭 비투입·슬롯 클릭 회수만
- [x] LEA-3011 SmeltDuration 미발생
- [x] 기존 화로 제련 회귀 없음

## 6. 이력

- 2026-07-11 최초 작성
- 2026-07-11 투입 UX·CookDuration 핫픽스
- 2026-07-11 제작자 Play 검증 PASS — 통합: `BATCH-A-B-play-verify-2026-07-11.md`
