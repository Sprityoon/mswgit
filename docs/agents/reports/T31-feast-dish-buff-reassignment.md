# T31 작업 보고서 — 버프·요리 콘텐츠 정합 (상위 버프 신설 + Feast Dish 재배정)

- **작업**: T31 버프·요리 콘텐츠 정합 — 상위 버프 신설 + Feast Dish 재배정 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 완료 (①② 전부 이행 — ②는 2026-07-12 배치 D에서 보스 채택 확정 후 수행, 코드 수정 0 = CSV-only) | refresh 검증 보류(Maker 미가동 — 2026-07-12 프로브 tools=[] 확인) | Play 검증 보류(제작자)
- **수행 에이전트/환경**: Antigravity (Gemini 3.5 Flash) → 배치 D 잔여분: Claude Code (Fable 5), Maker 미기동
- **날짜**: 2026-07-11 (최초) / 2026-07-12 (② 완결)

## 1. 요약

최상위 요리인 Feast Dish의 버프 효과가 최하위 Roasted Grass의 집중 버프(1.25배, 60초)와 동일했던 밸런스 오류를 해결하기 위해, 상위 채집 버프인 `gather_boost_big`(1.5배, 120초)을 신설하고 Feast Dish의 적용 버프로 재배정했습니다. 멧돼지 고기 드롭 및 조리와 관련된 고기 축 작업(T31②)은 가축 시스템(T19)과의 조율이 필요하여 보스의 결정을 대기하며 보류 처리했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/item/DataSets/BuffDataSet.csv` | 상위 채집 속도 버프 `gather_boost_big` 행 추가 (①) / `atk_boost_small` 행 추가 (② 2026-07-12) |
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | Feast Dish의 `UseBuffId`를 `gather_boost_big`으로 변경 (①) / `raw_meat`·`roasted_meat` 행 추가 — 기존 행 무수정 (② 2026-07-12) |
| `RootDesk/MyDesk/MapObjects/DataSets/ItemDropDataSet.csv` | Boar→raw_meat 드롭 행 추가 (② 2026-07-12) |
| `RootDesk/MyDesk/Furniture/DataSets/CookingRecipeDataSet.csv` | Raw Meat 2 → Roasted Meat (CookDuration 10) 조리 행 추가 (② 2026-07-12) |

## 3. 구현 상세

- **Change ①**: `BuffDataSet.csv`에 `gather_boost_big` (표시명: "강한 집중", StatKey: `GatherSpeed`, 배율: 1.5×, 지속시간: 120초) 행을 추가했습니다. 그리고 `item_dataset.csv`에서 Feast Dish의 `UseBuffId` 컬럼 값을 `gather_boost_small`에서 `gather_boost_big`으로 재배정하여 희귀도 등급(Rare)에 어울리는 성능을 갖추도록 개편했습니다.
- **Change ② (2026-07-12 완결 — 배치 D, ⚖️ 보스 채택 확정)**: 고기 축 4행 추가 — 전부 CSV-only, **코드 수정 0** (기대값 충족).
  - `item_dataset.csv` **행 추가만** (기존 행 무수정):
    - `raw_meat` / Raw Meat / `Category=resource` — 아이콘 `90386dd054bf4acfa2b363d5d1c45478`(msw-search "커다란 보어의 고기" — 썸네일 육안 확인: 생고기 단면). 드롭 모델 `Item_Wood`+wood EntryId = 기존 어류(carp 등)와 동일한 placeholder 패턴.
    - `roasted_meat` / Roasted Meat / `Category=consumable` + `UseBuffId=atk_boost_small` — 아이콘 `1b1ccb37d5de4ae5837fad85c54a8e58`(msw-search "맛있는 고기" — 썸네일 육안 확인: 익힌 뼈고기).
  - `ItemDropDataSet.csv`: `boar,,raw_meat,1,2,1.0` — T28 MonsterId 체계 준수(Boar.model의 `MonsterId="boar"` 실사 확인, `Monster.mlua` L137~ `SourceId==MonsterId`·`ItemId=item_dataset.id` 스키마 그대로).
  - `CookingRecipeDataSet.csv`: `Raw Meat,2,Roasted Meat,10` — 기존 행 패턴(InputItem/OutputItem=표시명 Name — `Furnace.mlua` L70 `FindRow("InputItem", itemName)` 대조 확인), CookDuration 10 = 기존 범위(6~15) 내.
  - `BuffDataSet.csv`: `atk_boost_small,가벼운 투지,AttackPower,mult,1.25,60,1b1ccb37d5de4ae5837fad85c54a8e58,refresh` — `gather_boost_small` 패턴 미러(제안값 1.25/60s 채택). IconRUID는 공용 placeholder(f0bce7f8…) 대신 확보한 고기 아이콘 적용(HUD BuffBar 구분성 — CSV 튜닝 자유 범위).
  - **AttackPower 훅 실재 확인(§1.2 규칙 8)**: `PlayerController.mlua` L1841 `GetBuffedAttackPower()`(`GetStatAdd/GetStatMult("AttackPower")`) + `PlayerCombat.mlua` L26 데미지 가산 — T16 산출물 살아있음.

## 4. 수행한 검증과 결과

- **LSP 및 Maker refresh**: 레인 B의 모든 티켓이 완료된 후에 일괄적으로 1회 refresh 검증을 수행할 예정이므로 보류 상태입니다. → 지휘자 일괄 refresh 396건 Error=0 (2026-07-11, §2 감사 배치 포인터).
- **Change ② refresh (2026-07-12)**: **보류 — Maker 미가동** (`scratch/mcp_probe.py` 결과 `tools: []`). CSV 행 추가 4건, 코드 수정 0 — LSP 대상 없음. 빌드 Error 수: 측정 불가(Maker 미가동). 정적 정합 검증 수행: ① InputItem 대조 키=표시명(Furnace L70) ② 드롭 SourceId=MonsterId·ItemId=id (Monster L137~) ③ AttackPower StatKey 훅 실재(PlayerController L1841/PlayerCombat L26) ④ 아이콘 RUID 2종 썸네일 육안 확인.
- **Play 런타임 검증**: 지휘자 규정에 따라 런타임 검증은 보류(제작자 직접 수행)입니다.

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] Feast Dish 사용 시 상위 버프 `gather_boost_big`(채집 속도 1.5배, 120초 지속)이 정상 발동하는지 확인
- [ ] 기존 Roasted Grass 사용 시 하위 집중 버프 `gather_boost_small`(1.25배, 60초)이 그대로 유지되어 등급별 밸런스가 맞는지 확인
- [ ] (2026-07-12 ② 적용분) 멧돼지(Boar) 처치 시 Raw Meat 1~2개 드롭 확인
- [ ] (2026-07-12 ② 적용분) 냄비(Cooking Pot)에 Raw Meat 2개 투입 → 10초 조리 → Roasted Meat 산출 확인
- [ ] (2026-07-12 ② 적용분) Roasted Meat 사용 시 "가벼운 투지"(AttackPower ×1.25, 60초) 버프가 HUD BuffBar에 고기 아이콘으로 표시되고, 몬스터 공격 데미지가 상승하는지 확인
- [ ] (2026-07-12 ② 적용분) 인벤토리에서 Raw Meat(생고기)·Roasted Meat(익힌 고기) 아이콘이 구분 표시되는지 확인

## 7. 이력

- 2026-07-11 최초 작성 (Antigravity)
- 2026-07-12 배치 D: T31② 완결 — 고기 축 CSV 4행(raw_meat/roasted_meat/boar 드롭/조리 레시피/atk_boost_small), 코드 수정 0. 아이콘 2종 msw-search 확보(placeholder 아님). refresh 보류(Maker 미가동, mcp_probe tools=[]). (Claude Code)
