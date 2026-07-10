# T16 작업 보고서 — 공통 버프/스탯 + 소비 경로

- **작업**: T16 버프 인프라
- **상태**: **완료 | refresh 빌드 Error=0 | 제작자 Play 검증 PASS (2026-07-11)**
- **날짜**: 2026-07-11

## 1. 요약

`BuffDataSet` + `PlayerBuffs` 세션 버프, `UseBuffId` consumable 사용, HUD BuffBar, 이동/채집/공격/스태미나 훅, 실증 아이템 `Roasted Grass`를 구현했다. T9의 `ServerRequestUseItem` 진입점을 확장했다.

## 2. 수정 파일

| 파일 | 요지 |
|---|---|
| `BuffDataSet.csv` + userdataset | gather_boost_small |
| `PlayerBuffs.mlua` | Apply/Expire/GetStatMult·Add |
| `DefaultPlayer.model` | PlayerBuffs 부착 |
| `item_dataset` | UseBuffId + Roasted Grass |
| `RecipeDataSet` | Roasted Grass = Grass×1 |
| `PlayerInventory` | UseBuffId 분기 |
| `PlayerController` | 스탯 훅 |
| `PlayerCombat` | AttackPower |
| `UIHUDController` + HUD BuffBar | 남은 초 표시 |

## 3. 구현 상세

- 버프 세션 한정, refresh 스택, 영속 없음.
- GatherSpeed→채집 쿨다운 감소, MoveSpeed→InputSpeed, AttackPower→데미지, StaminaRegen→틱 회복.
- 이름 분기 없음 — 전부 CSV 컬럼.

## 4. 검증

- refresh 빌드 **Error=0**.
- **제작자 Play 검증 PASS (2026-07-11)**.

## 5. 제작자 체크리스트

- [x] Grass→Roasted Grass 제작
- [x] 퀵슬롯 Ctrl 사용 → 버프 토스트·BuffBar 표시
- [x] 만료·원복 / 재사용 갱신
- [x] consumable 사용 경로 핫픽스 후 정상

## 6. 이력

- 2026-07-11 최초 작성
- 2026-07-11 Roasted Grass 사용 핫픽스 (쿨다운 우회·PlayerBuffs 폴백)
- 2026-07-11 제작자 Play 검증 PASS — 통합: `BATCH-A-B-play-verify-2026-07-11.md`
