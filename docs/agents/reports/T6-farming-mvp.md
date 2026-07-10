# T6 작업 보고서 — 농사 시스템 MVP (Phase 14-B)

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식의 산출물.

- **작업**: T6 농사 시스템 MVP (`docs/agents/subagent-handoff.md` §3 T6)
- **상태**: 코드 완료 | refresh 빌드 Error=0 (기존 Monster LWA-4012 Warning만 잔존) | Play 런타임 검증 보류(제작자)
- **수행 에이전트/환경**: Grok 구현 에이전트, Maker 기동·refresh 가능, Play 미수행
- **날짜**: 2026-07-10

## 1. 요약 (3~5줄)

괭이 `digHole`로 만든 흙 홀 셀(L2 홀+L1 Soil, 마스크 15)에 작물 씨앗을 가구 설치 경로로 파종하고, 서버 타이머(심은 시각 기준)로 단계 성장 후 맨손 수확하는 MVP를 구현했다. 데이터는 `CropDataSet` 중심이며 신규 작물은 CSV 행 + `Crop_<CropId>.model` 추가만으로 확장 가능. 영속화는 기존 `homeFurniture` JSON에 `plantedAt`/`isCrop`을 실어 재접속 시 경과 성장을 복원한다. Maker refresh 빌드 Error=0. Play 루프 검증은 제작자 몫.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/DataSets/CropDataSet.csv` | 신규. Carrot 행 (SeedItem/GrowthStages/StageDuration/HarvestItem/MinYield/MaxYield/StageSprites + CropId) |
| `RootDesk/MyDesk/MapObjects/DataSets/CropDataSet.userdataset` | 신규 메타 (`name=CropDataSet`) |
| `RootDesk/MyDesk/MapObjects/Scripts/Crop.mlua` | 성장 컴포넌트: PlantedAtUnix·단계 계산·스프라이트 스왑·수확 수량 |
| `RootDesk/MyDesk/MapObjects/Models/Crop_Carrot.model` | 작물 엔티티 모델 (Crop + ResourceOccupiedArea + ResourceReaction) |
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | `Carrot Seed`(furniture), `Carrot`(resource) 행 추가 |
| `RootDesk/MyDesk/item/DataSets/ShopItemDataSet.csv` | Carrot Seed 구매 10 / Carrot 판매 5 |
| `RootDesk/MyDesk/MapObjects/DataSets/ItemDropDataSet.csv` | GrownGrass → carrot_seed 5% 드롭 |
| `RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` | `ServerRequestPlace`: CropDataSet 파종 + 마스크 15 홀 셀 검증 + Crop 스폰 |
| `RootDesk/MyDesk/MapObjects/Scripts/ResourceSpawner.mlua` | 가구 JSON에 plantedAt/isCrop; Reconstruct 시 Crop 복원 |
| `RootDesk/MyDesk/MapObjects/Scripts/TileDurabilityManager.mlua` | 미성숙 거부 / 성숙 1타 맨손 수확·드롭 |
| `docs/agents/subagent-handoff.md` | T6 상태 갱신 |

## 3. 구현 상세

스펙 Change ①~⑥ 대비:

1. **CropDataSet** — `CropId,SeedItem,GrowthStages,StageDuration,HarvestItem,MinYield,MaxYield,StageSprites`. 작물 판정은 `FindRow("SeedItem", …)` 만 사용 (이름 분기 없음). `StageSprites`/`CropId`는 단계 비주얼·모델 해석용 데이터 컬럼(하드코딩 대체).
2. **파종 = 가구 설치 경로** — 씨앗 `Category=furniture`. 설치 시 `GetCellMask(...) == 15` 필수. 잔디/에지/점유 셀 거부 + 피드백. 모델은 `Crop_{CropId}` (Furniture_ 아님).
3. **성장 = 서버 타이머** — `os.time()` 기준 `PlantedAtUnix`, 1초 폴링으로 단계 재계산 + Multicast 스프라이트 스왑. 낮/밤 비연동.
4. **수확** — 성숙 시 HitResource 1타·도구 불필요·Min~Max yield. 미성숙: "아직 자라지 않았습니다."
5. **영속화** — `AddPlacedFurniture` / Reconstruct가 `plantedAt`/`isCrop`을 `homeFurniture`에 저장·복원. PersistenceManager 필드 추가 불필요(기존 furniture 세이브 경로 재사용).
6. **씨앗 공급** — 상점 `Carrot Seed` + GrownGrass 드롭 5%.

**스펙 이탈**: 없음. (PersistenceManager.mlua 직접 수정 없음 — furniture JSON 확장으로 동일 목적 달성.)

**재사용**: 가구 설치 RPC, GridToEntity 점유, GetCellMask, HitResource/드롭, homeFurniture 세이브.

## 4. 수행한 검증과 결과

- **Maker `refresh`**: 성공 (`status=ok`), 2026-07-10.
- **빌드 로그 (`kind=build`)**: **Error = 0**. Warning 2건은 기존 `Monster.BossDropMin/Max` LWA-4012 (T6 무관).
- 크로스 스크립트 LIA-1114/1115 Info는 기존 패턴(동적 `GetComponent` 멤버) — Error 아님.
- **Play 런타임 검증**: **보류** (제작자 수행). 허위 동작 확인 없음.

## 5. 발견한 문제 / 후속 제안

- 단계 스프라이트·씨앗 아이콘은 placeholder RUID (풀/당근 검색 결과 재사용). 전용 아트는 CSV `StageSprites`/`IconRUID` 교체만으로 반영 가능.
- `StageDuration=15`(초) — Play 테스트 편의. 밸런스 튜닝은 CSV 셀 수정.
- 미성숙 작물 강제 제거(씨앗 회수) UX는 스펙 범위 밖 — 필요 시 후속 T.

## 6. 제작자 런타임 체크리스트

- [ ] 마을 상점에서 Carrot Seed 구매
- [ ] 영지에서 괭이(digHole)로 밭 갈기 → 흙 홀 셀 확인
- [ ] 씨앗 퀵슬롯 → Ctrl 파종 (홀 셀 성공)
- [ ] 잔디 / 길 에지 / 점유 셀 파종 거부 메시지
- [ ] 단계 스프라이트 변화 (~15s×3 = 약 45s 후 성숙)
- [ ] 미성숙 Ctrl 채집 → "아직 자라지 않았습니다."
- [ ] 성숙 맨손 수확 → Carrot 1~3 드롭, 셀 비움
- [ ] 재파종 가능
- [ ] 작물 셀 plantGrass 시도 → 점유 거부
- [ ] 재접속 후 성장 경과 반영 (plantedAt)
- [ ] logs Error 없음

## 7. 이력

- 2026-07-10 최초 작성 (Grok 구현 에이전트)
- 2026-07-11 버그픽스: 수확이 `Hit furniture`로 빠져 씨앗이 반환되던 문제. 원인=작물 판정이 `script.Crop`+`GetCropRow()`에만 의존해 실패 시 가구 철거 경로. 수정=`CropDataSet.SeedItem`로 판정, 컴포넌트 누락 시 `AddComponent`+`InitializePlant`, 성숙=`GrowthStages*StageDuration`(45s). 로그 근거: `Hit furniture: Carrot Seed (1/2)` / `Furniture demolished`.
