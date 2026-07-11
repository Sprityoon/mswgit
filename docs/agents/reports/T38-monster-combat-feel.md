# T38 작업 보고서 — 몬스터 전투 체감 (접촉 데미지·텔레그래프·거리)

- **작업**: T38 몬스터 전투 체감 개선
- **상태**: 코드 완료 | Maker refresh 빌드 **Error=0** | Play 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: 버그픽스 배치 레인 1
- **날짜**: 2026-07-11

## 1. 요약

접촉 데미지 틱, 공격 윈드업 후 타격, 텔레그래프 틴트, AttackRange 단일 기준·StopDistance를 도입했다. 즉시 타격·하드코딩 0.81 제거. 몬스터-플레이어 물리 차단은 도입하지 않음(T36 대상 외).

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `Monster/Scripts/MonsterMeleeAttack.mlua` | Touch* 프로퍼티·attackInfo 분기 CalcDamage |
| `Monster/Scripts/MonsterAI.mlua` | 거리 단일화·윈드업 타격·텔레그래프·접촉 틱 |
| `Monster/Models/Boar.model` | TouchDamage=4 |
| `Monster/Models/HornMushroom.model` | TouchDamage=3 |
| `Monster/Models/SlimeKing.model` | TouchDamage=10 |

## 3. 구현 상세

- **① 접촉**: `TouchDamage`/`TouchTickInterval`/`TouchRadius`. OnUpdate 주기 `DoTouchAttack` → attackInfo=`touch`. i-frame 연타 억제 재사용.
- **② 타격 타이밍**: ATTACK 진입 시 `AttackStrikePending`+`TelegraphOn`만. StateTimer 만료 시 `DoAttack`(attackInfo=`attack`).
- **③ 텔레그래프**: `@Sync TelegraphOn` + ClientOnly `OnSyncProperty` 주황 틴트 (서버 Color 직접 조작 없음). CONTACT 윈드업 추적 50% 속도.
- **④ 거리**: `0.81` 제거 → `AttackRange`. `StopDistance`(0.8) 이내 접근 중단.
- **⑤** 몬스터를 ResolveOverlaps에 넣지 않음.

## 4. 수행한 검증과 결과

- Maker refresh: `{"status":"ok"}`
- 빌드: total **439** · **Error=0** · Warning 11 · Info 428
- **Play 런타임 검증 보류(제작자 수행)**

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 몬스터 겹침 시 ~1초 간격(i-frame) 접촉 데미지
- [ ] AttackRange에서 개시 → 주황 텔레그래프 → 윈드업 후 타격
- [ ] 파고들기 없이 StopDistance 정지
- [ ] 넉백·리쉬·어그로 유예·보스 회귀 없음
- [ ] 슬라임/멧돼지/뿔버섯/슬라임킹 각각 체감

## 7. 이력

- 2026-07-11 최초 작성 (레인 1)
