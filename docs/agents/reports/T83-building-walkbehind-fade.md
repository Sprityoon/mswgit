# T83 작업 보고서 — 건물 walk-behind 반투명 + Y정렬

- **작업**: T83 건물 뒤 통과 시 MapObject식 반투명·깊이 정렬 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | Maker MCP 미연결 — refresh·Play 검증 보류(제작자)
- **수행 에이전트/환경**: Cursor Grok worker · Maker MCP 미연결
- **날짜**: 2026-07-23

## 1. 요약

마을 건물이 플레이어 **위**에 그려지던 문제를 MapObject와 같은 방식으로 맞춤: `MapLayer5` + Y 기반 `OrderInLayer`로 가림, 플레이어가 스프라이트에 가려지는 구간에서 `SetAlpha(0.4)`. 신규 `WalkBehindFade` 컴포넌트를 건물·구조물 11종에 모델·맵 동기 부착. 충돌 박스 수치 튜닝은 제작자 영역(미포함).

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `MapObjects/Scripts/WalkBehindFade.mlua` | **신규** — Y정렬 + 알파 오클루전 |
| `MapObjects/Models/Building_{Shop,Fountain,Well,Blacksmith}.model` | WalkBehindFade + SL=MapLayer5 |
| `MapObjects/Models/House_{MushroomA,MushroomOrange,MushroomYellow,WoodTower}.model` | 동일 |
| `MapObjects/Models/Building_ResearchLab.model` / `BulletinBoard.model` | 동일 |
| `NPC/Models/FishingRankBoard.model` | 동일 |
| `map/town.map` | 11 엔티티 WalkBehindFade + SortingLayer 패치 |

## 3. 구현 상세

1. **선례**: `ResourceReaction` Alternative D (`SetAlpha 0.4`, Trigger 박스 가림 판정) + 자원 스폰 Y-sort `(MapRadius−y)×100`.
2. **신설 이유**: 건물에 `ResourceReaction`(채집 흔들림)을 붙이면 의미 불일치 → 연출 전용 `WalkBehindFade`.
3. **범위**: 건물 8 + 연구소/게시판/랭킹보드. NPC·연못·포탈 제외(요청="건물 뒤").
4. **SortRadius**: 기본 100. 홈에 `_ResourceSpawner` 있으면 그 `MapRadius` 우선.
5. **스펙 이탈**: 없음.

## 4. 수행한 검증과 결과

- **맵 스캔**: 11엔티티 `WalkBehindFade` 존재, `SortingLayer=MapLayer5`. Merchant에 fade 없음.
- **Maker refresh**: 보류 — MCP 미연결. **신규 `.mlua`라 refresh 시 `.codeblock` 생성·Error=0 확인 필수.**
- **Play**: 보류(제작자). 로그 `[T83][WALKBEHIND] cover=true/false` 확인.

## 5. 발견한 문제 / 후속 제안

- 앞/뒤 경계가 어색하면 Trigger 박스(제작자 튜닝)와 `CoveredAlpha`/`SortRadius`만 조정.
- 플레이어 `AvatarRenderer.OrderInLayer`를 매 프레임 Y-sort하면 대형 건물 앞뒤가 더 정교해질 수 있음 — 현재는 자원과 동일하게 오브젝트 OIL > 플레이어 기본값 전제. Play 후 필요 시 후속 티켓.

## 6. 제작자 런타임 체크리스트

- [ ] Maker `refresh` 후 빌드 Error=0 (`WalkBehindFade` codeblock 생성)
- [ ] 건물 앞으로 서면 캐릭터가 건물 위에 올라간 것처럼 보이지 않음
- [ ] 지붕/뒤쪽 밴드 통과 시 건물 반투명 + 캐릭터가 뒤로 들어감
- [ ] 연구소·게시판·랭킹보드도 동일
- [ ] 나무/돌(MapObject) 반투명 회귀 0
- [ ] (선택) 반투명 농도·가림 범위 피드백

## 7. 이력

- 2026-07-23 최초 작성 (구현자)
- 2026-07-23 핫픽스: 가림 판정을 ResourceReaction식 `box.y×3`에서 **Trigger 박스 상단 북쪽 밴드만**(`CoverNorthExtent=1.2`, `CoverWidthScale=0.85`)으로 축소 — 제작자 "인식 범위 과도" 피드백.
