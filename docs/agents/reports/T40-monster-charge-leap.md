# T40 작업 보고서 — 멧돼지 돌진(CHARGE)·도약(LEAP) 공격 + 인식/추적/귀환 개선

- **작업**: T40 멧돼지 돌진(CHARGE)·도약(LEAP) 공격 + 인식/추적/귀환 개선 (`docs/agents/subagent-handoff.md` §3 T40)
- **상태**: 완료 | `mlua-diagnose` errors=0 | Maker refresh 빌드 Error=0 | Play: 제작자 확인
- **수행 에이전트/환경**: 구현자(Claude, claude-sonnet-5) + 제작자 반복 튜닝, Maker 기동(MCP play/refresh 사용), LSP 사용 가능
- **날짜**: 2026-07-12

## 1. 요약

큐 항목 없이 제작자가 대화로 직접 지시·검증한 몬스터 전투 개선을 규칙(§5 조항 11)에 맞춰 소급 정식화한 보고서다. 멧돼지 공격을 즉시 접근형에서 **돌진형(CHARGE)** 으로 바꿨다: 먼 거리(감지 10)에서 인식 → 잠깐 정지(텔레그래프) → 그 순간의 플레이어 방향·거리를 **고정 캡처**해 고속 직진 → 감속 정지. 재조준하지 않으므로 유저가 옆으로 회피할 수 있고, 돌진 개시 후에는 유저가 감지범위를 벗어나도 끝까지 진행한다. 함께 인식거리(모델 `DetectRange`)·리쉬(`LeashRange` 10→15)를 늘리고, 추적하다 놓치면 제자리에 굳지 않고 **빠르게 원위치 복귀**하도록 고쳤다. 제작자가 추가로 CHARGE에 DECEL 감속 단계와 도약 광역 타입 **LEAP**(윈드업 중 스케일로 높이 연출 후 착지 타격)을 넣었다. refresh 빌드 Error=0, 제작자 Play 확인.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Monster/Scripts/MonsterAI.mlua` | `AttackType` `CHARGE`/`LEAP` 추가. CHARGE 3단계(PAUSE→DASH→DECEL) + `EndCharge`(종료 시 쿨다운). LEAP 스케일 연출(`CaptureBaseScale`/`ApplyLeapScale`/`RestoreBaseScale`). `LeashRange` 상향, `ReturnSpeedMultiplier`(배속 귀환) 신설, 추적 상실 시 즉시 RETURN, `MoveTowardScaled`(구 `MoveTowardHalf` 대체). CHARGE 전용 프로퍼티(`ChargeSpeedMultiplier`/`ChargeDecelDuration`/`ChargeMaxDuration` 등), LEAP 전용(`LeapPeakScale`/`LeapRiseFraction`). |
| `RootDesk/MyDesk/Monster/Models/Boar.model` | `AttackType=CHARGE`, `DetectRange=10`, `AttackRange=3.2`, `AttackWindup=0.4`, `ChargeSpeedMultiplier=3.5` 오버라이드(ModelBuilder). |

## 3. 구현 상세

- **① AttackType 확장**: `"CHARGE"`/`"LEAP"`를 문자열 프로퍼티 값으로 추가. 이름 분기가 아니라 타입 값 분기(모델 프로퍼티로 몹별 지정).
- **② CHARGE 3단계**(`UpdateCharge`):
  - `PAUSE`: `AttackWindup` 동안 정지 + `@Sync TelegraphOn` 주황 틴트(클라 `OnSyncProperty` 연출 — 서버 Color 직접 조작 없음, T38 파이프라인 재사용).
  - `DASH`: PAUSE 만료 시점에 최근접 플레이어 **방향·거리를 고정 캡처**(`ChargeDir`/`ChargeDistanceRemaining`), `ChargeSpeedMultiplier` 배속으로 직진. 재조준하지 않음 → 회피 가능. 거리 소진 측정은 `MoveToDirection`이 같은 프레임에 Transform에 반영되지 않는 특성 때문에 **직전 프레임 실이동량**(`ChargeLastPos`와의 차)으로 계산. `ChargeMaxDuration` 안전장치로 벽 끼임 시 강제 종료.
  - `DECEL`: `ChargeDecelDuration` 동안 감속 후 정지. 고정 overshoot 배율은 쓰지 않음(유저 거리 기반).
  - **쿨다운은 종료 시**(`EndCharge`)에 부여 — 시작 시 부여하면 돌진 중 소진되어 연속 돌진하는 버그가 나므로.
- **③ LEAP**: ATTACK 윈드업 동안 `ApplyLeapScale(progress)`로 상승/하강 곡선을 스케일로 연출(탑다운에서 "높이"를 크기 변화로 표현), 만료 시점 광역 `DoAttack`. 사망/넉백 진입 시 `RestoreBaseScale`로 원복.
- **④ 인식/추적/귀환**: `LeashRange` 기본 10→15. `ReturnSpeedMultiplier`(RETURN/리쉬 귀환 시 배속) 신설. 추적(CHASE) 중 타겟을 놓치고 어그로 유예도 없으면 제자리 배회로 굳지 않고 즉시 RETURN. 속도 배율 이동을 `MoveTowardScaled(target, delta, mult)`로 일반화(구 `MoveTowardHalf` 대체 — CONTACT 윈드업 접근/귀환/돌진 공용).
- **⑤ Boar 모델**: 위 수치 오버라이드. 나머지 몹은 무변경(빈/기본값이라 기존 CONTACT/RANGED 동작 유지).
- **스펙에서 벗어난 결정**: 없음(하드코딩 예외 없음 — 모든 수치 모델 프로퍼티/스크립트 프로퍼티).
- **재사용 vs 신규**: T38 텔레그래프/쿨다운/StopDistance 파이프라인·T39 투사체 분기 재사용. 신규 = CHARGE/LEAP 상태·전용 프로퍼티·`MoveTowardScaled`.

## 4. 수행한 검증과 결과

- `mlua-diagnose`(edit 훅 자동): errors=0, warnings=0 (MonsterAI.mlua).
- 초기 CHARGE 구현 후 Maker `play` + `_SpawnService`로 테스트 멧돼지 스폰 → 서버 로그에서 `CHARGE PAUSE start` → `CHARGE DASH start dir=(...)` 전이 확인. 이 과정에서 **DASH 거리 미소진 버그**(같은 프레임 Transform 미반영으로 before/after 차가 0 → 안전타이머로만 종료) 발견 → 직전 프레임 실이동량 측정으로 수정.
- Maker refresh 빌드: **Error=0**(total 437) — 제작자 LEAP/DECEL 추가분 포함 상태에서 확인.
- 임시 `[VERIFY-TMP]` 로그는 전량 제거됨(현재 파일 grep 매치 0).
- Play 최종 체감(돌진 타이밍/회피/귀환)은 제작자가 반복 확인하며 튜닝.

## 5. 발견한 문제 / 후속 제안

- DASH 거리 측정의 1프레임 지연(위 §4)은 수정 완료.
- 후속(선택): SlimeKing 등 보스에 LEAP 적용 검토 — 현재 Boar만 CHARGE. 신규 몹은 모델 프로퍼티 지정만으로 확장 가능.

## 6. 제작자 런타임 체크리스트

- [ ] 멧돼지가 먼 거리(감지 10)에서 인식 → 잠깐 멈춤(주황 텔레그래프) → 고정 방향 직진 돌진 → 감속 정지
- [ ] 돌진 개시 후 유저가 감지범위를 빠르게 벗어나도 끝까지 진행
- [ ] 유저가 옆으로 피하면 돌진을 흘릴 수 있음(재조준 없음)
- [ ] 추적하다 놓치면 제자리 배회 고착 없이 빠르게 원위치 복귀
- [ ] Slime/SlimeKing/HornMushroom 기존 동작 회귀 없음

## 7. 이력

- 2026-07-12 최초 작성 — 제작자 직접 지시(비큐) 작업의 소급 정식화 (구현자 Claude). CHARGE(PAUSE/DASH/DECEL)+LEAP+인식/귀환 개선. refresh Error=0, Play 제작자 확인.
