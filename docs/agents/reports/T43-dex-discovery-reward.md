# T43 작업 보고서 — 도감 최초 발견 보상 (코인+XP)

- **작업**: T43 도감 최초 발견 보상 — 코인+XP 자동 지급 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker 기동, refresh 수행
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

도감 0→1 최초 발견 시 `DexRewardDataSet` CSV 기준으로 코인·XP를 즉시 자동 지급한다. 아이템은 `item_dataset.Rarity`로 차등(Common~Epic), 몬스터는 `Kind=monster` 기본 1행. 카운터 자체가 수령 기록이므로 별도 영속 필드·세이브 경로 변경 없음. 토스트는 기존 `PlayerController.ShowMineFeedback` 재사용. refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/item/DataSets/DexRewardDataSet.csv` | 신규 — Kind/Rarity/RewardCoin/RewardXp 5행 |
| `RootDesk/MyDesk/item/DataSets/DexRewardDataSet.userdataset` | 신규 데이터셋 메타 |
| `RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` | `RecordItemAcquired`/`RecordMonsterKill` 0→1 훅 + `GrantDexDiscoveryReward` |

## 3. 구현 상세

- **① CSV**: item Common 5/5, Uncommon 10/10, Rare 25/25, Epic 50/50; monster 기본 15/15 (Rarity 공란).
- **② 지급 지점**: prev count == 0일 때만 `GrantDexDiscoveryReward`. 재획득·재처치 미지급(멱등).
- **③ 코인 한정**: `self.Coin += coin` (통화 저장소 직접 — `AddItem` 픽업 토스트 중복 회피). 아이템 보상 경로 없음(재귀 방지).
- **④ XP**: `PlayerController.AddXP` 정의 확인 후 호출(규칙 8). 채집 경로 `TileDurabilityManager`와 동일.
- **⑤ 토스트**: `pc:ShowMineFeedback("도감 등록: <표시명> (+N코인 +N XP)")` — 레시피 해금과 동일 파이프라인.
- **⑥ 소급 없음**: 이미 count>0인 항목은 전이 조건 불충족으로 미지급.
- **스펙 편차**: 없음. 세이브 경로 무변경.

## 4. 수행한 검증과 결과

- **Maker `maker_refresh_workspace`**: status=ok.
- **Build logs**: **Error=0** / Warning=13 / Info=436 / total=449.
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 없음. (이미 발견된 항목에 소급 보상이 필요하면 별도 마이그레이션 티켓.)

## 6. 제작자 런타임 체크리스트

- [ ] 미발견 아이템 첫 획득 시 코인·XP 증가 + "도감 등록: …" 토스트 1회
- [ ] 같은 아이템 재획득 시 추가 지급 없음
- [ ] Rarity별 차등 확인(Common vs Rare 등)
- [ ] 미발견 몬스터 첫 처치 시 몬스터 기본 보상 1회
- [ ] 재접속 후 이미 발견된 항목 재지급 없음
- [ ] 서버 로그 `[DEX] discovery reward` 확인

## 7. 이력

- 2026-07-14 최초 작성 (Grok worker)
