# T39 작업 보고서 — 몬스터 원거리 공격 (HornMushroom 포자 투사체)

- **작업**: T39 몬스터 원거리 공격 — HornMushroom 포자 투사체 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 코드/데이터/모델 완료 (커밋 `1835d49`) | **refresh 빌드 검증 보류(Maker 미가동)** | Play 런타임 검증 보류(제작자)
- **수행 에이전트/환경**: 구현 = 배치 D 에이전트(Fable 5, 사용 한도로 T39 보고서 작성 전 종료) → 산출물은 `1835d49`로 커밋·origin 반영됨. 본 보고서 = 지휘자(Opus 4.8)가 커밋 산출물을 코드 리뷰로 검수해 대체 작성. Maker 미가동으로 refresh 미수행.
- **날짜**: 2026-07-12

## 1. 요약

T38로 정비된 근접 전투 파이프라인 위에, **ProjectileModelId가 빈 값이 아니면 ATTACK 윈드업 만료 시점에 근접 대신 투사체를 발사**하는 데이터 주도 분기를 MonsterAI에 추가하고, HornMushroom을 원거리(RANGED) 1호로 설정했다. 투사체 컴포넌트(`MonsterProjectile`)는 이미 존재(주석 오타 2건만 수정), 신규 모델 2종(투사체 `Projectile_Spore`, 원거리몹 재설정 `HornMushroom`)을 추가. Slime/Boar/SlimeKing은 `ProjectileModelId` 빈 값이라 근접 무회귀. **코드 수정은 전부 데이터/이름 하드코딩 0**, 스폰·모델해석 API는 MonsterSpawner 기존 패턴과 대조 검증 완료. refresh·Play는 미수행(보류).

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Monster/Scripts/MonsterAI.mlua` | `ProjectileModelId`+수치 4종 프로퍼티, ATTACK 만료 시 `FireProjectile()` 분기, `FireProjectile` 메서드 신설 |
| `RootDesk/MyDesk/Monster/Scripts/MonsterProjectile.mlua` | 주석 오타 2건 수정(시뮬레이터·넉백) — 로직 무변경 |
| `RootDesk/MyDesk/Monster/Models/Projectile_Spore.model` | 신규 — Transform+SpriteRenderer+`MonsterProjectile`, SpriteRUID `606b8732…`, MapLayer5/Order 10 |
| `RootDesk/MyDesk/Monster/Models/HornMushroom.model` | AttackType=RANGED, AttackRange=3, StopDistance=2.5, ProjectileModelId=`Projectile_Spore`, Projectile 수치 4종 |

## 3. 구현 상세

- **① 투사체 모델 신설**: `Projectile_Spore.model` — Body 없이 Transform Translate 비행 설계 유지, SpriteRUID `606b8732…`(비어있지 않음 — 8대 규칙 3 준수). `MonsterProjectile` 컴포넌트 부착.
- **② MonsterAI 원거리 프로퍼티**: `ProjectileModelId=""`(빈 값=근접 전용, 이름 분기 아님) + `ProjectileSpeed/Damage/LifeTime/HitRadius` 전부 프로퍼티(코드 리터럴 0).
- **③ 발사 분기**: T38이 만든 **ATTACK 윈드업 만료 시점**(`AttackStrikePending` 소진)에서 `ProjectileModelId ~= ""`이면 `FireProjectile()`, 아니면 기존 `DoAttack()`. 텔레그래프/쿨다운/StopDistance 등 T38 파이프라인 그대로 재사용 — 신규 상태 발명 없음. `FireProjectile`은 `_EntryService:GetModelIdByName`(폴백 포함) → `_SpawnService:SpawnByModelId(modelId, name, pos, map)`(**parent=CurrentMap, nil 금지 — 8대 규칙 4**) → `MonsterProjectile:Fire(owner, dir, dmg, speed, hitRadius, lifeTime)`.
- **④ HornMushroom 설정**: RANGED + AttackRange 3.0/StopDistance 2.5(거리 유지) + ProjectileModelId=`Projectile_Spore` + 수치 오버라이드. Slime/Boar/SlimeKing 무변경(빈 ProjectileModelId).
- **스펙에서 벗어난 결정**: 없음.
- **재사용/신규 구분**: `MonsterProjectile`·ATTACK 윈드업·텔레그래프·`GetModelIdByName`/`SpawnByModelId` 패턴 = 재사용 / `FireProjectile` 메서드·모델 2종 = 신규.

## 4. 수행한 검증과 결과

- **API 정합 대조(지휘자 코드 리뷰)**: `FireProjectile`의 `_EntryService:GetModelIdByName`+폴백, `_SpawnService:SpawnByModelId(modelId, name, spawnPos, map)` 4인자 시그니처가 `MonsterSpawner.mlua` L216-229의 실제 사용과 **정확히 일치**. `MonsterProjectile:Fire(...)` 인자 순서/개수가 정의부(`Fire(owner, dir, dmg, speed, hitRadius, lifeTime)`)와 일치. (§1.2 규칙 8 준수 확인)
- **모델 검수(지휘자)**: 두 모델 모두 SpriteRUID 비어있지 않음. Projectile_Spore = Transform+SpriteRenderer+MonsterProjectile 3종. HornMushroom = AttackType/ProjectileModelId/수치 전부 데이터, ProjectileModelId 값이 투사체 모델 Name과 일치.
- **⚠️ Maker refresh 빌드 검증: 보류(Maker 미가동)** — LSP/refresh 로그를 확보하지 못했다. 허위 "동작 확인" 없음. 다음 Maker 기동 세션에서 refresh Error 수 확인 필요.
- **Play 런타임 검증: 보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 모델 프로퍼티 인코딩 불일치(경미): TouchDamage(T38)는 `ValueType.type="number"`, T39 신규 수치는 `System.Double`. Boar/SlimeKing도 T38 TouchDamage가 `"number"`라 **T39가 새로 만든 문제 아님**이며 T38이 Error=0로 빌드된 이력이 있어 churn하지 않음. refresh 시 이 프로퍼티군에 경고가 없는지만 확인 권장.
- 원거리 2호(예: 마법형 `AttackType="MAGIC"`) 확장은 `ProjectileModelId`+투사체 모델 추가만으로 가능 — 신규 티켓 시 CSV/모델 행 추가 수준.

## 6. 제작자 런타임 체크리스트

- [ ] HornMushroom이 AttackRange(3칸) 경계에서 개시 → 주황 텔레그래프 → 윈드업 만료 시 포자 발사
- [ ] 포자가 플레이어 명중 시 정식 히트(데미지 스킨/i-frame/넉백) 경유 데미지
- [ ] 빗나간 포자가 LifeTime(1.5s) 후 소멸(잔존 엔티티 0)
- [ ] HornMushroom이 StopDistance(2.5칸)에서 멈춰 거리 유지(파고들기 없음)
- [ ] Slime/Boar/SlimeKing은 근접 공격 그대로(원거리 회귀 0)
- [ ] Maker refresh 빌드 Error 수 확인(지휘자/제작자)

## 7. 이력

- 2026-07-12 최초 작성 (지휘자 Opus 4.8 — 구현 에이전트가 사용 한도로 보고서 미작성 종료, 커밋 `1835d49` 산출물을 코드 리뷰 검수해 대체 작성. refresh 미수행 보류 명시)
