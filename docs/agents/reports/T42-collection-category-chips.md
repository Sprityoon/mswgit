# T42 작업 보고서 — 도감 아이템 탭 카테고리 칩 필터

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식의 산출물.

- **작업**: T42 도감 아이템 탭 카테고리 분류 — 칩 필터 행 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker 기동, refresh 수행
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

T22 도감 아이템 탭의 평면 리스트 탐색 문제를 해결하기 위해, 제작창(T26) CategoryBar 패턴을 그대로 재사용해 카테고리 칩 행을 추가했다. 칩 목록은 `item_dataset.Category` 고유값에서 파생(`all` + resource/tool/furniture/consumable)하며 코드 하드코딩 0. 몬스터/업적 탭에서는 칩 행을 숨긴다. Maker refresh **Error=0** (total 447 / Warning 13 / Info 434). Play 런타임 검증 보류(제작자 수행).

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `ui/PopupGroup.ui` | `CollectionPopup/CategoryBar`+`Bg`+`ChipTemplate` 신설(UIBuilder). `ListScroll` y=-70·h=460으로 칩 행 여유 확보 |
| `RootDesk/MyDesk/UI/Scripts/UICollectionController.mlua` | 카테고리 옵션 파생·칩 복제/하이라이트·탭별 바 가시성·`BuildItems` 필터 |

## 3. 구현 상세

- **Change ①**: `CollectionPopup`에 `CategoryBar`(top y=-148, 880×44) + 서페이스 Bg + `ChipTemplate`(제작창과 동일 RUID `4fea64a3…`·idle 색). UIBuilder 경유, 직접 JSON 편집 없음.
- **Change ②**: `RebuildFilterOptions` — `item_dataset` 행 순회, `Category` 고유값 수집. 첫 항 `"all"` + CSV 파생. 라벨은 T26 미러로 옵션 값 그대로 표시.
- **Change ③**: 칩 클릭 → `SelectCategoryIndex` → `RebuildList`/`BuildItems`에서 `catFilter=="all" or Category 일치`만 행 추가. 실루엣/카운트 `AddRow` 로직 무변경.
- **Change ④**: `UpdateCategoryBarVisibility` — `currentTab=="item"`일 때만 `CategoryBar.Enable=true` 및 칩 빌드, 그 외 탭은 숨김+칩 정리.
- **Change ⑤**: `IsCurrency` 필터 추가 없음 — T22 현행 유지.
- **스펙 편차**: 없음. (표시 라벨은 스펙의 "전체" 한글 대신 T26 미러 `"all"` — Acceptance "라벨 처리 방식 미러" 우선.)
- **재사용**: T26 `UICraftingController` 칩 복제·하이라이트 토큰(골드/서페이스). 신규 스타일 발명 0.

## 4. 수행한 검증과 결과

- **UIBuilder write**: `ui_lint` Error 0 (기존 Warning 78 유지 — 프로젝트 전역 소음).
- **Maker `maker_refresh_workspace`**: status=ok (2회 — UI 패치 후 재refresh).
- **Build logs (`kind=build`)**: **Error=0** / Warning=13 / Info=434 / total=447.
- **Play 런타임 검증**: **보류(제작자 수행)** — 범위 밖.

## 5. 발견한 문제 / 후속 제안

- 없음. (칩 라벨을 한글 "전체"로 바꿀 필요는 제작자 취향 — 원하면 CSV 라벨 컬럼 없이 1줄 매핑 티켓 가능.)

## 6. 제작자 런타임 체크리스트

- [ ] J로 도감 열기 → 아이템 탭 상단에 `all` / `resource` / `tool` / `furniture` / `consumable` 칩 노출
- [ ] `all` 선택 시 전체 아이템 행(현행과 동일 실루엣·카운트)
- [ ] 각 카테고리 칩 클릭 시 해당 Category 행만 표시
- [ ] 몬스터/업적 탭 전환 시 칩 행 숨김, 아이템 복귀 시 재노출
- [ ] 신규 카테고리 CSV 추가 시 칩 자동 생성(코드 무수정) — 가능하면 확인
- [ ] 제작창·도감 비주얼 아이덴티티 일치(골드 선택 칩)

## 7. 이력

- 2026-07-14 최초 작성 (Grok worker)

## 8. ui-aesthetics §7 자가 리뷰 루브릭

| # | Check | 결과 | 근거 |
|---|-------|------|------|
| 1 | No naked panels | PASS | CollectionPopup 기존 frame 유지. CategoryBar Bg=서페이스 스프라이트+색 (제작창 동일 RUID) |
| 2 | Header zone | PASS | 기존 Title/탭 헤더 유지, 칩 행은 탭 하 보조 필터 존 |
| 3 | Palette discipline | PASS | 기존 골드 액센트(0.94,0.66,0.19)+서페이스 idle 재사용, 순수 #000/#FFF 없음 |
| 4 | Type hierarchy | PASS | 칩 FontSize 15(캡션), 탭/타이틀 기존 계층 유지 |
| 5 | Rhythm | PASS | chipW 110 / gap 8 / startX 16 — 단위 8 배수, 제작창 동일 |
| 6 | Role & state distinction | PASS | 선택=골드bg+어두운글자+크기+2, 비선택=서페이스+디밍 (이중 채널) |
| 7 | Project consistency | PASS | CraftingPopup CategoryBar 패턴·RUID·색 토큰 미러 |
| 8 | Accent economy | PASS | 액센트는 선택 칩(및 기존 탭/Info)에만 |

**§7 총평**: 8/8 PASS
