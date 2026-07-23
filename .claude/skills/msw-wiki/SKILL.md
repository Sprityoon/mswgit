---
name: msw-wiki
description: 이 프로젝트의 로컬 위키(docs/wiki) 안내 — MSW 공식 외부 자료의 오프라인 미러 + 프로젝트 관점 큐레이션. (1) MSWPackages 프리빌트 패키지 29종 README 전량 미러 + 적합성 카탈로그, (2) RoguelikeWorld(뱀서라이크) 공식 예제 학습 가이드 8편 미러 + 적용 포인트. 표준 시스템(우편/이벤트/커맨드 콘솔/스크롤뷰/자료구조 등) 도입 검토, 충돌 감지 방식 선택(TriggerComponent vs CollisionService), 오브젝트 풀링, 데미지 계산 구조, UI 스타일팩 후보 탐색 시 사용. 키워드 - 패키지, MSWPackages, 예제, 튜토리얼, 로그라이크, 뱀서라이크, 위키, wiki, 오브젝트 풀, CollisionService, 강화 시스템, UI 리소스팩.
---

# msw-wiki — 로컬 위키 사용 절차

`docs/wiki/`는 MSW 공식 저장소 자료를 **미러(원문 사본) + 큐레이션(INDEX)** 2층으로 보관한다. 네트워크 fetch 전에 항상 여기부터.

## 1. 무엇이 어디에

| 자료 | 큐레이션 (먼저 읽기) | 미러 원문 |
|---|---|---|
| MSWPackages 29종 (시스템/UI/유틸/예제/스타일팩 7종) | `docs/wiki/mswpackages/INDEX.md` | `docs/wiki/mswpackages/<패키지명>.md` |
| RoguelikeWorld 학습 가이드 8편 (충돌 감지 2방식·오브젝트 풀·레벨/강화·DataStorage) | `docs/wiki/roguelike-world/INDEX.md` | `docs/wiki/roguelike-world/<NN-slug>.md` |

## 2. 읽기 프로토콜

1. 해당 폴더 **INDEX.md 전문 Read** — 프로젝트 적합성 판단(자체 구현 존재 여부, 도입 후보 여부)이 여기 있다.
2. 필요한 항목의 **미러 원문 전문 Read** (Read 도구, 부분 읽기 금지).
3. 미러는 스냅샷 — 파일 상단 `[미러]` 헤더의 커밋/미러일 확인. **실제 통합 확정 직전**에만 `msw-packages` 스킬 Fetch Protocol로 원본 최신본 대조.

## 3. 벤더 스킬과의 역할 분담

- `msw-packages`(벤더) = 패키지 **의사결정 플로우·Scope-First 라우팅·Integration Workflow**의 단일 소스. 이 스킬(위키)은 그 절차의 "README fetch" 단계를 **로컬 미러 Read로 대체**하고, 프로젝트 적합성 노트를 추가한다.
- `msw-combat-system`(벤더) §1-7 충돌 히트 선택표 ↔ 위키 roguelike-world 03/04편은 같은 주제의 규범/예제 관계 — 전투 판정 설계 시 둘 다.
- `msw-scripting`(벤더) `references/datastorage.md` §8 영속화 프로토콜이 위키 07편(입문)의 상위 호환 — 실전 저장 설계는 벤더 문서 기준.

## 4. 금지

- 미러 파일 직접 수정 금지 (보완은 INDEX.md에).
- INDEX에 "자체 구현 있음"으로 표시된 도메인(인벤토리/상점/랭킹/퀘스트/도감/토스트/드랍/세이브)에 패키지 **교체 설치 제안 금지** — 참조·부분 차용만.
- 패키지 통합을 이 스킬만 읽고 진행 금지 — 통합 절차는 반드시 `msw-packages` 스킬 로드 후.
