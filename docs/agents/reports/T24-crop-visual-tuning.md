# T24 작업 보고서 — 작물 맵 비주얼 튜닝

- **작업**: T24 작물 맵 비주얼 튜닝 (`docs/agents/subagent-handoff.md` §3 T24)
- **상태**: 코드/데이터 완료 | refresh 빌드 Error=0 | Play 감성 판정 보류(제작자)
- **수행 에이전트/환경**: Grok 구현, Maker refresh 완료, Play 육안 보류
- **날짜**: 2026-07-11 (재수행)

## 1. 요약

성숙 맵 스프라이트를 **공식 가용** 잎 식물(`1f4f5c80…`, 밭에 올라온 잎 느낌)으로 교체하고, 단계 스케일을 **0.55|0.70|0.80**으로 올려 1단계 과소·3단계 아이콘풍 문제를 줄였다. 계정 UGC 업로드(`f5dcd9…`)는 Play에서 `RUID is unavailable`이 재발해 **제외**. 아이템 아이콘 `Carrot`=`ccd086…` **불변**. 재튜닝은 `CropDataSet.csv` 셀만.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/DataSets/CropDataSet.csv` | StageSprites 3단계 + StageScales 재확정 |
| `RootDesk/MyDesk/MapObjects/Models/Crop_Carrot.model` | 기본 Scale 0.55 (1단계) |
| `docs/agents/reports/t24-candidates/*.png` | 후보 썸네일 보관 |
| `docs/agents/subagent-handoff.md` | T24 상태 |

## 3. 구현 상세

### ① 성숙 스프라이트 후보 3안 (공식 maplestory, asset_kind=10000)

| 안 | RUID | 썸네일 | 설명 |
|---|---|---|---|
| **A (적용)** | `1f4f5c80fd3f48c69f4f70ce98284d08` | `t24-candidates/plant_1f4f.png` | 초록 잎 식물 — **밭 위 잎이 올라온 모습**에 가장 근접 |
| B | `73bf31ffbc7540e4b5de373403f9c6f8` | `t24-candidates/herb_73bf.png` | 허브/잎 식물 대안 |
| C | `8cd44c3befb8403c8c1237ec87184505` | `t24-candidates/carrot_8cd4.png` | 당근 아이콘풍 (수확 아이템 톤 — 맵 심기용 비권장) |

**폐기**: `f5dcd9c00b4441b396ea51ba2b0cbbd7` (계정 업로드 — Play unavailable).

### ② 최종 적용값 (`CropDataSet.csv`)

| 단계 | Sprite RUID | StageScales | 의도 |
|---|---|---|---|
| 1 | `f0bce7f800f140559f35a12a93de9c9e` (잔디/새싹) | **0.55** | 1단계 과소 보정 (구 0.2~0.4 → 상향) |
| 2 | `88789de5f22d4697813a0bbb6f027988` (GrownGrass) | **0.70** | 중간 성장 |
| 3 | **`1f4f5c80fd3f48c69f4f70ce98284d08`** (잎 식물) | **0.80** | 성숙 ~0.75 셀 목표, 아이콘과 분리 |

보스 목표 곡선(시각 ~0.4/0.6/0.75)에 맞추되, 원본 아트 여백을 고려해 수치를 **0.55|0.70|0.80**으로 역산. 제작자 육안 후 CSV만 수정.

### ③ 코드

`Crop.mlua` — `StageScales` 적용 이미 존재 → **무변경**.

### ④ 아이콘 불변

`item_dataset` Carrot `IconRUID` = `ccd086795e1e42d880d5485a422b71fe` (유지).

## 4. 수행한 검증과 결과

- 후보 썸네일 다운로드·육안 분류 완료 (`docs/agents/reports/t24-candidates/`)
- Maker `refresh`: 성공
- 빌드 로그: **Error=0** (기존 Monster LWA-4012 Warning 2건만 — T24 무관)
- **Play 런타임 검증: 보류(제작자 수행)** — 밭 위 3단계 실측 스크린샷은 제작자

## 5. 발견한 문제 / 후속

- 계정 UGC 스프라이트는 Play에서 unavailable 가능 → **공식 RUID만** 맵 성장 단계에 사용.
- 성숙 스프라이트가 “당근 잎”이 아닌 일반 잎 식물일 수 있음 — 감성 픽은 제작자(안 B/C로 CSV 1셀 교체 가능).

## 6. 제작자 런타임 체크리스트

- [ ] 파종 직후(1단계)가 너무 작지 않은지
- [ ] 2단계 중간 크기
- [ ] 3단계가 **밭 식물**처럼 보이고 unavailable 없음
- [ ] 성숙 크기가 셀 대비 과대/과소 아닌지 (CSV `StageScales` 끝값 조정)
- [ ] 인벤/상점 Carrot **아이콘 불변** (`ccd086…`)
- [ ] 다른 안 적용 시 `StageSprites` 3번째 셀만 교체해도 되는지

## 7. 이력

- 2026-07-11 최초 작성 — painter UGC 안 A
- 2026-07-11 핫픽스 — UGC unavailable → 공식 당근 아이콘 `8cd44c3…` + scale 0.35
- **2026-07-11 재수행** — 성숙을 공식 잎 식물 `1f4f5c80…`으로 교체, scales `0.55|0.70|0.80`, 후보 3안 썸네일 보관, 보고서 갱신
