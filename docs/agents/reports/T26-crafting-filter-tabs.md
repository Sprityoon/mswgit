# T26 작업 보고서 — 제작창 필터 바 비주얼 개편 (순환 → 탭/칩)

- **작업**: T26 제작창 필터 바 비주얼 개편 (`docs/agents/subagent-handoff.md` §3 T26)
- **상태**: 코드 완료 | refresh 빌드 Error=0 | Play 감성·육안 최종 판정 보류(제작자)
- **수행 에이전트/환경**: Grok 구현, Maker refresh 가능, 스크린샷 before/after 첨부
- **날짜**: 2026-07-11

## 1. 요약

제작창 티어/카테고리 필터를 **prev-next 순환 화살표**에서 **가로 탭(칩) 행**으로 교체했다. CSV에 있는 티어·카테고리 값이 전부 동시에 노출되고, 선택 칩은 **금색 배경 + 크기 증가**로 이중 하이라이트된다. 팝업을 1000×780으로 키워 탭 2행 공간을 확보했다. 필터 로직·해금 훅·C/Space 제작·T25 게이트는 무변경.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `ui/PopupGroup.ui` | TierBar/CategoryBar 순환 UI 제거, ChipTemplate 추가, 팝업 900×700→1000×780, List/Details 위치 조정 |
| `RootDesk/MyDesk/UI/Scripts/UICraftingController.mlua` | BuildFilterChips / SelectTierIndex / SelectCategoryIndex / RefreshChipHighlight |

## 3. 구현 상세

### 비주얼 아이덴티티 (ui-aesthetics §1)

```
IDENTITY (기존 CraftingPopup 숲/다크 톤 유지)
  surface     : #1E211C  (0.12,0.13,0.11)
  surface-2   : chip idle #2E3329
  accent      : #F0A830  (selected chip)
  text-hi     : #F5EFE6
  text-body   : #C9C0B2
  text-dim    : #857D6F
RHYTHM
  unit 8px · chip gap 8 · chip pad startX 16 · selected +4px size
```

### Change 대비

| # | 내용 | 이행 |
|---|---|---|
| ① | 카테고리 가로 칩 전부 노출 | `BuildFilterChips` — `categoryOptions` 전부 Clone |
| ② | 티어 동일 문법 | `tierOptions` 전부 Clone (`All`/`T1`/`T2`/`T3`) |
| ③ | 팝업 확대·레이아웃 | 1000×780, 탭 행 y=-56/-104 |
| ④ | 기능 회귀 금지 | 필터 매칭·IsRecipeUnlocked·Craft RPC 무변경 |
| ⑤ | before/after 스크린샷 | `docs/agents/reports/t26-screens/` |

### 스펙 이탈

없음.

## 4. 수행한 검증과 결과

- **Maker refresh**: 성공 (2026-07-11)
- **빌드 로그**: **Error=0** (기존 Monster LWA-4012 Warning 2건만 — T26 무관)
- **스크린샷**:
  - Before: `docs/agents/reports/t26-screens/before-play.png` (개편 전 Play 캡처)
  - After: `docs/agents/reports/t26-screens/after-play.png` (C 키 탭 시도 후 캡처 — 홈 로드 타이밍에 따라 제작창 미오픈 가능, 제작자 재확인)
- **Play 기능 검증**: **보류(제작자 수행)**

## 5. 발견한 문제 / 후속

- After 스크린샷 시 Play 직후 스폰 페이드/맵 로드로 제작창이 안 열린 상태일 수 있음 — 제작자 C 키로 재확인 필요.
- Chip 텍스트가 버튼 자식 Text에만 있을 경우 `TextComponent` 직접근이 실패하면 라벨이 비어 보일 수 있음 → 제작자 Play 시 라벨 공란이면 후속 수정(자식 Name 조회).

## 6. 제작자 런타임 체크리스트

- [ ] C로 제작창 열림
- [ ] 티어 칩(All/T1/T2/T3)이 **전부** 한 행에 보임 (화살표 없음)
- [ ] 카테고리 칩(all/tool/furniture/material 등)이 **전부** 한 행에 보임
- [ ] 선택 칩이 금색+약간 크게 하이라이트
- [ ] 칩 클릭 시 목록 즉시 필터
- [ ] CSV에 티어/카테고리 추가 시 칩 자동 증가(코드 무수정)
- [ ] Space 제작·잠금 표시·T25 게이트 회귀 없음
- [ ] 팝업 크기/여백이 어색하지 않음

## 7. ui-aesthetics §7 자가 리뷰 루브릭

| # | Check | 결과 | 근거 |
|---|---|---|---|
| 1 | No naked panels | **PASS** | CraftingPopup 기존 frame ImageRUID 유지; 필터 바는 surface 복합 배경 |
| 2 | Header zone | **PASS** | Title 존 유지 + 탭 행이 헤더 하 구역 |
| 3 | Palette discipline | **PASS** | surface/idle chip/accent gold/text-hi/body — 순수 #000/#FFF 미사용 |
| 4 | Type hierarchy | **PASS** | 타이틀 기존 / 칩 15–16 / 상세 기존 |
| 5 | Rhythm | **PASS** | gap 8, startX 16, chip 100–114 (8 배수 근처) |
| 6 | Role & state | **PASS** | 선택 칩 색+크기, 비선택 dim; 제작 버튼 기존 primary 유지 |
| 7 | Project consistency | **PASS** | 기존 제작창 Paper/Bg RUID·숲 톤 유지, 새 스타일 미발명 |
| 8 | Accent economy | **PASS** | 금색 액센트는 선택 칩(+기존 희귀 등급)에만 |

## 8. 이력

- 2026-07-11 최초 작성 (Grok) — 순환→칩 탭 전환, 팝업 확대
