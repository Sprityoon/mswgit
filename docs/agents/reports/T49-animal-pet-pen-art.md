# T49 작업 보고서 — 가축·우리·펫 전용 아트 (슬라임 placeholder 교체)

- **작업**: T49 가축·우리·펫 전용 아트 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Model Work Preflight 수행, Maker refresh 수행, Play 미수행
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

T19/T23에서 슬라임·잡초·미명 아이템 아이콘으로 두었던 가축·펫·우리·관련 아이템 아트를 msw-search(resource_pack 우선)로 원작 리소스를 찾아 교체했다. 모델은 `SpriteRUID`만 ModelBuilder로 패치했고, `item_dataset.csv`는 `IconRUID`/`PreviewRUID` 셀만 갱신했다. 적합 리소스 없는 항목은 0 — 전부 매핑 완료. refresh **Error=0**. Play 육안은 제작자.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/Models/Animal_Chicken.model` | SpriteRUID → 닭 stand |
| `RootDesk/MyDesk/MapObjects/Models/Animal_Sheep.model` | SpriteRUID → 양 stand |
| `RootDesk/MyDesk/MapObjects/Models/Pet_Dog.model` | SpriteRUID → 들개 stand |
| `RootDesk/MyDesk/Furniture/Models/Furniture_AnimalPen.model` | SpriteRUID → 농장 울타리 |
| `RootDesk/MyDesk/item/Models/Item_AnimalPen.model` | SpriteRUID → 동일 울타리 |
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | 7행 IconRUID(+Pen PreviewRUID) |

**로직 컬럼·컴포넌트·스크립트 무변경** (RUID 셀/값만).

## 3. 구현 상세

### Preflight

- `msw-general/references/model.md` + `builder-protocol.md` §2 ModelBuilder 확인.
- 기존 모델 읽기: 전부 `SpriteRendererComponent.SpriteRUID`만 시각 바인딩 (ActionSheet 없음 → 신설 안 함).
- 변경 전 placeholder: 닭/개 = 슬라임 animclip `50faf654…` / 양 = 슬라임 `dc932872…` / 우리·펜 아이템 = `22e9f409…`.

### ① 월드 모델 SpriteRUID (msw-search pack → stand clip)

| 대상 | 팩 | 요소 | 신규 RUID |
|---|---|---|---|
| Animal_Chicken | `mob/9600001.img` (닭) | stand animationclip | `c1bc28ed67e54de4ba4eeb7fcd36cde3` |
| Animal_Sheep | `mob/9600003.img` (양) | stand animationclip | `bb0d2f1ec25443ce818de52cd0e5b87b` |
| Pet_Dog | `mob/9410000.img` (들개) | stand animationclip | `180fcf49fe43499198144ecb8f20cd97` |
| Furniture_AnimalPen / Item_AnimalPen | object fence (`map/obj/2023strawberryfarm.img` `obj/fence/2/0`) | sprite | `5c883e34d4eb47ddb73df95e239fe737` |

후보 검토: 병아리 NPC `npc/9000209.img`는 대체 가능했으나 가축 id `Chicken`에 맞춰 **닭** 팩 채택. 우리 전용 coop 팩은 검색 0 → 스트로베리팜 **fence** 스프라이트를 농장 우리 외형으로 채택 (임의 몬스터 대체 아님).

### ② 아이템 IconRUID

| Name | 이전 | 신규 | 근거 |
|---|---|---|---|
| Animal Pen | `22e9f409…` | `5c883e34…` (+Preview 동일) | 울타리 스프라이트 |
| Egg | `ccd08679…` | `19adf1c9e3c742aabcf6fa7a9ac4e2eb` | item 「달걀」 |
| Wool | `f0bce7f8…`(잡초) | `06ed382326af42de98f007cfd81f83ca` | item 「양털」 |
| Chicken Ticket | 슬라임 | 닭 stand (모델과 동일) | 티켓 식별=가축 외형 |
| Sheep Ticket | 슬라임 | 양 stand | 동상 |
| Egg Omelette | 달걀 대용 | `26ab1dcdcd2c463e96ce061d9e2b8b24` | 「애나표 오믈렛」 |
| Dog Whistle | 슬라임 | `abd9bdcfeb97424c847459303373070f` | 「선도부원의 호루라기」 |

### ③ placeholder 유지 항목

**없음** (검색으로 전부 적합 리소스 확보).

### 스펙 편차

- **없음** (RUID-only, 로직 무변경).
- ActionSheet 미설정: 기존 모델에 StateAnimation/ActionSheet 값이 없었고 티켓도 "있을 때만" 범위 — idle stand를 `SpriteRUID`에 animationclip으로 할당(엔진 허용, pack-first 워크플로).

## 4. 수행한 검증과 결과

- ModelBuilder re-read: 5모델 SpriteRUID 목표값 일치.
- CSV 7행 IconRUID 재확인.
- Maker `maker_refresh_workspace`: status=ok.
- Build logs: **Error=0** / Warning=17 / Info=473 / **total=490**.
- **Play 런타임·육안 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 가축/펫은 stand 클립만 바인딩 — 이동 시 모션 전환(ActionSheet move)은 별 티켓 후보(선택).
- 기존 맵에 이미 배치된 가구 인스턴스가 model 템플릿을 안 따르면 재배치 필요 가능(placeModel 인스턴스 동기화 이슈) — 제작자 Play 시 확인.
- `Item_AnimalPen`의 `itemreact.ItemName=Bed`는 본 티켓 범위 밖(로직 무변경).

## 6. 제작자 런타임 체크리스트

- [ ] 영지 우리(Animal Pen)가 슬라임/침대가 아닌 **농장 울타리** 외형
- [ ] 닭 소환 → **닭** 스프라이트 (슬라임 아님)
- [ ] 양 소환 → **양** 스프라이트
- [ ] 개 호루라기 → **들개** 외형 펫
- [ ] 인벤 아이콘: 달걀/양털/오믈렛/호루라기/티켓/우리 전용 아이콘
- [ ] 채집·산란·펫 따라다니기 등 T19/T23 기능 회귀 0

## 7. 이력

- 2026-07-14 최초 작성 (Grok worker) — RUID 전량 교체, refresh Error=0, Play 보류
