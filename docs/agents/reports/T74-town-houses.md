# T74 작업 보고서 — 주거구역 주택 5동 배치 (P0-A 파트 2)

- **작업**: T74 주거구역 주택 5동 배치 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker 기동(refresh만), Play 미수행
- **날짜**: 2026-07-21

## 1. 요약

B1~B5 주택 5종 `.model`을 작성하고 `town.map` 정원 구역(북서 골목·남서·남동)에 광장 건물과 겹치지 않게 배치했다. refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `House_MushroomA/Orange/Yellow.model` | B1~B3 |
| `House_ThatchHut.model` | B4 |
| `House_WoodTower.model` | B5 |
| `map/town.map` | 5동 placeModel |

## 3. 구현 상세

| # | 좌표 | 존 |
|---|---|---|
| B1 (−9.5, 5.2) | 북서 정원 |
| B2 (−11.2, 3.2) | 북서 |
| B3 (−7.2, 5.8) | 북서 골목 |
| B4 (−9.5, −7.8) | 남서 |
| B5 (7.5, −8.5) | 남동 스카이라인 |

원본 RUID 직결. Body 없음(Shop 미러).

## 4. 수행한 검증과 결과

- **Maker refresh**: status ok.
- **Build**: **Error=0** / Warning=25 / Info=502 / total=527.
- **Play 런타임 검증**: 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 접지선·시점 압축 미적용(원본 유지) — Play 피드백 시 후속.

## 6. 제작자 런타임 체크리스트

- [ ] 버섯집 3동 골목·초가·첨탑집이 보임
- [ ] T73 광장 건물과 심한 겹침 없음
- [ ] 가림 정상

## 7. 이력

- 2026-07-21 최초 작성 (Cursor Grok worker)
