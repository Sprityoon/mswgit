# T52 작업 보고서 — QWER 스킬바 모바일화 (터치 시전·이름 숨김·호버 툴팁·우하단 배치)

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식의 산출물.

- **작업**: T52 QWER 스킬바 모바일화 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자)
- **수행 에이전트/환경**: Grok 구현 에이전트 · Maker refresh 가능 · Play 범위 밖
- **날짜**: 2026-07-15

## 1. 요약 (3~5줄)

스킬 슬롯에 `ButtonComponent`를 붙여 탭/클릭 → `PlayerController.TryCastSlot` 시전 경로를 연결했다. 슬롯 상시 스킬명은 숨기고(Name Enable=false), 아이콘 공란 시 2글자 FallbackText만 표시한다. PC 호버는 `ButtonStateChangeEvent`로 HUD `SkillTooltip`(240×220, Inventory Tooltip 아이덴티티)을 띄운다. 모바일은 `_Environment:IsMobilePlatform()`으로 감지해 SkillBar를 bottom-right 우하단 엄지권으로 재배치(슬롯 88×88, pitch 100). `PlayerController` 무수정.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `ui/HUDGroup.ui` | SkillSlot1~4 ButtonComponent+RaycastTarget, Name disable, FallbackText 신설, SkillTooltip 패널 신설 |
| `RootDesk/MyDesk/UI/Scripts/UISkillBarController.mlua` | 클릭 시전, 호버 툴팁, 플랫폼 레이아웃, 이름 숨김/폴백 |

## 3. 구현 상세

- **① 슬롯 터치 시전**: UIBuilder로 SkillSlot1~4에 `ButtonComponent` 부착 + `RaycastTarget=true`. `ButtonClickEvent` → `OnSlotClicked(i)` → `pc:TryCastSlot(i)` (L1864 정의 확인). OnEndPlay에서 Disconnect.
- **② 스킬명 숨김**: `Name` 엔티티 `Enable=false` (UI+UpdateSlots 재확인). 잠김은 lockedBg+아이콘 회색조. 아이콘 공란 시 `FallbackText`에 이름 앞 2글자(UTF-8 6바이트, T50 패턴).
- **③ 호버 툴팁**: `/ui/HUDGroup/SkillTooltip` (240×220, en=false). Bg `#1F170F@0.94` + BgInner, Name/Meta/Desc. 호버=`ButtonStateChangeEvent`/`ButtonState.Hover`(T50 경로 재사용). 모바일 레이아웃에서는 호버 무시.
- **④ 모바일 위치** (실좌표, OnBeginPlay 1회):
  - 감지: `_Environment:IsMobilePlatform()` (`.d.mlua` 확인, pcall 가드)
  - SkillBar: `AlignmentOption=BottomRight`, pos **(-235, 395)**, size **400×100**
  - 슬롯 로컬 x: **-150 / -50 / 50 / 150**, size **88×88** (절대 환산 Q=-385 … R=-85 @ y=395 — 초안 일치)
  - PC: bottom-center **(0, 142)** / 슬롯 72 / x=-117,-39,39,117 유지 재적용
- **스펙 편차**: 없음. PlayerController 무수정.
- **재사용**: TryCastSlot, GetEquippedSlots/GetSkillLevel/GetEffectiveCooldown, SkillDataSet, T50 hover 패턴, Inventory Tooltip 팔레트.

## 4. 수행한 검증과 결과

- **UIBuilder write + ui_lint**: 통과(Error 0). SkillSlot PC 72px L007 경고는 PC 기본값 — 모바일 런타임 88 승격. MobileUI 75px 등은 T53 범위.
- **preview_ui_layout.cjs**: SkillTooltip 240×220 확인, SkillSlot1~4 btn 존재. (PC 정적 좌표 기준 72px 경고는 예상)
- **Maker `maker_refresh_workspace`**: 성공
- **빌드 로그**: total **492** · **Error=0** · Warning=17 · Info=475
- **Play 런타임 검증**: **보류(제작자 수행)**

## 5. 발견한 문제 / 후속 제안

- PC 정적 `.ui`의 슬롯은 72×72 — 모바일 88은 런타임만. Maker PC Play에서는 모바일 레이아웃이 적용되지 않음(정상).
- MobileUI 75px·QuickSlots 72 hit는 T53 담당.

## 6. 제작자 런타임 체크리스트

- [ ] PC: QWER 키 시전 회귀 정상
- [ ] PC: 슬롯 클릭으로 시전 (쿨다운/미해금/스태미나 거부 유지)
- [ ] PC: 슬롯에 스킬명 상시 노출 0
- [ ] PC: 호버 시 SkillTooltip(이름/타입·Lv/CD/설명) 표시, 이탈 시 소멸
- [ ] 모바일: 슬롯 탭 시전, 우하단 배치, 기존 MobileUI와 겹침 0, 슬롯 ≥88×88
- [ ] 로그 `[SKILL-BAR]` OnBeginPlay / click cast 확인

## 7. 이력

- 2026-07-15 최초 작성 (Grok worker)

## 부록: ui-aesthetics §7 자가 리뷰 루브릭

| # | 항목 | 결과 | 실측/근거 |
|---|---|---|---|
| 1 | Gray Box 회피 | PASS | Tooltip Bg 2층(surface+inner), 금색 제목 — Inventory Tooltip 미러 |
| 2 | 비주얼 아이덴티티 일관 | PASS | 기존 HUD 슬롯 톤 + Inventory 툴팁 팔레트 |
| 3 | 패널 해부 | PASS | Tooltip: Bg/BgInner/Name/Meta/Desc |
| 4 | 터치 타겟 | PASS* | *모바일 런타임 88; PC .ui 72는 의도 |
| 5 | 간격 리듬 | PASS | 모바일 pitch 100(=88+12), 바 y395 vs BtnBag y295 = 100px 이격 |
| 6 | 타이포 계층 | PASS | 제목 22 bold 금 / Meta 16 dim / Desc 18 body |
| 7 | stretch 함정 | PASS | Tooltip/Bg 명시 RectSize 240×220 (stretch 미사용) |
| 8 | 이름 상시 노출 0 | PASS | Name Enable=false, 풀네임은 툴팁만 |

**실좌표 요약**

| 요소 | PC | Mobile(런타임) |
|---|---|---|
| SkillBar | bottom-center (0,142) 420×84 | bottom-right (-235,395) 400×100 |
| Slot Q~R size | 72 | 88 |
| Slot local x | -117,-39,39,117 | -150,-50,50,150 |
| SkillTooltip | bottom-center (0,280) 240×220 en=false | 미표시(호버 없음) |
