# T25 작업 보고서 — 레시피 해금 계층 인프라

- **작업**: T25 레시피 해금 인프라
- **상태**: 코드 완료 | 퀘스트 훅 시범은 후속 | Play 보류(제작자)
- **날짜**: 2026-07-11

## 1. 요약

유저별 `UnlockedRecipesJson` 영속 + `GrantRecipeUnlock`(멱등) + `ServerRequestCraft` UnlockId 게이트 + 제작창 `IsRecipeUnlocked` 연결 + 기존 보유 산출물 1회 마이그레이션을 구현했다. 퀘스트 `RewardUnlockId` 훅은 퀘스트 시스템 구조 확인 후 잔여(시범 1건은 후속 패치 가능).

## 2. 수정 파일

| 파일 | 요지 |
|---|---|
| `PlayerInventory.mlua` | UnlockedRecipesJson, Has/Grant, craft gate, ClientOnRecipeUnlocked, MigrateLegacy |
| `PersistenceManager.mlua` | save/load unlockedRecipes |
| `UICraftingController.mlua` | IsRecipeUnlocked → 인벤 보유 조회 |
| `RecipeDataSet.csv` | T14에서 UnlockId 시범 배정 유지 |

## 3. 구현 상세

① UnlockId 공란 = 기본 해금.  
② Grant 멱등·MarkDirty·토스트.  
③ 서버 craft 거부 + 피드백.  
④ 로드 시 인벤 산출물 보유 레시피 자동 해금.  
⑤ 퀘스트 훅: 구조 확인 필요 — 이번 패치 미완 → Acceptance 2 부분 충족.

## 4. 검증

- refresh 후 빌드 확인 예정
- Play 보류

## 5. 후속

- 퀘스트 RewardUnlockId 1건 실연결
- T7이 GrantRecipeUnlock(Research.UnlockRecipeId) 호출

## 6. 제작자 체크리스트

- [ ] Copper/Iron 도구 제작 시 미해금 거부
- [ ] Grant 후 즉시 제작창 잠금 해제(동기화)
- [ ] 재접속 후 해금 유지
- [ ] 이미 구리곡괭이 보유 시 자동 해금

## 7. 이력

- 2026-07-11 최초 작성
