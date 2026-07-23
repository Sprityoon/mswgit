# T82 작업 보고서 — Trigger AABB 기반 조준 footprint 자동 정합

- **작업**: T82 상호작용 판정 개선 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | Maker MCP 미연결 — refresh·Play 검증 보류(제작자)
- **수행 에이전트/환경**: Cursor Grok worker · Maker MCP 미연결
- **날짜**: 2026-07-23

## 1. 요약

`PlayerController.IsAimTarget`에 Trigger AABB 분기를 추가했다. 대상에 유효 Trigger가 있으면 조준 셀 월드 1×1과 `GetColliderAABB` 겹침으로 F 성립을 판정하고, 없으면 기존 `AimFootprintW/H` 경로를 유지한다. T81 차단 도입 후에도 테두리 인접에서 상호작용·물가 낚시가 가능하도록 결합한다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `IsAimTarget` Trigger∩조준셀 분기 + `[T82][AIM]` 로그 |

## 3. 구현 상세

1. **분기**: `GetColliderAABB(target)` 성공 → aim cell `[x,x+1]×[y,y+1]` ∩ box (eps=0.001). 실패 → 기존 footprint.
2. **로그**: `[T82][AIM] target=<name> mode=<trigger|footprint> hit=<bool>` (F/후보 스캔 시에만 호출 — OnUpdate 아님).
3. **서버 거리 가드**: `TreasureChest`는 서버도 `IsAimTarget` 재사용(Trigger 없음 → footprint 유지). `FishingSpot`에 `ServerOpenDistance` 없음. 프로퍼티 조정 불필요.
4. **회귀**: 화로/침대/상자(Trigger 없음) → footprint. 포탈·마을 상호작용체(Trigger 있음) → trigger 모드.

## 4. 수행한 검증과 결과

- **정적 검토**: `GetColliderAABB` 재사용 확인(규칙 8). `ReadAimFootprint` 무변경.
- **Maker refresh**: 보류 — MCP 미연결.
- **Play**: 보류(제작자). 로그에서 `mode=trigger hit=true`로 연구소/연못/NPC 테두리 F 확인 권장.

## 5. 발견한 문제 / 후속 제안

- 없음(박스 튜닝은 T81 Play 피드백 소관).

## 6. 제작자 런타임 체크리스트

- [ ] Maker `refresh` 후 빌드 Error=0
- [ ] 연구소·게시판·랭킹보드·연못·상인·주민: 실물 테두리 인접 어느 방향에서든 F
- [ ] 화로/상자/침대/보물상자/포탈/동물 상호작용 회귀 0
- [ ] 낚시 캐스팅~릴링(T64) 회귀 0 / 물가 어디서든 입질 가능
- [ ] 모바일 BtnInteract 동일
- [ ] 로그 `[T82][AIM] ... mode=trigger hit=true` 확인

## 7. 이력

- 2026-07-23 최초 작성 (구현자)
