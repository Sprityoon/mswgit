# MSWPackages 카탈로그 — 프로젝트 관점 큐레이션

> 원본: [MSW-Git/MSWPackages](https://github.com/MSW-Git/MSWPackages) (공식 1st-party 프리빌트 패키지 저장소).
> 이 폴더에 **29종 전체의 README가 `<패키지명>.md`로 미러**되어 있다 — 상세(설치 절차·API 표·의존성)는 미러 원문을 읽을 것.
> **통합 여부 의사결정·Scope-First 라우팅·Integration Workflow는 벤더 `msw-packages` 스킬이 단일 소스**다. 이 문서는 그 위에 얹는 "이 프로젝트(생존/채집 게임)에서의 적합성" 레이어.

## 사용 절차 (에이전트)

1. 표준 시스템 요청 감지 → `msw-packages` 스킬 로드 (R1 프리셋 우선).
2. 후보 패키지 식별 → **GitHub fetch 대신 이 폴더의 미러 README를 먼저 Read** (오프라인·즉시).
3. 아래 적합성 노트 확인 — **이미 자체 구현이 있는 도메인은 교체 제안 금지**, 참조/부분 차용만.
4. 실제 통합 확정 시에만 원본 저장소에서 최신본 대조(msw-packages 스킬 Fetch Protocol).

## ⚠️ 벤더 카탈로그 정정

- 벤더 `msw-packages` 스킬은 "Collection / gallery / dex → `collections-package`"로 매핑하고 있으나, **`collections-package`는 도감이 아니라 자료구조(Queue/Stack/PriorityQueue/Set/LinkedList) 패키지**다. 도감(dex)은 이 프로젝트 자체 구현(T22)이 이미 있다.
- 벤더 카탈로그(20종)에 없는 9종이 존재한다: `example-behaviourtree-package`, `example-stateset-package`, `ui-resource-*` 7종 (아래 표 참조).

## 시스템 패키지 (로직 + 데이터 + UI)

| 패키지 | 한 줄 요약 | 이 프로젝트 적합성 |
|---|---|---|
| [inventory-package](inventory-package.md) | 인벤토리·장비 장착/해제·아이템 사용. `PlayerDBManager` 등 Player 컴포넌트 3종 요구 | **자체 구현 있음** (인벤토리/장비 시스템 가동 중) — 교체 금지. 장비 슬롯 확장 시 구조 참조 |
| [shop-package](shop-package.md) | `WorldShopService` 기반 상점 (구매 검증·구매 횟수 DB 저장) | **자체 상점 있음** — 참조용. 구매 횟수 제한 패턴은 차용 가치 있음 |
| [worldshop-package](worldshop-package.md) | 프리미엄(월드샵) 상점 — shop-package와 동일 코어 + GM 툴 | 미사용. 유료 재화 도입 시 재검토 |
| [ranking-basic-package](ranking-basic-package.md) | 단일 랭킹 (`SortableDataStorage`) + UI + 관리 툴 | **자체 구현 있음** (주간 낚시 리더보드 T57) — 참조용 |
| [ranking-advanced-package](ranking-advanced-package.md) | DataSet 기반 다중 랭킹·시즌 (`SortableDataStorage`+`UserDataStorage`) | 랭킹 보드 추가 확장 시 1순위 참조 |
| [quest-achievement-package](quest-achievement-package.md) | 퀘스트·업적 공통 기능. `PlayerEntityAuthorityCheck=true` 권장 | **자체 퀘스트/게시판 있음** (T20/T27) — 업적 시스템 신설 시 참조 |
| [mail-package](mail-package.md) | 우편함 (GM 발송 — 전체/특정 유저, 수신/보관) | 미구현 도메인 — **도입 후보**. 보상 지급 인프라로 유용 |
| [player-data-package](player-data-package.md) | 로딩 화면 + 킥/밴(`GlobalDataStorage`) + 저장/로드 컴포넌트 | 세이브는 자체 구현(R7 규칙) — **저장/로드 프로토콜 비교 참조** (msw-scripting `datastorage.md` §8과 동일 계열) |
| [game-event-package](game-event-package.md) | DataSet 스케줄 기반 게임 이벤트 + 유저별 이벤트 데이터 (`UserDataStorage`) + 관리 툴 | 시즌 이벤트/출석 도입 시 **도입 후보** |
| [resource-package](resource-package.md) | 재화·에너지(리필형 포함) 관리 + GM 조회/수정 | 골드/재화는 자체 구현 — 리필형(에너지) 재화 신설 시 참조 |
| [global-config-package](global-config-package.md) | `GlobalDataStorage` 전역 설정 + 런타임 관리 툴 | 밸런스 상수를 무중단 조정하고 싶을 때 **도입 후보** |
| [gm-message-package](gm-message-package.md) | 공지 메시지 (시작/종료 시각·간격·노출 시간, `GlobalDataStorage`) | 운영 공지 필요 시 도입 후보 |
| [key-binding-package](key-binding-package.md) | 키 바인딩 변경 UI(PC `P`키) + 가상 버튼 바인딩, DB 저장 | 조작키 재정의 요구 나오면 참조 (현 조작 체계: 방향키/Alt/Ctrl/F 고정) |
| [dialog-package](dialog-package.md) | 타자기식 대화 UI (`DialogLogic:StartDialog(DialogId)`) | **자체 말풍선 대화 있음** (T56) — 장문 컷신형 대화 신설 시 참조 |
| [droptable-resolver-package](droptable-resolver-package.md) | DataSet 드랍 테이블 확률 해석기 (Single/Multi Drop, groupRate·min/max 수량) | **자체 드랍 있음** (T9/T28) — 드랍 로직 리팩터링 시 데이터 스키마 참조 가치 높음 |
| [maplestory-toast-package](maplestory-toast-package.md) | 메이플 스타일 토스트 (`_MaplestoryToast:Show/...` 3 메서드) | **자체 UIToast 있음** — 참조용 |
| [command-package](command-package.md) | 플레이 중 `\` 키 커맨드 콘솔 (히스토리·자동완성) | **디버그/QA용 도입 후보** — 검증 체인 보조 도구로 유용 |

## UI·유틸 패키지

| 패키지 | 한 줄 요약 | 이 프로젝트 적합성 |
|---|---|---|
| [ui-component-package](ui-component-package.md) | 재사용 UI 컴포넌트 종합 (CompoundButton/Dropdown/NumberPad/Slider/TimePicker 등) | 복합 입력 위젯 필요 시 1순위 참조 |
| [recyclescrollview-package](recyclescrollview-package.md) | 셀 재사용 스크롤 뷰 — `GridViewComponent` 대비 깜빡임 감소, `onUpdateCell` 콜백 | 대량 리스트(도감/거래소 등) 성능 이슈 시 **도입 후보** |
| [collections-package](collections-package.md) | **자료구조** Queue/Stack/PriorityQueue/Set/LinkedList (도감 아님!) | mlua에 없는 자료구조 필요 시 즉시 차용 가능 (독립 유틸) |

## 예제 패키지

| 패키지 | 한 줄 요약 | 이 프로젝트 적합성 |
|---|---|---|
| [example-behaviourtree-package](example-behaviourtree-package.md) | BT 노드 샘플 (MoveTo/MoveToDirection 등 ActionNode·DecoratorNode + 유틸) | `msw-behaviourtree` 스킬로 BT 저작 시 노드 패턴 참조 |
| [example-stateset-package](example-stateset-package.md) | StateSet 그래프 샘플 (MoveBase/MoveToLocation/MoveToEntity/MoveToNearestTaggedEntity 등 State·Condition 엔트리) | 몬스터/NPC FSM 확장 시 상태 분해 패턴 참조 |

## UI 리소스 스타일팩 7종 (원작 월드 아트 차용)

> 공통 구조: Core UI Models(버튼/패널/아이콘/슬롯/슬라이더/틴트) + Sample UI 화면(인벤토리/상점 등). `msw-ui-system`의 스타일 템플릿(`references/templates/`)과 함께 **비주얼 아이덴티티 후보군**으로 사용. import 후 바로 사용 가능.

| 패키지 | 원작 월드 | 스타일 감 |
|---|---|---|
| [ui-resource-cardgame-package](ui-resource-cardgame-package.md) | Maple Duel | 카드게임 — 장식적, 진한 프레임 |
| [ui-resource-casualrpg-package](ui-resource-casualrpg-package.md) | MapleSoulHero | 캐주얼 RPG — 배경/장식 유닛 포함 |
| [ui-resource-casualsurvival-package](ui-resource-casualsurvival-package.md) | Durango The Lost Island | **생존물 — 이 프로젝트 장르와 최근접**, 우선 검토 |
| [ui-resource-cutecasual-package](ui-resource-cutecasual-package.md) | ChuChuBurger | 큐트 캐주얼 — 리소스/배경까지 가장 풍부 |
| [ui-resource-minimalcombat-package](ui-resource-minimalcombat-package.md) | Maple Auto Battler | 미니멀 — 아이콘/틴트만 |
| [ui-resource-simplefantasy-package](ui-resource-simplefantasy-package.md) | MapleSlash | 심플 판타지 |
| [ui-resource-supersimple-package](ui-resource-supersimple-package.md) | Getting Over It Maker | 초경량 심플 |

## 통합 시 공통 주의 (msw-packages 스킬 Pitfalls 요약 + 프로젝트 추가)

- `.modpackage`는 Maker 메타데이터 — 실제 통합은 **파일 수동 복사** (`MyDesk/<Pkg>/Core/` → `RootDesk/MyDesk/<Pkg>/`). `Sample/`은 명시 요청 없으면 복사 금지 (키 바인딩 충돌 위험 — 이 프로젝트는 Alt/Ctrl/F 사용 중).
- UUID·`EntryKey` 충돌 검사 필수, `.ui`는 UIBuilder 경유 (직접 편집 훅 차단).
- 여러 패키지가 `MyDesk/Util/`(UUIDLogic·DateTimeLogic·AdminLogic 등)을 공유 — 이미 있으면 재사용, 중복 설치 금지.
- **이 프로젝트 데이터 규칙과 충돌 주의**: 패키지 자체 아이템 키 체계는 R4(`item_dataset`의 `Name` 컬럼)와 다를 수 있다 — 인벤토리 연동 시 매핑 계층 없이 직결 금지.
