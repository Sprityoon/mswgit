# T28 작업 보고서 — 몬스터 식별 체계 정비 · 코인 드롭 복구

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식의 산출물.

- **작업**: T28 몬스터 식별 체계 정비 — 코인 드롭 복구 + 데이터 키 정합
- **상태**: 코드 완료 | 모델·CSV 반영 | 레인 말미 refresh 빌드 **Error=0** | Play 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: 레인 A 구현 에이전트 · msw-maker-mcp 미연결(세션 시작 시 실패) · ModelBuilder(로컬 CJS) 사용
- **날짜**: 2026-07-11

## 1. 요약

몬스터 코인 드롭이 전면 침묵하던 이중 결함(스폰 이름 불일치 + `SpawnResourceDrop`에 Name `"Coin"` 전달)을 고쳤다. 안정 키 `MonsterId`(모델 id 슬러그)를 신설하고 코인/ItemDrop/Kill 조회를 전부 이 키로 통일했으며, 아이템 드롭은 `item_dataset.id`인 `"coin"`으로 지급한다. 보스 도안 행도 `slime_king` 단일 키로 통합했다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Monster/Scripts/Monster.mlua` | `MonsterId` 프로퍼티 + `GetMonsterId()` · 코인/`ItemDrop`/Kill 키 교체 · `"coin"` 지급 |
| `RootDesk/MyDesk/Monster/Scripts/MonsterSpawner.mlua` | 스폰 후 `MonsterId=modelId` · 엔티티명 `{modelId}_{biomeId}` |
| `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | `SpawnHuntBoss` 직후 `MonsterId=bossModelId` |
| `RootDesk/MyDesk/Monster/DataSets/MonsterCoinDropDataSet.csv` | 키 `MonsterName`→`MonsterId`, 값 슬러그화 |
| `RootDesk/MyDesk/MapObjects/DataSets/ItemDropDataSet.csv` | `SlimeKing`/`Boss_slime_king` → `slime_king` 단일 키(0.35/0.15) |
| `RootDesk/MyDesk/Monster/Models/Slime.model` | `MonsterId=slime` 기본값 (ModelBuilder) |
| `RootDesk/MyDesk/Monster/Models/Boar.model` | `MonsterId=boar` |
| `RootDesk/MyDesk/Monster/Models/HornMushroom.model` | `MonsterId=horn_mushroom` |
| `RootDesk/MyDesk/Monster/Models/SlimeKing.model` | `MonsterId=slime_king` |

## 3. 구현 상세

- **①** `property string MonsterId = ""` + `GetMonsterId()`(공란 시 Entity.Name 폴백). 코인 드롭 `FindRow("MonsterId", mid)`, `DropFromItemDropDataSet` SourceId, Kill `EmitToPlayer` CondArg 모두 mid 사용.
- **②** `MonsterSpawner`: 엔티티명 `chosenOpt.modelId .. "_" .. biomeId`, 스폰 직후 `mComp.MonsterId = chosenOpt.modelId`.
- **③** `SpawnHuntBoss`: 스폰 직후 `mComp.MonsterId = bossModelId`. 모델 기본값도 설정했으나 **스포너 주입이 정본**.
- **④** `MonsterCoinDropDataSet`: `slime`/`horn_mushroom`/`boar`/`slime_king` + 기존 확률·수량 유지. userdataset 메타만 있고 컬럼 스키마는 CSV 헤더 기준이라 메타 무수정.
- **⑤** ItemDrop: 중복 4행 → `slime_king` 2행(0.35/0.15).
- **⑥** `SpawnResourceDrop(..., "coin", ...)`. **`TileDurabilityManager` 수정 없음**(레인 B T29 ④ 방어 폴백 소유).

**스펙 이탈**: 없음.

## 4. 수행한 검증과 결과

- ModelBuilder 4종 write 성공(값 get 확인).
- 정적 검수: `FindRow("MonsterName"` / `"Coin"` 드롭 인자 잔존 0(Monster 축).
- **Maker refresh**: 레인 A 말미(T34 직후) 1회 일괄 — `{"status":"ok"}`, 빌드 **Error=0** / Warning=8(기존).
- **LSP `mlua-diagnose`**: 세션에 전용 MCP 도구 없음 — 미실행(보류).
- **Play 런타임 검증 보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 없음(T34가 동일 레인에서 스폰 튜닝 하드코딩을 이어서 처리).

## 6. 제작자 런타임 체크리스트

- [ ] 사냥터에서 slime/boar/horn_mushroom 처치 시 코인 드롭·픽업(확률 대략 CSV 수준)
- [ ] 보스(slime_king) 처치 시 코인 10~20 + 도안 드롭(0.35/0.15) 회귀 없음
- [ ] 로그에 `[MONSTER] Dropped N Coins from slime|boar|horn_mushroom|slime_king` 및 ItemDrop `from slime_king`
- [ ] 몬스터 종류·확률·수량이 CSV만으로 튜닝 가능 확인(선택)

## 7. 이력

- 2026-07-11 최초 작성 (레인 A)
