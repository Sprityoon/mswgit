# T73 작업 보고서 — 마을 광장 분수대 및 우물 리스킨 및 재배치 (P0-A 파트 1)

- **작업**: T73 마을 광장 분수·우물 재배치 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker 기동(refresh만), Play 미수행
- **날짜**: 2026-07-21

## 1. 요약

B8 분수·B9 우물·(필요 시) B7 대장간 모델을 신규 작성하고 `town.map`에 스폰/상인/상점과 겹치지 않는 좌표로 배치했다. **상점(Building_Shop) 무수정**. refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Models/Building_Fountain.model` | B8 신규 |
| `RootDesk/MyDesk/MapObjects/Models/Building_Well.model` | B9 신규 |
| `RootDesk/MyDesk/MapObjects/Models/Building_Blacksmith.model` | B7 신규 |
| `map/town.map` | 3동 placeModel |

## 3. 구현 상세

| 건물 | RUID | 좌표 | 배치 근거 |
|---|---|---|---|
| Fountain | `cbdb6e1f…` | (0, 4.5) | 광장 북측 중심 — spawn/portal(≈0,−0.5) 북쪽 |
| Well | `617a24d3…` | (4.5, −4.5) | 남동 광장 가장자리 — FishingSpot(−2,−3.7)과 분리 |
| Blacksmith | `3cf6b9e9…` | (9, −1.5) | 동측 기능구역 |
| Shop | — | 무수정 | 스펙 "상점 아트 수정 불필요" |

- Building_Shop 미러(Transform+Sprite, Body 없음).
- **스펙에서 벗어난 결정**: 없음.

## 4. 수행한 검증과 결과

- **LSP**: `.mlua` 미변경.
- **Maker refresh**: status ok.
- **Build**: **Error=0** / Warning=25 / Info=502 / total=527.
- **Play 런타임 검증**: 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 분수 높이(404×560)가 광장 시야를 가릴 수 있음 — Play 피드백 시 좌표/스케일 조정.

## 6. 제작자 런타임 체크리스트

- [ ] 분수·우물·대장간이 보이고 상점 아트 변화 없음
- [ ] 스폰/포탈/상인 위치와 심하게 겹치지 않음
- [ ] 가림·통행(비충돌) 체감 OK

## 7. 이력

- 2026-07-21 최초 작성 (Cursor Grok worker)
