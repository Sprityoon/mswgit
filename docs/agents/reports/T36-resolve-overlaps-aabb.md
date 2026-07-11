# T36 작업 보고서 — 자원/가구 통과 버그 (ResolveOverlaps 원→AABB)

- **작업**: T36 ResolveOverlaps 원 근사 → 원-대-AABB 해소 (+ 재작업)
- **상태**: 재작업 코드 완료 | Maker refresh 빌드 **Error=0** | Play 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: 버그픽스 배치 레인 1 · Maker MCP refresh
- **날짜**: 2026-07-11

## 1. 요약

1차 구현(AABB MTV)은 수식·필터 골격은 맞았으나 **후보 수집 반경이 r=0.3으로 해소 AABB보다 좁아** 침투를 놓치고, `PlaceableFurniture` 차단이 빠져 가구 통과가 남았다. 재작업으로 질의 반경 프로퍼티화(2.5)·`PlaceableFurniture.BlocksMovement`·Portal false 오버라이드를 반영했다.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `Player/Scripts/PlayerController.mlua` | AABB/MTV + `OverlapQueryRadius=2.5` 후보 수집 + PlaceableFurniture 필터 |
| `MapObjects/Scripts/ResourceOccupiedArea.mlua` | `BlocksMovement` (기본 true) |
| `MapObjects/Models/GrownGrass.model` | `BlocksMovement=false` |
| `Furniture/Scripts/PlaceableFurniture.mlua` | `BlocksMovement` (기본 true) |
| `Furniture/Models/Furniture_Portal.model` | `BlocksMovement=false` |

## 3. 구현 상세

### 1차
- 원-AABB MTV 전량 해소, ResourceSpawner 점유 산식 미러, GrownGrass false.

### 재작업 (지휘자 지시)
- **① 탐지≠해소**: `OverlapAll(CircleShape, OverlapQueryRadius=2.5)` — 차단/침투는 AABB 전담.
- **② SafePos**: hit=true일 때만 해소 후 좌표로 갱신; 넓은 질의로 AABB 내부 미감지 사각 제거.
- **③ 가구**: `PlaceableFurniture.BlocksMovement`; 포탈 모델 false.

## 4. 수행한 검증과 결과

### 1차
- refresh Error=0 (total 436)

### 재작업
- Maker refresh: `{"status":"ok"}`
- 빌드: total **440** · **Error=0** · Warning 11 · Info 429
- **Play 런타임 검증 보류(제작자 수행)**

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] Big Stone1/2 · Tree1/2 · IronNode · Stone — 8방향 통과 불가
- [ ] 화로/상자/침대 통과 불가
- [ ] GrownGrass · 드롭 통과
- [ ] 포탈 통과·워프 정상
- [ ] 밀착 이동 떨림/끼임 없음

## 7. 이력

- 2026-07-11 최초 작성 (레인 1)
- 2026-07-11 재작업: 질의 반경 2.5 + PlaceableFurniture.BlocksMovement + Portal false (Play FAIL 대응)
