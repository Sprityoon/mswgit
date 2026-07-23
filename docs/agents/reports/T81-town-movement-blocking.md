# T81 작업 보고서 — 마을 오브젝트 통행 차단 (T36 인프라 등록)

- **작업**: T81 마을 오브젝트 통행 차단 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | Maker MCP 미연결 — refresh·Play 검증 보류(제작자)
- **수행 에이전트/환경**: Cursor Grok worker · Maker MCP 미연결
- **날짜**: 2026-07-23

## 1. 요약

마을 건물 8동·상호작용 구조물 3종·정적 NPC 7기·연못에 `TriggerComponent` + `ResourceOccupiedArea(BlocksMovement=true)`를 모델·`town.map` 양쪽에 동기화해 T36 AABB 차단 시스템에 등록했다. 지붕 상단은 walk-behind(박스 높이 = 시각 높이 − 지붕 밴드 0.5~1.5u). 포탈은 `BlocksMovement=false` 맵 명시, 고양이는 제외.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `MapObjects/Models/Building_{Shop,Fountain,Well,Blacksmith}.model` | Trigger + ResourceOccupiedArea |
| `MapObjects/Models/House_{MushroomA,MushroomOrange,MushroomYellow,WoodTower}.model` | 동일 |
| `MapObjects/Models/Building_ResearchLab.model` / `BulletinBoard.model` | 동일 |
| `NPC/Models/FishingRankBoard.model` | 동일 |
| `NPC/Models/{Merchant,Villager_Elder,Fisher,ResidentA~D}.model` | Trigger 0.8×0.8 + Occ |
| `Furniture/Models/FishingSpot_Pond.model` | Trigger 7.5×4.5 + Occ |
| `map/town.map` | 위 19 엔티티 컴포넌트 동기 + Portal `BlocksMovement=false` |

## 3. 구현 상세

1. **박스 산정**: `GetColliderAABB`가 Transform.Scale을 무시하므로 **월드 시각 크기**를 프로퍼티로 기록. 디자인 목표 폭(`artwork-spec` ~Nu)·종횡비로 visW/H → `boxH = visH − roofBand(0.5~1.5)`, `ColliderOffset.y` 하단 정렬(중심 피벗 가정). `IsPassive=true`(이벤트 불요, AABB만).
2. **연못**: 기존 2×2 → 7.5×4.5(대형 연못 스프라이트×배치 스케일 근사).
3. **NPC**: 0.8×0.8, offset y=−0.35. `Animal_Cat` 미등록.
4. **포탈**: 맵 `PlaceableFurniture.BlocksMovement=false` 명시(모델은 이미 false, 맵 필드 누락 보정).
5. **스펙 이탈**: 없음. 수치는 컴포넌트 프로퍼티(하드코딩 분기 없음).

### BoxSize 요약 (맵 동기값)

| 대상 | BoxSize | ColliderOffset.y |
|---|---|---|
| Shop | 5.85×3.12 | −0.44 |
| Fountain | 3.42×3.51 | −0.50 |
| Well | 1.53×1.20 | −0.25 |
| Blacksmith | 4.95×2.96 | −0.42 |
| House_MushroomA | 5.40×2.57 | −0.36 |
| House_MushroomOrange/Yellow | 3.42×2.89 | −0.40 |
| House_WoodTower | 1.08×1.40 | −0.25 |
| ResearchLab | 2.88×2.50 | −0.35 |
| BulletinBoard / FishingRankBoard | 1.17×1.00 | −0.25 |
| FishingSpot | 7.50×4.50 | 0 |
| NPC×7 | 0.80×0.80 | −0.35 |

## 4. 수행한 검증과 결과

- **맵 스캔**: 대상 19엔티티 Trigger+Occ 확인. Cat Trigger/Occ 없음. Portal `BlocksMovement=false`.
- **코드 근거**: `IsObstacle`/`ResolveOverlaps` → `IsBlockingOverlapEntity` + `GetColliderAABB` 공유 → 대시도 동일 차단.
- **Maker refresh**: 보류 — MCP 미연결.
- **Play**: 보류(제작자).

## 5. 발견한 문제 / 후속 제안

- 배치 Scale이 제각각(Shop×2.04, WoodTower×0.45)이라 박스와 스프라이트 육안이 어긋날 수 있음 → Play 후 수치만 재튜닝(모델/맵 프로퍼티).
- Y-sort/지붕 가림(Change ⑤)은 Play 육안 — 이상 시 별도 티켓.
- 화로/침대 등 영지 가구는 Trigger 없이 Occ만 있어 T36 AABB 차단이 약할 수 있음(범위 밖, 기존 이슈).

## 6. 제작자 런타임 체크리스트

- [ ] Maker `refresh` 후 빌드 Error=0
- [ ] 건물 8동·연구소·게시판·랭킹보드·NPC 7·연못: 본체 8방향 통과 불가
- [ ] 건물 지붕 상단 밴드 통행 가능(walk-behind)
- [ ] 포탈 통과·워프 정상 / 고양이 배회 회귀 0
- [ ] 대시로도 건물·연못 관통 불가
- [ ] (선택) 박스 과대/과소 시 대상명+방향 피드백

## 7. 이력

- 2026-07-23 최초 작성 (구현자)
