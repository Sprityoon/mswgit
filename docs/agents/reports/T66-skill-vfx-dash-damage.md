# T66 작업 보고서 — 스킬 이펙트 실표시 + 피격 이펙트 + 대시 데미지

- **작업**: T66 스킬 이펙트 실표시 수리 + 원작 이펙트·피격 이펙트 + 대시 데미지 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP 무에러 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker refresh만, Play 미수행
- **날짜**: 2026-07-18

## 1. 요약 (3~5줄)

시전 이펙트 RUID는 전원 유효한 `animationclip`이었다. 비가시 원인은 `PlayEffect`에 **SortingLayer/IgnoreMapLayerCheck 미지정**(투사체 선례와 동일). `MulticastPlayEffectEx`로 정렬·FlipX·스케일·전방 오프셋을 추가했다. `HitEffectRUID` CSV + `PendingHitEffectRUID` 훅으로 피격 FX, dash `DamageMultiplier=1.0`/`DamagePerLevel=0.2` + 경로 AABB 스윕 데미지. refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `Player/Scripts/PlayerController.mlua` | `MulticastPlayEffectEx`·오프셋/스케일·대시 스윕·투사체 HitFX 전달 |
| `Player/Scripts/PlayerCombat.mlua` | `PendingHitEffectRUID` |
| `Player/Scripts/Projectile.mlua` | `HitEffectRUID` + Initialize/TriggerAttack 배선 |
| `Monster/Scripts/Monster.mlua` | HandleHitEvent 피격 FX |
| `Player/DataSets/SkillDataSet.csv` | HitEffectRUID/EffectOffset/EffectScale · dash 데미지 |

## 3. 구현 상세

### ① 진단
- `get` API: 4스킬 EffectRUID 전부 `type=animationclip`·프레임 존재 → **무효 RUID 아님**.
- `EffectService.d.mlua`: options에 `IgnoreMapLayerCheck`, `SortingLayer`, `OrderInLayer`, `FlipX` 확인.
- 수정: `PlayEffect(..., opts)` with `IgnoreMapLayerCheck=true`, `SortingLayer=_RenderLayers.EntityLayer`, `OrderInLayer=500`.

### ② 시전 이펙트
- 전방 오프셋: CSV `EffectOffset` 또는 `SkillEffectForwardOffset`(0.8).
- 스케일: CSV `EffectScale` 또는 `SkillEffectScale`(1.0).
- FlipX: `dirX > 0`.

### ③ 피격 이펙트
- HitEvent.Extra로는 스킬 식별 불가(`attackInfo=nil` 경로) → 공격측 `PlayerCombat.PendingHitEffectRUID` 확정.
- Melee/Ultimate/Dash: 시전 시 설정 → AttackFast → HandleHitEvent 재생 → 클리어.
- Projectile: 탄환에 HitEffectRUID 저장, 명중 시 Pending 설정.

### ④ 대시 데미지
- dash: `DamageMultiplier=1.0`, `DamagePerLevel=0.2`.
- `ExecuteDashSkill(dirX,dirY,damageMul)`: 시작~도착 AABB 1회 `AttackFast` (4방향 축정렬).

### 스펙 편차
- 없음. 기존 3스킬 배율(1.5/2.2/4.5) 유지.

## 4. 수행한 검증과 결과

- **LSP**: 수정 파일 Error=0.
- **Maker refresh**: ok.
- **Build**: **Error=0** / Warning=25 / Info=492 / total=517.
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 스킬 명중 시 T65 도구 타격음도 HandleHitEvent에서 재생(기존 T65 스펙). 감성 충돌 시 후속 티켓.
- 신규 T항목 발행 없음.

## 6. 제작자 런타임 체크리스트

- [ ] Q/W/E/R 시전 이펙트 가시 (로그 `[T66][FX] PlayEffect ... serial=` ≠0)
- [ ] 방향 전환 시 이펙트 좌우 플립
- [ ] 몬스터 피격 시 피격 이펙트 (`[T66][HITFX]`)
- [ ] 플래시 점프 경로상 몬스터 데미지 (`[T66][DASH] dmg=`)
- [ ] 쿨다운·스태미나·시전 사운드·기존 데미지 회귀 없음
- [ ] CSV만으로 이펙트/오프셋/대시 배율 튜닝 가능

## 7. 이력

- 2026-07-18 최초 작성 (Cursor Grok worker)
