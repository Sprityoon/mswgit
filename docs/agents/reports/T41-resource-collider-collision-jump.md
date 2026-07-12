# T41 작업 보고서 — Big Stone 등 자원/가구 충돌 정합 + 점프 순간이동 수정

- **작업**: T41 자원/가구 충돌 정합(감지=밀어내기 동일 박스) + 점프 순간이동 수정 (`docs/agents/subagent-handoff.md` §3 T41)
- **상태**: 완료 | `mlua-diagnose` errors=0/warnings=0 | Maker refresh 빌드 Error=0 | Play: 제작자 확인(구두 PASS)
- **수행 에이전트/환경**: 구현자(Claude, claude-sonnet-5), Maker 기동(MCP refresh 사용), LSP 사용 가능
- **날짜**: 2026-07-12

## 1. 요약

큐 항목 없이 제작자가 대화로 지시·검증한 충돌 버그 수정을 규칙(§5 조항 11)에 맞춰 소급 정식화한 보고서다. 증상은 "Big Stone 근처에서 점프하며 뛰어다니면 순간이동." T36(ResolveOverlaps 원-대-AABB)의 후속 결함 2건을 고쳤다. **(A)** 예방 판정(`IsObstacle`)은 얇은 Trigger 밴드로만 막는데 교정(`ResolveOverlaps`)은 훨씬 큰 `ResourceOccupiedArea` AABB로 밀어내던 **형상 불일치** → 두 레이어가 **모델에 튜닝된 TriggerComponent 박스** 하나(`GetColliderAABB`)를 공유하도록 통일. **(B)** `ResolveOverlaps`가 지면 좌표로 읽고 `transform.WorldPosition`에 직접 써서 점프 시각 오프셋을 덮어쓰던 것을 `body:SetWorldPosition`로 대칭화. 덤으로 하드코딩 이름 분기(`"GrownGrass"`/`"ItemDrop"`)를 데이터 주도 필터로 제거. refresh Error=0, 제작자 구두 PASS("잘 시행됐어").

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | 신규 `GetColliderAABB`(Trigger/PhysicsCollider 박스→월드 AABB)·`CirclePenetration`(원-AABB 침투 깊이). `IsObstacle` 재작성(넓은 후보 수집 + Collider AABB 기준 "더 깊이 파고드는 이동만 차단" + 데이터 주도 필터). `ResolveOverlaps`가 `GetColliderAABB` 사용 + `body:SetWorldPosition`로 쓰기 대칭화. `GetObstacleAABB` 제거. 공용 헬퍼 3종 `@ExecSpace("ClientOnly")` 제거. |

> 모델/데이터셋 변경 없음. `TriggerComponent`는 `ResourceReaction`의 알파 가림 연출이 쓰므로 리사이즈하지 않고 코드로 통일.

## 3. 구현 상세

- **근본 원인 A (형상 불일치)**: `IsObstacle`는 `OverlapAll(TriggerBox, r=0.3)`로 얇은 밴드에서만 차단, `ResolveOverlaps`는 `GetObstacleAABB`(=`ResourceOccupiedArea` 오프셋, Big Stone2 기준 5×3처럼 큼)로 밀어냄. 밴드가 없는 위/옆에서 접근하면 예방이 통과시키고 → 큰 박스 안으로 들어간 뒤 교정이 강하게 튕겨냄 = 순간이동.
- **근본 원인 B (좌표계/점프)**: `ResolveOverlaps`가 `body:GetWorldGroundPosition()`(지면)으로 읽고 `transform.WorldPosition`에 직접 씀. 점프 중 `transform.y=지면+시각오프셋`을 지면 기반 값으로 덮어써 수직 스냅, Kinematicbody 물리 스텝과도 충돌.
- **수정 ① `GetColliderAABB(entity, outBox)`**: `TriggerComponent`(없으면 `PhysicsColliderComponent`)의 `BoxSize`+`ColliderOffset`로 월드 AABB 계산. 이동 충돌의 단일 소스. `boolean` 반환(콜라이더 없으면 false로 스킵).
- **수정 ② `IsObstacle` 재작성**: 후보는 `OverlapQueryRadius`(2.5) 넓은 원으로 수집(얇은/오프셋 트리거를 놓치지 않기 위함), 각 차단 엔티티는 `GetColliderAABB`+`CirclePenetration`으로 판정. `CirclePenetration`은 중심이 AABB 내부면 `radius+가장 가까운 면까지 거리`를 반환해 깊이가 단조 증가 → "**현재 위치보다 더 깊이 파고드는 이동만 차단**" 비교가 가능(밀착/탈출/평행 이동 허용, 끼임·떨림 방지). `currentPos==nil`(워프 안전위치 검사)면 겹침 자체를 장애물로 취급(기존 동작 보존).
- **수정 ③ `ResolveOverlaps`**: `GetObstacleAABB`→`GetColliderAABB`로 교체(밀어내기도 Trigger 박스 기준 = 감지와 동일 형상). 보정 쓰기를 `body:SetWorldPosition(Vector2)`로 변경(바디 없을 때만 transform 폴백) — 읽기(GetWorldGroundPosition)와 대칭이라 점프 시각 오프셋 보존, 바디와 비충돌.
- **수정 ④ ExecSpace 정합**: `GetColliderAABB`/`IsBlockingOverlapEntity`/`CirclePenetration`의 `@ExecSpace("ClientOnly")` 제거. `IsObstacle`가 클라 이동뿐 아니라 **서버** `ExecuteDashSkill`(ServerOnly)에서도 호출되므로, 호출자 측 실행이 되어야 서버 대시 충돌 판정이 동작한다(순수 조회+산식이라 안전).
- **하드코딩 제거(부수 효과)**: 구 `IsObstacle`의 `entity.Name ~= "GrownGrass"`/`~= "ItemDrop"` 이름 분기를 데이터 주도 `IsBlockingOverlapEntity`(ResourceOccupiedArea.BlocksMovement / PlaceableFurniture.BlocksMovement / itemreact 제외)로 대체 — §1.2 규칙 1 정합.
- **스펙에서 벗어난 결정**: 충돌 기준을 (T36의) ResourceOccupiedArea AABB가 아니라 TriggerComponent 박스로 **제작자 지시에 따라 변경**("충돌 범위가 너무 넓다 → 원래 세팅한 위치만큼만"). 하드코딩 예외 없음.

## 4. 수행한 검증과 결과

- `mlua-diagnose`: errors=0, warnings=0 (남은 info 24건은 전부 기존부터 있던 크로스스크립트 미해결 참조 오탐 — LIA-1114류, 이번 변경과 무관).
- Maker `refresh` 빌드: **Error=0**(total 437).
- 초기(오탐지 원인 규명) 단계에서 Big Stone1/2 모델의 TriggerComponent(3×0.5 / 4.1×1)와 ResourceOccupiedArea AABB(3×2 / 5×3) 수치를 실측 대조해 형상 불일치를 특정.
- Play 런타임: 제작자 수행("플레이 검증은 내가 할게") → 구두 PASS("굿 잘 시행됐어"). 8방향 통과 불가/점프 순간이동 소거의 항목별 체크는 §6 참조.

## 5. 발견한 문제 / 후속 제안

- 없음(당 이슈 범위 내 해결). 참고: 이 수정은 T36의 후속 결함 정정이므로, T36 Play 체크리스트("8방향 통과 불가/밀착 떨림 없음")를 이 변경 기준으로 재확인하면 좋다.

## 6. 제작자 런타임 체크리스트

- [x] Big Stone1/2 등 자원/가구를 점프하며 근처 이동해도 순간이동 없음 (제작자 구두 PASS)
- [ ] 8방향+대각 통과 불가, 충돌 범위 = 모델 Trigger 박스만큼(과도하게 넓지 않음)
- [ ] 밀착 이동 시 떨림/끼임 없음
- [ ] GrownGrass·드롭 아이템은 통과
- [ ] 대시 스킬/포탈 워프 안전위치 검사 회귀 없음

## 7. 이력

- 2026-07-12 최초 작성 — 제작자 직접 지시(비큐) 작업의 소급 정식화 (구현자 Claude). 감지=밀어내기 Trigger 박스 통일 + 점프 body:SetWorldPosition + 이름 분기 제거. refresh Error=0, Play 제작자 구두 PASS.
