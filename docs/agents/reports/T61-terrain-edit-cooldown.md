# T61 작업 보고서 — 지형 편집 반응 지연 개선 (전용 쿨다운 분리)

- **작업**: T61 지형 편집 반응 지연 진단·개선 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 완료 | refresh Error=0 | 런타임 체감 확인 보류(제작자)
- **수행 에이전트/환경**: 지휘자(Claude Fable 5) 직접 수행 — ⚖️ 보스 "지형 로직 위임 금지" 지시 연장 + 2026-07-16 개선안 승인
- **날짜**: 2026-07-16

## 1. 요약

제작자 피드백 "지형 편집 반응이 약간 느림"의 원인을 정적 추적으로 특정했다: 클라 입력 게이트(`PlayerController.TryMine`)가 채집용 스윙 쿨다운 `GetEffectiveMineCooldown()`(기본 0.6s, 패시브 후 ≈0.52s)을 지형 편집에도 그대로 적용 — 연속 편집 시 셀당 ~0.5초 대기가 지배 항. `item_dataset`에 `TerrainEditCooldown` 컬럼을 신설(R3 데이터 주도)하고 게이트를 "아이템 행 선조회 → 지형 편집이면 전용 쿨다운" 순서로 재배열했다. 시범값 0.25s(Shovel/Hoe/Grass Seed). 채집·전투 쿨다운은 무변경.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `TryMine` 쿨다운 게이트를 아이템 판정 뒤로 이동 + `TerrainEditCooldown` 적용(pcall 가드, 공란=기존 폴백). MINE 스윙 상태 전이는 게이트 통과 후에만(스로틀된 입력의 모션 스팸 방지, tool 한정 — 기존 동작 보존) |
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | `TerrainEditCooldown` 컬럼 신설(24번째) — shovel/hoe/grass_seed = **0.25**, 그 외 전 행 공란 |

## 3. 구현 상세

- 게이트 순서: (기존) 쿨다운 체크 → 아이템 판정 ⟶ (변경) 아이템 판정 → 쿨다운 선택(`terrainAction`≠"" 이고 `TerrainEditCooldown`>0 이면 전용 값, 아니면 `GetEffectiveMineCooldown()`) → 체크.
- `Grass Seed`(Category=resource)도 `plantGrass` 행이라 전용 쿨다운 적용 — 단 MINE 스윙 모션은 기존처럼 tool(삽/괭이)만.
- 서버 측 게이트(자원 타격 `RequestMine`의 `ServerElapsedSeconds` 검증)는 지형 편집 경로(`ServerRequestTerrainEdit`)와 무관 — 무수정.
- 하드코딩 0: 쿨다운 값은 CSV 셀, 폴백은 기존 프로퍼티 경로.

## 4. 수행한 검증과 결과

- **mlua-diagnose(훅 자동)**: PlayerController.mlua — 에러 0 (편집 시 차단 없음).
- **Maker refresh 빌드**: **Error=0** (total 496 / Warning 1 / 나머지 Info).
- **런타임 체감**: 보류(제작자 Play — 연속 길 파기 반응 확인).

## 5. 발견한 문제 / 후속 제안

- 0.25s가 과하게 빠르면 CSV 셀만 올리면 됨(0.3~0.35 권장 범위). 도구 티어별 차등(구리/철 삽 추가 시)도 행 값으로 자연 확장.

## 6. 제작자 런타임 체크리스트

- [ ] 삽으로 연속 길 파기 — 셀당 반응이 기존 대비 확연히 빨라짐(~0.25s 간격)
- [ ] 괭이 홀 파기·씨앗 되심기 동일
- [ ] 곡괭이 채집(돌/나무 타격) 쿨다운은 기존 그대로(≈0.5s)
- [ ] 스로틀된 연타 시 스윙 모션 스팸 없음
- [ ] T51 대각 타일 포함 지형 편집 결과물 회귀 0

## 7. 이력

- 2026-07-15 진단(정적 추적 — 셀당 스윙 쿨다운이 지배 항 특정)
- 2026-07-16 ⚖️ 보스 승인 → 지휘자 직접 적용 + refresh Error=0
