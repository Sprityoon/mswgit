# T71 작업 보고서 — 스킬 이펙트 미표시 진범 수정 (PlayEffect instigator nil)

- **작업**: T71 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 완료 | refresh Error=0 | **런타임 검증 완료(시전 경로 클라 serial>0)** | 육안 최종 확인 = 제작자
- **수행 에이전트/환경**: 지휘자 직접 (⚖️ 보스 "직접 원인 찾아 수정" 지시), Maker Play + `maker_execute_script` 격리 실험
- **날짜**: 2026-07-18

## 1. 요약 (3~5줄)

T46부터 스킬 이펙트가 한 번도 표시되지 않은 진범 = `_EffectService:PlayEffect`의 **instigator 인자 nil**. 클라이언트는 nil이면 에러 없이 생성 실패(serial=0), 서버는 nil을 통과시켜 serial>0을 반환 — 그래서 로그가 "서버만 성공"으로 보였고 T66(정렬 옵션)·T70(폴백 체인)이 연달아 빗나갔다. Play 격리 실험으로 변수 하나씩 소거해 확정, `self.Entity`로 교체 후 실제 시전 경로에서 클라 serial>0 + 모션 재생을 확인했다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `MulticastPlayEffectEx`의 `PlayEffect` 3곳 instigator `nil`→`self.Entity` + 경고 주석 + 로그 태그 `[T71][FX]` |
| `docs/agents/subagent-handoff.md` | §1.2 **규칙 12 신설**(instigator nil 금지) + T70/T71 상태·현황판 |
| `game_design.md` | 16-F 트래커 갱신 |

## 3. 진단 과정 (격리 실험)

제작자 로그에서 T70 폴백 3단(full/min/none) **전부 serial=0** → 옵션 딕셔너리 무죄 확정. 클립은 리소스 API로 정상 프레임 기반 원작 스킬 이펙트임을 확인(frames·subPath `skill/*/effect`). 남은 변수를 Play 컨텍스트에서 `maker_execute_script`(client)로 하나씩 실험:

| 실험 | 호출 | serial |
|---|---|---|
| A | `PlayEffect(클립, **nil**, pos, …)` | **0 (실패)** |
| B | `PlayEffect(클립, **LocalPlayer**, pos, …)` | **2 (성공)** |
| C | `PlayEffectAttached(클립, LocalPlayer, …)` | 3 (성공) |
| D | 다른 클립 + nil | 0 (실패) |
| E | `_ParticleService:PlayBasicParticle(…, **nil**, …)` | 0 (실패 — 동일 규칙) |

**결론**: instigator nil = 클라 생성 조용한 실패. RUID·옵션·정렬·서비스 종류 전부 무관. `SpawnByModelId` parent nil 금지(핵심 규칙 4)와 동계열 함정 → **handoff §1.2 규칙 12로 명문화**.

## 4. 수행한 검증과 결과

- **refresh 빌드**: **Error=0** / Warning=25 / Info=502 (total 527).
- **런타임(수정 후 Play — 실제 시전 경로 `ServerRequestCastSkill` 직접 호출)**:
  - `[T71][FX] variant=full serial=1 ruid=522793ce…` (파워 스트라이크)
  - `[T71][FX] variant=full serial=2 ruid=86500681…` (대시)
  - `[T70][CAST] play action=swingO2` (시전 모션 — T70 경로 정상)
  - **variant=full 성공** = SortingLayer(MapLayer5)+IgnoreMapLayerCheck 적용 상태로 생성 → 타일 위 렌더.
- **보류**: 이펙트 색감·타이밍·원작 감각의 육안 평가(제작자). 필요시 `EffectRUID`/`EffectScale`/`EffectOffset` CSV 튜닝만으로 조정 가능.

## 5. 발견한 문제 / 후속 제안

- `Monster.mlua` 227행 피격 이펙트·`Projectile` 명중 이펙트도 같은 메서드로 수렴 — 자동으로 함께 수정됨.
- T70의 폴백 체인은 유지(무해·진단 가치). 안정 확인 후 단순화(variant=full 단일) 후속 가능.
- 파워 스트라이크 클립(80003316)의 태그가 빛/버프 계열 — 원작 감각과 다르면 클립 교체는 CSV `EffectRUID`만 수정(지휘자 재선정 가능).

## 6. 제작자 런타임 체크리스트

- [ ] 4스킬 시전 시 이펙트 육안 표시 (캐릭터 위 타일 가림 없음)
- [ ] 시전 모션 재생 (파워 스트라이크/매직 클로/슬래시 블러스트 — dash는 모션 없음이 정상)
- [ ] 몬스터 피격 이펙트 표시
- [ ] 이펙트 감각(클립 선택·크기·오프셋) 불만 시 슬롯 지목 → CSV 튜닝

## 7. 이력

- 2026-07-18 최초 작성 (지휘자 직접)
