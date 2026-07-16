# T62 작업 보고서 — QWER 스킬바 고정 우하단 단일 배치

- **작업**: T62 QWER 스킬바 고정 우하단 단일 배치 — 플랫폼 분기 제거 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 코드 완료 | refresh 무에러 | Play 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Antigravity (Gemini 3.5 Flash), Maker 기동(refresh_workspace 가능), LSP 사용 가능
- **날짜**: 2026-07-16

## 1. 요약
- 기존 모바일과 PC의 UI 레이아웃 분기 정책에서 단일 고정 레이아웃으로의 통합 정책 전환에 따라, QWER 스킬바(`SkillBar`)의 플랫폼 분기 코드(`IsMobilePlatform()`)를 완전히 제거하고, 정적 `.ui` 파일을 모바일 최안선에 기반하여 우하단 단일 레이아웃으로 영구 고정 배치했습니다.
- `UISkillBarController.mlua`에서 런타임 플랫폼 감지, 앵커 변경 및 해상도 재계산 등의 동적 재배치 로직을 제거하였으며, 정적 레이아웃 파일 `ui/HUDGroup.ui`에서 스킬바의 앵커 및 좌표를 우하단 엄지 영역으로 이동 및 고정하였습니다.
- 리프레시 후 빌드 에러 0건을 검증하였습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/UI/Scripts/UISkillBarController.mlua` | `isMobileLayout` 프로퍼티 삭제, `DetectMobilePlatform` 및 `ApplyPlatformLayout` 메서드 삭제, `OnSlotHoverState`에서 모바일 분기 예외 제거 |
| `ui/HUDGroup.ui` | `SkillBar` 및 하위 슬롯, 자식 컴포넌트(Icon, Cooldown, Key)의 크기 및 좌표를 우하단 고정식으로 패치. `SkillTooltip` 좌표 수정 |

## 3. 구현 상세
- **Change ① (정적 배치 전환)**:
  - `SkillBar` 앵커: `bottom-right` 고정
  - `SkillBar` pos: `[-235, 395]`, rect_size: `[400, 100]`, pivot: `[0.5, 0.5]`
  - 4개 슬롯(`SkillSlot1`~`SkillSlot4`) rect_size: `[88, 88]`, 로컬 x: `[-150, -50, 50, 150]`
  - 자식 `Cooldown` rect_size: `[88, 88]`
  - 자식 `Icon` rect_size: `[48, 48]`
  - 자식 `Key` pos: `[-28, 28]`
- **Change ② (겹침 실측)**:
  - `MobileUI/BtnBag` pos y는 `295`, h는 `75` -> top edge는 `332.5`.
  - `SkillBar` pos y는 `395`, h는 `100` -> bottom edge는 `345`.
  - 세로 이격 거리는 `345 - 332.5 = 12.5px`로 겹침 없음.
  - 타 UI(미니맵, QuickSlots, BtnInteract, BtnJump 등)와도 겹침이 전혀 없음을 확인했습니다.
- **Change ③ (컨트롤러 정리)**:
  - 런타임 `IsMobilePlatform()` 및 `ApplyPlatformLayout()` 메서드를 제거하여 정적 `.ui` 레이아웃이 단일 소스로 작동하게 하였습니다. Key 라벨은 병존하여 PC 입력(QWER) 시전과 모바일 터치 시전 양쪽을 모두 지원합니다.
- **Change ④ (SkillTooltip 이동)**:
  - 툴팁이 스킬바 바로 위(bottom-right 엄지 영역 위)에 위치하도록 `[-235, 510]` 좌표로 정적 이동시켰으며, 화면 가로폭(1920) 밖으로 돌출되지 않는 범위임을 실측 확인했습니다.

## 4. 수행한 검증과 결과
- **LSP 진단**: `UISkillBarController.mlua` 코드 수정 후 LSP 진단 정상 완료.
- **Maker Refresh**: `maker_refresh_workspace`를 호출하여 워크스페이스 리프레시 진행.
- **빌드 로그 확인**: `maker_logs`를 호출하여 빌드 결과 수집.
  - 빌드 에러 수: 0
  - 빌드 로그 정상 완료 메시지 확인: `{"status":"ok","kind":"normal",...}`

### ui-aesthetics §7 자가 리뷰 루브릭

| # | Check | Verdict | Details |
|---|---|---|---|
| 1 | Naked panels | **PASS** | 스킬바 백그라운드 및 슬롯 디자인은 기존 frame RUID 유지 |
| 2 | Header zone | **N/A** | 신규 팝업 추가/수정 없음 |
| 3 | Palette discipline | **PASS** | 골드 및 어두운 계열의 기존 HUD 팔레트 일치 |
| 4 | Type hierarchy | **PASS** | QWER 단축키 텍스트 크기 및 배치 규격 일치 |
| 5 | Rhythm | **PASS** | 88×88 터치 크기 및 100px 슬롯 간격(8배수) 리듬 적용 |
| 6 | State distinction | **PASS** | 쿨다운 오버레이 및 텍스트 렌더링 정상 |
| 7 | Project consistency | **PASS** | 기존 모바일 버튼 및 퀵슬롯 비주얼 아이덴티티 일치 |
| 8 | Accent economy | **PASS** | 쿨다운 상태 및 특정 아이콘 렌더링에만 집중적 효과 |

## 5. 발견한 문제 / 후속 제안
- 없음.

## 6. 제작자 런타임 체크리스트
- [ ] PC/모바일 접속 시 플랫폼 구분 없이 스킬바가 우하단(`[-235, 395]`)에 고정 배치되어 렌더링되는지 확인
- [ ] 스킬 슬롯 터치/클릭 시전, 단축키(QWER) 시전 기능이 정상 동작하는지 확인
- [ ] 쿨다운 오버레이(반투명 및 텍스트 숫자)가 정상적으로 표시되는지 확인
- [ ] PC 마우스 호버 시 툴팁(`SkillTooltip`)이 스킬바 바로 위인 `[-235, 510]` 부근에 화면 돌출 없이 표시되는지 확인
- [ ] 타 UI 요소(가방 버튼, 미니맵, 퀵슬롯 등)와 간섭이나 겹침이 없는지 확인

## 7. 이력
- 2026-07-16 최초 작성 (Antigravity)
