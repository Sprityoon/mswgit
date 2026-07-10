# T14 작업 보고서 — 제작창 UI 개편 (도감형+티어+그리드)

- **작업**: T14 제작창 UI 개편
- **상태**: 코드 완료 | refresh 빌드 보류(직후) | Play 육안 보류(제작자)
- **날짜**: 2026-07-11

## 1. 요약

`RecipeDataSet`에 `Tier`/`Category`/`UnlockId`/`UnlockHint` 컬럼을 추가하고, 제작 팝업에 티어·카테고리 필터 바 + 잠금 힌트 텍스트를 증설했다. 목록은 CSV 값에서 동적 필터되며, 미해금 표시 훅(`IsRecipeUnlocked` — T14는 전부 true)과 재료 부족 회색 틴트를 넣었다. 서버 `ServerRequestCraft`는 무변경(게이트는 T25).

## 2. 수정 파일

| 파일 | 요지 |
|---|---|
| `item/DataSets/RecipeDataSet.csv` | Tier/Category/UnlockId/UnlockHint + T2/T3 구리·철 도구 시범 잠금 키 |
| `ui/PopupGroup.ui` | TierBar/CategoryBar/UnlockHint 엔티티 추가 |
| `UI/Scripts/UICraftingController.mlua` | 필터·해금 훅·목록 재구성 |

## 3. 구현 상세

① 데이터: T1 기본 해금(UnlockId 공란). Copper/Iron 도구 = `research_copper_tools` / `research_iron_tools` + UnlockHint (T25/T7 연결용).  
② UI: 상단 티어/카테고리 prev-next 순환 (CSV 값 동적). 좌측 리스트 필터, 우측 상세+UnlockHint.  
③ C/Space/기존 제작 RPC 유지.  
④ `IsRecipeUnlocked`는 T25 연결 자리 — 현재 항상 true.

## 4. 검증

- Maker refresh: 세션에서 수행 예정
- Play: 보류(제작자)

## 5. 후속

- T25: `IsRecipeUnlocked`에 보유 목록 연결 + ServerRequestCraft 게이트

## 6. 제작자 체크리스트

- [ ] C로 제작창 열림, 티어/카테고리 필터 동작
- [ ] 레시피 선택·Space 제작 회귀 없음
- [ ] 재료 부족 아이콘 회색
- [ ] 레이아웃 겹침/스크롤 이상 없음

## 7. 이력

- 2026-07-11 최초 작성
