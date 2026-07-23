# docs/wiki — 외부 공식 자료 로컬 위키

> 에이전트가 네트워크 왕복 없이 즉시 참조할 수 있도록 **MSW 공식 저장소 자료를 미러 + 큐레이션**해 둔 곳.
> 로드 규약: 각 하위 폴더의 **`INDEX.md`(큐레이션)를 먼저** 읽고, 필요한 항목만 미러 원문을 이어서 읽는다.

## 구성

| 폴더 | 내용 | 원본 |
|---|---|---|
| [`mswpackages/`](mswpackages/INDEX.md) | 공식 1st-party 프리빌트 패키지 29종 — README 전량 미러 + 프로젝트 적합성 카탈로그 | [MSW-Git/MSWPackages](https://github.com/MSW-Git/MSWPackages) |
| [`roguelike-world/`](roguelike-world/INDEX.md) | 뱀서라이크 예제 월드 학습 가이드 8편(한국어판) 미러 + 우리 프로젝트 적용 포인트 | [MSW-Git/GlobalContestExamples/04.RoguelikeWorld](https://github.com/MSW-Git/GlobalContestExamples/tree/main/04.RoguelikeWorld) |

## 규칙

1. **미러 파일은 수정 금지.** 각 파일 상단 `[미러]` 헤더에 원본 경로·커밋·미러일이 박혀 있다. 내용을 보완하고 싶으면 해당 폴더의 `INDEX.md`(큐레이션 레이어)에 쓴다.
2. **신선도**: 미러는 헤더의 커밋 시점 스냅샷이다. 통합·구현 직전 최종 확인이 필요하면 `msw-packages` 스킬의 Fetch Protocol(raw.githubusercontent)로 원본 대조. 재미러는 원본 저장소 클론 → 헤더 규격 유지해 덮어쓰기.
3. **역할 분담**: 패키지 **통합 절차/의사결정 플로우**는 벤더 `msw-packages` 스킬이 담당, 이 위키는 **오프라인 상세(README 전문) + 이 프로젝트 관점의 적합성 판단**을 담당한다.
4. 에이전트 라우팅은 `msw-wiki` 프로젝트 스킬과 [docs/agents/skill-routing.md](../agents/skill-routing.md)에 연결되어 있다.
