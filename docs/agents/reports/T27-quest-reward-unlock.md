# T27 작업 보고서 — 퀘스트 `RewardUnlockId` → 레시피 해금

- **작업**: T27 퀘스트 보상 → 레시피 해금 연결 (`RewardUnlockId`)
- **상태**: 코드 완료 | Maker refresh 빌드 **Error=0** | Play 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: 레인 1 · Maker MCP refresh (stop play → refresh)
- **날짜**: 2026-07-11

## 1. 요약

퀘스트 완료 훅에 T25 `GrantRecipeUnlock`을 연결했다. `QuestDataSet`에 `RewardUnlockId` 컬럼을 두고 시범 퀘스트 **107(넓은 세계로)**에 크로스 상수 `quest_cooking_pot`을 배정. `RecipeDataSet` 셀 기입은 레인 2(T15) 소유로 본 레인에서 수정하지 않음.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `QuestAndAchievement/DataSets/QuestDataSet.csv` | `RewardUnlockId` 컬럼 + 107=`quest_cooking_pot` |
| `QuestAndAchievement/Core/Quest/QuestData.mlua` | 프로퍼티 파싱 (pcall GetItem) |
| `QuestAndAchievement/Core/Quest/UserQuestData.mlua` | `Complete` 훅 → `GrantRecipeUnlock` |

## 3. 구현 상세

- **①** CSV 컬럼 `RewardUnlockId` (공란=없음).
- **②** `Complete`에서 아이템 보상 지급 후 `data.RewardUnlockId`가 있으면 `inv:GrantRecipeUnlock` (T25 멱등·토스트 재사용).
- **③** 크로스 상수: UnlockId=`quest_cooking_pot` / 퀘스트 107 / UnlockHint는 레인 2 RecipeDataSet 담당.

**스펙 이탈**: 없음. PlayerInventory 수정 없음(호출만).

**레인 2 의존**: 제작창 잠금 표시·해제 육안은 RecipeDataSet Cooking Pot `UnlockId`/`UnlockHint` 기입(T15) 후 통합 Play에서 확인.

## 4. 수행한 검증과 결과

- **Maker refresh** (레인 1 T20+T27 일괄, Play 중이면 `maker_stop` 후 재시도):
  1. 1차: Play 중 `unavailable` → stop
  2. 2차: `{"status":"ok"}` — 당시 Error 2 (UIRequest Clone parent Entity → LEA-1103/1108)
  3. Clone 수정 후 3차: `{"status":"ok"}`
- **빌드 로그 (최종)**: total **433** · **Error=0** · Warning=9 · Info=424  
  - Warning: 기존 cooking pot/slime_king LWA-4012 + LWA-1111(ServerRequestUseItem 기존 소음)
- **Play 런타임 검증 보류(제작자 수행)**

## 5. 발견한 문제 / 후속 제안

- 없음 (T20 Clone API 이슈는 T20 범위에서 수정·재검증 완료).

## 6. 제작자 런타임 체크리스트

- [ ] 퀘스트 107 완료 → `quest_cooking_pot` 해금 토스트
- [ ] 재접속 후 해금 유지 (`UnlockedRecipesJson`)
- [ ] (레인 2 T15 셀 기입 후) 제작창 Cooking Pot 잠금 해제 육안
- [ ] 다른 퀘스트 완료 시 불필요 해금 없음(RewardUnlockId 공란)

## 7. 이력

- 2026-07-11 최초 작성 (레인 1)
