# 게임 물리 및 기본 조작키 (Physics & Controls)

> 이 문서는 [AGENTS.md](../../AGENTS.md)의 온디맨드 세부 가이드입니다. 물리/조작/맵 모드 관련 작업 시작 전 로드하십시오.

* **맵 기본 설정**: 맵 [map01.map](../../map/map01.map)은 `TileMapMode = 1` (RectTileMap, 탑다운 격자형 맵)으로 구성되어 있습니다.
* **물리 컴포넌트**: 모든 동적 엔티티(플레이어, 몬스터 등)는 중력이 없는 **`KinematicbodyComponent`**를 바디 컴포넌트로 사용해야 합니다.
* **조작 키 기본값**:
  * **이동**: 방향키 (Arrow Keys - Left, Right, Up, Down)로 4방향 이동.
  * **점프 (비주얼 점프)**: Alt 키 (물리적 높이 변화 없는 비주얼 점프).
  * **공격 / 채광**: Ctrl 키 (바라보는 방향의 인접 셀 타격).
