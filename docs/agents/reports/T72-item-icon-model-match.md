# T72 작업 보고서 — 아이템 아이콘 교체 및 모델 외형 일치화 (P0-D)

- **작업**: T72 아이템 아이콘 교체 및 모델 외형 일치화 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker 기동(refresh만), Play 미수행
- **날짜**: 2026-07-21

## 1. 요약

placeholder IconRUID 10건을 msw-search(`sprite`/`item`)로 재선정해 `item_dataset`·`RecipeDataSet`에 반영했다. 침대는 필드 `Furniture_Bed`/`Item_Bed` 스프라이트도 월드 침대 RUID로 교체해 아이콘·모델 외형을 맞췄다. 요리솥 필드 모델은 이미 솥 스프라이트였고 아이콘만 맞춤. refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | IconRUID 10행 |
| `RootDesk/MyDesk/item/DataSets/RecipeDataSet.csv` | 제작창 Icon 6행 |
| `RootDesk/MyDesk/Furniture/Models/Furniture_Bed.model` | SpriteRUID → 침대 월드 |
| `RootDesk/MyDesk/item/Models/Item_Bed.model` | 동상 |
| `RootDesk/MyDesk/item/Models/Item_WoodFloor.model` | SpriteRUID → 판자 |

## 3. 구현 상세

msw-search로 선정한 IconRUID (artwork-spec §5는 참고만):

| item | IconRUID | 비고 |
|---|---|---|
| bed | `c63a5949…` | 침대 아이콘 |
| wood_floor | `222a3bc3…` | 나무판자 |
| cooking_pot | `3924ca24…` | 솥 — 필드=`Furniture_CookingPot`(`6017c4c6…`)와 개념 일치 |
| carrot_seed | `fee05030…` | 씨앗 |
| carrot_soup | `4f0852b1…` | 호박죽형 수프 |
| veggie_stir_fry | `5d7ce899…` | 볶음 |
| feast_dish | `8fddfba9…` | 잔치 요리 재검색 |
| roasted_grass | `42832e23…` | 나물 |
| recipe_scroll_copper/iron | `b435d505…` / `5dce5fcf…` | 주문서 |
| (추가) Animal Pen 레시피 | `5c883e34…` | 궤짝→우리 아이콘 |

침대 월드: `4ed3c0b888b54b2885a438575f746b9e` (92×72 object).

- **스펙에서 벗어난 결정**: feast/roasted는 §5 임시 후보 대신 재검색 RUID 채택.
- cooking_pot `ModelName=Item_Furnace` 공유는 유지(아이콘·Furniture_CookingPot으로 UI/배치 일치).

## 4. 수행한 검증과 결과

- **LSP**: `.mlua` 미변경.
- **Maker**: play stop → `maker_refresh_workspace` status ok.
- **Build**: **Error=0** / Warning=25 / Info=502 / total=527.
- **Play 런타임 검증**: 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- `cooking_pot`이 `Item_Furnace` EntryId를 공유 — 드롭/미리보기 혼선 가능 시 전용 Item 모델 분리 후속 T.
- 음식 다수는 `Item_Grass` 공용 모델 — 아이콘만 구분(월드 드롭 비주얼은 풀).

## 6. 제작자 런타임 체크리스트

- [ ] 인벤/제작창에서 bed·cooking_pot·요리가 궤짝·화로·주괴가 아님
- [ ] 설치한 침대가 침대 외형
- [ ] 요리솥 설치 외형·아이콘 일치감
- [ ] 기존 전용 아트(도구·물고기 등) 회귀 없음

## 7. 이력

- 2026-07-21 최초 작성 (Cursor Grok worker) — 재발행 스펙(msw-search·모델 일치)
