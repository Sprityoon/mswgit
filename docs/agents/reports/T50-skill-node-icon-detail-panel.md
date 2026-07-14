# T50 작업 보고서 — 스킬트리 노드 아이콘화 + 상세 사이드 패널

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식의 산출물.

- **작업**: T50 스킬트리 노드 아이콘화 + 상세 사이드 패널 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행) | 최종 판정=지휘자 재캡처
- **수행 에이전트/환경**: Grok (worker) · Maker refresh 가능 · Play 범위 밖(지시)
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

T48 ⑧⑨ 노드 내 텍스트 배치 접근을 폐기하고, 보스 확정 방향(노드=아이콘만, 상세=우측 고정 패널)으로 SkillTreePopup을 구조 전환했다.  
9노드를 76×76 칩(Icon 48 + Lv 뱃지 + 패시브 FallbackText)으로 축소·좌측 그리드 재배치하고, `SkillDetailPanel` 280×300을 (170,90)에 신설해 Description/게이트/비용을 표시한다.  
EquipBar `DetailText`는 제거하고 역할을 패널로 이관. 컨트롤러는 클라 전용 수정만(서버 무수정). 호버 미리보기(`ButtonStateChangeEvent`) 포함.  
Maker refresh **Error=0** (total 490 / W17 / I473). Play 검증은 지시상 범위 밖.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `ui/PopupGroup.ui` | SkillTreePopup: 노드 칩화·Name/Sub 삭제·FallbackText·그리드 좌표·SkillDetailPanel·DetailText 제거 (UIBuilder) |
| `RootDesk/MyDesk/UI/Scripts/UISkillTreeController.mlua` | SetNodeVisual 아이콘화 · RefreshDetailPanel · 호버 · DetailText 제거 대응 |
| `scratch/t50_skill_detail_panel.cjs` | UIBuilder 적용 스크립트 (재현용) |

## 3. 구현 상세

### ① 노드 아이콘 칩화 (9개)

| 항목 | 스펙 | 실측 (UIBuilder.read) |
|---|---|---|
| 노드 크기 | 76×76 | 76×76 · pivot (0.5,0.5) |
| Icon | middle-center (0,4) · 48×48 | 동일 · pivot (0.5,0.5) |
| LvText | bottom-right (-4,4) · 40×18 · font 12 · `"3/5"` | 동일 · pivot (1,0) |
| NameText / SubText | 엔티티 삭제 | 9노드 전부 삭제 확인 |
| FallbackText | 44×44 font 18 · Icon 공란 시만 | 9노드 추가 · 기본 Enable=false |

4상태 배경 톤·선택 하이라이트 유지. 루트 버튼 TextComponent는 투명 처리.

### ② 그리드 좌측 재배치

| 행\열 | 1 (x−230) | 2 (x−130) | 3 (x−30) |
|---|---|---|---|
| 1 (y190) | Node_1_1 | Node_1_2 | Node_1_3 |
| 2 (y90) | Node_2_1 | Node_2_2 | Node_2_3 |
| 3 (y−10) | Node_3_1 | Node_3_2 | Node_3_3 |

pitch 100 실측 확인. stretch 0.

### ③ SkillDetailPanel

| 요소 | 스펙 | 실측 |
|---|---|---|
| Panel | (170,90) · 280×300 | 동일 · middle-center · pivot 0.5 |
| Bg | 명시 280×300 · RUID `4fea64a3…` | stretch 아님 |
| HeaderBar | 상단 골드 4px 악센트 | top-center · 280×4 |
| DIcon | 40×40 | top-left (20,−20) |
| DName | 220×24 font 18 | top-left (20,−72) |
| DTypeLv | 240×20 font 14 | (20,−104) |
| DDesc | 240×90 font 14 | (20,−132) · Description 컬럼 |
| DGate | 240×40 font 13 | (20,−230) |
| DCost | 240×20 font 14 | (20,−278) · 악센트 골드 |

미선택: `"노드를 선택하세요"` 1줄만 (DName). EquipBar `DetailText` 삭제.

### ④ 컨트롤러

- `RefreshDetailPanel(skillId)` 신설 — Name/Type·Lv/Description/게이트/SP 비용 (전부 SkillDataSet 컬럼).
- `SetNodeVisual`: Name/Sub 접근 제거 · Lv 뱃지 `"n/max"` · IconRUID 공란 시 이름 앞 2글자(UTF-8 6바이트) FallbackText.
- `OnNodeClicked` = 선택만 (T47 유지) · `OnLevelUpClicked`만 SP 투자.
- **호버 구현**: `ButtonStateChangeEvent` + `ButtonState.Hover` — 진입 시 패널 미리보기, Normal/Released 시 선택 노드 복귀. (runtime-patterns.md 호버 전용 절 없음 → ButtonComponent 이벤트 API 사용.)
- 서버/`PlayerController` 무수정.

### 스펙 편차

- 없음 (좌표·크기 티켓 고정값 준수). 패널 내부 세로 스택 패딩(20)은 티켓이 요소 크기만 명시한 구간의 배치 디테일로, 부모 (170,90)·280×300 및 자식 rect 스펙과 충돌 없음.
- DName 폭 220 (티켓 명시) — 초기 빌더 초안 240을 패치로 정정.

### 재사용

- 기존 칩 RUID `9bb8e4d0…`(노드) / `4fea64a3…`(패널 서페이스) · 팝업 팔레트(골드 악센트·텍스트 톤).
- T47 선택/레벨업/QWER 흐름.

## 4. 수행한 검증과 결과

| 검증 | 결과 |
|---|---|
| UIBuilder write + ui_lint | 통과 (프로젝트 기존 W 다수, 신규 Error 0) |
| 좌표 재읽기 | 그리드/패널/자식 전부 스펙 일치 · stretch=false |
| Maker `maker_refresh_workspace` | **Error=0** · total **490** / Warning **17** / Info **473** |
| Play 런타임 | **보류(제작자 수행)** — 지시: Play 범위 밖 |

로그 발췌: build `count=490`, `Error` 항목 0, SkillTree 관련 신규 빌드 Error 0.

## 5. 발견한 문제 / 후속 제안

- 호버는 PC 부가 — 터치 환경에서는 클릭 선택만으로 Acceptance 충족.
- 지휘자 재캡처로 ① 노드 텍스트 침범 0 ② 패널 Description 노출 ③ 패시브 폴백 육안 최종 판정 필요.
- T48 ⑨ 재시도 금지 준수(본 티켓이 대체).

## 6. 제작자 런타임 체크리스트

- [ ] 노드에 이름/부가 텍스트 침범·돌출 0 (아이콘+Lv 뱃지만)
- [ ] 노드 클릭 → 우측 패널에 이름·설명·게이트·비용 표시
- [ ] 패시브(신속 채집·강력 채집) Icon 공란 폴백 2글자 표시
- [ ] 노드 클릭만으로 SP 변동 0 · [레벨업]으로만 투자
- [ ] QWER 장착 / HUD·K 토글 회귀 0
- [ ] (선택) PC 호버 시 패널 미리보기·이탈 시 선택 복귀

## 7. ui-aesthetics §7 자가 리뷰 루브릭

| # | Check | 판정 | 근거 (실측) |
|---|---|---|---|
| 1 | No naked panels | PASS | SkillDetailPanel/Bg = RUID `4fea64a3…` + HeaderBar 골드 4px |
| 2 | Header zone | PASS | HeaderBar 상단 악센트 스트립 (기존 팝업 Title 유지) |
| 3 | Palette discipline | PASS | 기존 스킬트리 팔레트 재사용 · 악센트 골드 1 · 순수 #000/#FFF fill 0 |
| 4 | Type hierarchy | PASS | 패널 18/14/13 · 노드 Lv 12 · 타이틀 기존 유지 (≥3 tier) |
| 5 | Rhythm | PASS | 그리드 pitch 100 · 패널 pad 20 · 자식 간격 8배수 계열 · stretch 0 |
| 6 | Role & state | PASS | 노드 4색 상태 · 레벨업 초록/회 · QWER 골드 선택 · 패널 비용 골드 |
| 7 | Project consistency | PASS | EquipBar/노드 칩 RUID·톤 = T47/T48 계열 |
| 8 | Accent economy | PASS | 골드 = 선택 QWER + 패널 Header/비용 · 남용 0 |

**§7 종합: 8/8 PASS**

## 8. 이력

- 2026-07-14 최초 작성 (Grok worker) — T48 ⑧⑨ 이관 구현 · refresh Error=0
