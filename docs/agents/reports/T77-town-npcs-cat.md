# T77 작업 보고서 — 비전투 마을 NPC 및 생물 다양화 (P1)

- **작업**: T77 비전투 마을 NPC 및 생물 다양화 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker 기동(refresh만), Play 미수행
- **날짜**: 2026-07-21

## 1. 요약

N1~N4 주민을 `Villager_Elder` 미러로 작성하고, N7 고양이는 `Animal` 배회로 배치했다. 팩 `stand` clip은 msw-search `getResource`로 확보. `DialogDataSet`에 resident_a~d 대사 8행 추가. refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `NPC/Models/Villager_ResidentA~D.model` | N1~N4 |
| `MapObjects/Models/Animal_Cat.model` | N7 배회 |
| `NPC/DataSets/DialogDataSet.csv` | 대사 8행 |
| `map/town.map` | 배치 5 |

## 3. 구현 상세

| NPC | 팩 | stand | 좌표 |
|---|---|---|---|
| ResidentA | `npc/3001321.img` | `64f05aa3…` | (1.8, −1.2) |
| ResidentB | `npc/3001864.img` | `ae464027…` | (−3.2, 3.5) |
| ResidentC | `npc/3001322.img` | `fd92a3c4…` | (−10.2, 4.2) |
| ResidentD | `npc/1013322.img` | `884e0072…` | (10.5, −3.5) |
| Cat | `npc/2155111.img` | `c981d6ae…` | (2.2, −3.2) |

N5/N6는 기존 Elder/Fisher 유지. Cat은 AnimalDataSet 행 없음(배회만).

## 4. 수행한 검증과 결과

- **Maker refresh**: status ok.
- **Build**: **Error=0** / Warning=25 / Info=502 / total=527.
- **Play 런타임 검증**: 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- Cat 급여/생산은 데이터셋 행 없어 no-op.

## 6. 제작자 런타임 체크리스트

- [ ] 주민 4인 F 대화 말풍선
- [ ] 고양이 배회
- [ ] Elder/Fisher 회귀 없음

## 7. 이력

- 2026-07-21 최초 작성 (Cursor Grok worker)
