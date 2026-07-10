# T9 작업 보고서 — 희귀 드롭 소스

- **작업**: T9 희귀 드롭 소스
- **상태**: **완료 | refresh 빌드 Error=0 | 제작자 Play 검증 PASS (2026-07-11)**
- **날짜**: 2026-07-11

## 1. 요약

보스/보물 데이터 주도 도안 드롭, 자원 3% 희귀 변종(배율·연출), 사냥터 보물 상자, 도안 소모 사용(`UseUnlockId`→`GrantRecipeUnlock`)을 구현했다. consumable 사용 진입점(`ServerRequestUseItem`)은 T16 버프 확장용으로 남겨 두었다.

## 2. 수정 파일

| 파일 | 요지 |
|---|---|
| `item_dataset.csv` | `UseUnlockId` 컬럼 + Recipe Scroll 2종(consumable) |
| `ItemDropDataSet.csv` | SlimeKing/Boss_slime_king 도안, TreasureChest 루트 |
| `Monster.mlua` | GrantBossRewards → ItemDropDataSet 드롭 |
| `ResourceOccupiedArea.mlua` | DropMultiplier / IsRareVariant |
| `ResourceSpawner.mlua` | 3% 희귀 변종 스폰, hunt 보물 상자 배치 |
| `TileDurabilityManager.mlua` | 희귀 배율 드롭 반영 |
| `TreasureChest.mlua` + `.model` | 1회 개봉 상자 |
| `PlayerInventory.mlua` | ServerRequestUseItem (UseUnlockId) |
| `PlayerController.mlua` | Ctrl + consumable → Use |

## 3. 구현 상세

① 도안: `Recipe Scroll: Copper/Iron Tools` — UseUnlockId=`research_copper_tools`/`research_iron_tools`, 퀵슬롯 Ctrl 사용 시 소모+해금.  
② 보스: 기존 BossDropItem 유지 + ItemDropDataSet(SourceId=엔티티명 `Boss_slime_king` 및 `SlimeKing`).  
③ 희귀 변종: 청크 스폰 Hash2D 3%, DropMultiplier=2, 스케일·금색 틴트.  
④ 보물 상자: hunt01~03 외곽 1개 멱등 스폰, F/터치 1회 개봉.

## 4. 검증

- Maker refresh 빌드 **Error=0** (기존 Warning 2).
- Play 런타임 검증 보류(제작자 수행).

## 5. 후속

- 도안 전용 아이콘/모델(현재 Item_Wood placeholder).
- 보물 상자 세션 영속(현재 맵 재생성 시 재스폰 가능 — Ensure 멱등은 컴포넌트 존재만 검사).
- T16이 UseBuffId를 같은 ServerRequestUseItem에 연결.

## 6. 제작자 체크리스트

- [x] 보스 도안 드롭·사용 해금
- [x] 희귀 변종 연출/드롭
- [x] hunt 보물 상자 F/클릭 개봉·드롭 (포탈 이격·F 우선 핫픽스 후)

## 7. 이력

- 2026-07-11 최초 작성
- 2026-07-11 보물 상자 스폰/F/터치 핫픽스
- 2026-07-11 제작자 Play 검증 PASS — 통합: `BATCH-A-B-play-verify-2026-07-11.md`
