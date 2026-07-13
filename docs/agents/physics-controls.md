# 게임 물리 및 기본 조작키 (Physics & Controls)

> 이 문서는 [AGENTS.md](../../AGENTS.md)의 온디맨드 세부 가이드입니다. 물리/조작/맵 모드 관련 작업 시작 전 로드하십시오.

## 맵 구성

모든 맵은 `TileMapMode = 1` (RectTileMap — 톱다운 격자형)입니다. 동적 엔티티(플레이어·몬스터·가축·펫)는 중력이 없는 **`KinematicbodyComponent`**를 바디로 사용합니다 (다른 Body를 붙이면 에러 없이 움직이지 않음 — `[LEA-3004]`).

| 파일 | 역할 | 비고 |
|---|---|---|
| `map/map01.map` | 영지 원본 | 런타임 인스턴스 이름 `Home_<UserId>`. 밭·설치물·타일 편집의 대상 |
| `map/town.map` | 공동 마을 | 상점·게시판·분수 낚시터. **영지·마을은 평화 원칙: 전투/피격 없음** |
| `map/template_field.map` | 사냥터 | 몬스터 스폰 |
| `map/template_boss.map` | 보스 | |

- 타일 레이어 구조(레이어 5장 + 엔티티 레이어)와 서브셀 흙 마스크 문법의 최신 단일 소스는 [subagent-handoff.md](./subagent-handoff.md) **§1.3**입니다. 블록아웃 재생성은 `node scripts/build_maps.cjs --force`(손편집 전량 덮어씀 — 사용자 확인 후 실행).

## 조작 키

| 키 | 동작 |
|---|---|
| 방향키 (←→↑↓) | 4방향 이동 |
| `Alt` | 비주얼 점프 (물리적 높이 변화 없음 — 충돌 판정 불변) |
| `Ctrl` | 공격 / 채광 / 도구 사용 (바라보는 방향의 인접 셀 타격) |
| `F` | 상호작용 (가구·NPC·게시판·낚시터·연구소·화로 등) |

Play 검증에서 입력 시뮬레이션은 `maker_keyboard_input` 도구를 사용합니다.
