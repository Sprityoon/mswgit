# T34 작업 보고서 — 스폰 튜닝 데이터화 · 보물상자 컬럼화

- **작업**: T34 스폰 튜닝 데이터화 — 몬스터 틴트·야간 배율 + 보물상자 배치/드롭 컬럼화
- **상태**: 코드 완료 | Maker refresh 빌드 **Error=0** (Warning 기존 소음) | Play 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: 레인 A · Maker MCP `maker_refresh_workspace` via `scratch/mcp_call.py`
- **날짜**: 2026-07-11

## 1. 요약

몬스터 바이옴 틴트·야간 배율·보물상자 맵별 배치/스케일/틴트·드롭 소스 키를 CSV/컴포넌트 프로퍼티로 옮겼다. 하드코딩 4지점(틴트 분기 / 야간 ×2·×1.5 / 상자 좌표 테이블 / 폴백 copper ore)을 제거하고, 값은 현행과 동일 이관했다. 레인 A 말미 refresh 1회 → 빌드 Error=0.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/DataSets/BiomeDataSet.csv` | `MonsterTint` 컬럼 (#RRGGBB) desert/snowfield/rocky 이관 |
| `RootDesk/MyDesk/Monster/DataSets/SpawnTuningDataSet.csv` | 신규 Key/Value 3행(야간 Cap/Hp/Atk) |
| `RootDesk/MyDesk/Monster/DataSets/SpawnTuningDataSet.userdataset` | 신규 메타 |
| `RootDesk/MyDesk/MapObjects/DataSets/TreasureChestSpawnDataSet.csv` | 신규 hunt01~03 배치 |
| `RootDesk/MyDesk/MapObjects/DataSets/TreasureChestSpawnDataSet.userdataset` | 신규 메타 |
| `RootDesk/MyDesk/Monster/Scripts/MonsterSpawner.mlua` | 튜닝 캐시 + 틴트/야간 배율 데이터 조회 |
| `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | `ParseHexColor`/`GetBiomeMonsterTintHex` + 상자 N개 스폰 |
| `RootDesk/MyDesk/MapObjects/Scripts/TreasureChest.mlua` | `DropSourceId`·거리·개봉톤 프로퍼티, 하드 폴백 삭제 |

## 3. 구현 상세

- **①** `BiomeDataSet.MonsterTint`: desert `#FFE699`, snowfield `#B3E6FF`, rocky `#A6A6A6`, 나머지 공란. MonsterSpawner 분기 제거 → `GetBiomeMonsterTintHex` + 공용 `ParseHexColor`(ResourceSpawner 단일 정의 — 기존 미니맵에 hex 파서 없어 신규 1곳).
- **②** `SpawnTuningDataSet`: Cap×2 / Hp×1.5 / Atk×1.5. `LoadSpawnTuning` 1회 캐시, 프로퍼티 기본값은 CSV와 동일.
- **③** `TreasureChestSpawnDataSet`: hunt01(6,2)/hunt02(-6,2)/hunt03(6,3) scale=1.35 tint=`#FFD126`. 행 없으면 스폰 없음(구 폴백 (3,-1) 제거). 멱등: 기존 상자 수 ≥ 행 수면 스킵, 부족분만 추가.
- **④** `DropSourceId="TreasureChest"`, 거리 3/4·개봉 톤 프로퍼티화. copper ore 하드 폴백 삭제 — `ItemDropDataSet` Probability=1.0 행이 보장.

**스펙 이탈**: 없음. (미니맵 hex 파서 부재 → ResourceSpawner에 공용 1회 정의)

## 4. 수행한 검증과 결과

- **Maker `maker_refresh_workspace`**: `{"status":"ok"}` (T28+T34 일괄).
- **빌드 로그**: total 400 · **Error=0** · Warning=8 · Info=392.
  - 레인 A 관련 Warning: `model://slime_king` LWA-4012 BossDropMin/Max (기존 모델 프로퍼티 메타 소음, 신규 아님).
  - 기타 cooking pot / treasure_chest Color LWA-4012 — 기존.
- **정적 grep**: MonsterSpawner 바이옴 틴트 분기 0, 야간 리터럴 `* 2`/`* 1.5` 0(캐시 기본값 제외), Treasure 좌표 테이블 0, copper ore 폴백 0.
- **Play 런타임 검증 보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 없음. (신규 데이터셋은 Maker refresh로 등록 확인됨 — 빌드 Error=0.)

## 6. 제작자 런타임 체크리스트

- [ ] 낮/밤 전환 시 몬스터 수 캡·HP·ATK 배율이 기존과 체감 동일
- [ ] desert/snowfield/rocky 몬스터 틴트 색 유지, earth_field 등 무틴트
- [ ] hunt01~03 보물상자 위치·금색·스케일 1.35 유지
- [ ] 상자 개봉 시 copper ore 등 ItemDrop 최소 1종 (Probability=1.0)
- [ ] CSV 행 추가만으로 상자 맵/좌표 확장 가능(선택 스모크)

## 7. 이력

- 2026-07-11 최초 작성 (레인 A)
