# T47 작업 보고서 — 스킬트리 UX 보강 (노드 클릭↔SP 투자 분리 + HUD 버튼)

- **작업**: T47 스킬트리 UX 보강 — 노드 클릭=선택만 / SP 투자는 [레벨업] 버튼 / HUD 스킬트리 버튼 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker 기동, refresh 수행, Play 미수행
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

노드 클릭 시 즉시 `ServerRequestSkillLevelUp` 하던 경로를 제거하고, 클릭은 선택·상세 표시만 하도록 분리했다. 상세 패널에 초록 톤 **[레벨업/해금 (SP n)]** 버튼을 신설해 SP 투자의 유일한 진입점으로 썼다. HUD에 `⚔ 스킬` 버튼을 도감 버튼 왼쪽에 배치해 K 키와 동일한 `Toggle()` 경로로 스킬트리를 연다. Maker refresh **Error=0**. Play는 제작자.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/UI/Scripts/UISkillTreeController.mlua` | OnNodeClicked=선택만 · BtnLevelUp·EvalLevelUpState · 선택 하이라이트 |
| `RootDesk/MyDesk/UI/Scripts/UIHUDController.mlua` | BtnSkillTree 클릭 → SkillTree `Toggle()` |
| `ui/PopupGroup.ui` | EquipBar 확장 + `BtnLevelUp` + Hint 문구 (UIBuilder) |
| `ui/HUDGroup.ui` | `BtnSkillTree` 신설 (UIBuilder) |

서버(`PlayerController`/`ServerRequestSkillLevelUp`) **무수정**.

## 3. 구현 상세

- **① 노드 클릭 = 선택/상세만**: `OnNodeClicked`에서 `ServerRequestSkillLevelUp` 제거. `selectedSkillId` 설정 후 `Refresh()`만. 태그 로그 `[SKILL-TREE-UX] select <id>`.
- **② [레벨업] 버튼**: EquipBar 상단 우측 `BtnLevelUp` (초록 액센트). 클릭 시 `EvalLevelUpState` 통과 후에만 `ServerRequestSkillLevelUp`. 게이트 미충족/SP 부족/MAX면 회색 비활성 톤 + 상세 사유 텍스트. 라벨 `해금 (SP n)` / `레벨업 (SP n)` / `MAX`.
- **③ HUD 스킬트리 버튼**: `/ui/HUDGroup/BtnSkillTree` — 도감 버튼 왼쪽(같은 top-right 행, 이후 버튼 좌측 확장 가능). 클릭 시 K 키와 동일 `UISkillTreeController:Toggle()`.
- **④ 회귀 금지**: 장착 QWER(골드)·해금/시전/아이콘 파이프라인 유지. Hint 문구 갱신: `노드 클릭=선택 · [레벨업]으로 해금/강화 · QWER로 장착`.
- **스펙 편차**: 없음. HUD 아이콘은 BtnCollection과 동일 칩 서페이스 RUID + 텍스트 `⚔ 스킬` (프로젝트 HUD 아이덴티티 재사용; 전용 스프라이트 검색 불필요 수준).

## 4. 수행한 검증과 결과

- **Maker `maker_refresh_workspace`**: status=ok.
- **Build logs**: **Error=0** / Warning=11 / Info=443 / total=454.
- **코드 리뷰**: `ServerRequestSkillLevelUp` 호출 지점 = `OnLevelUpClicked` 1곳만 (Grep 확인).
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 없음 (범위 내).
- 후속 후보(범위 밖): 온스크린 시전 버튼/모바일 키바인딩 → 공식 key-binding-package 검토(핸드오프 배경에 명시).

## 6. 제작자 런타임 체크리스트

- [ ] 노드를 여러 번 클릭해도 SP 변동 0 (선택 하이라이트·상세만 변경)
- [ ] [레벨업]/[해금] 버튼으로만 SP 차감·레벨 상승
- [ ] 게이트 미충족/SP 부족/MAX 시 버튼 회색 + 사유 표시, 클릭해도 투자 없음
- [ ] QWER 장착 버튼(골드)과 레벨업 버튼(초록) 시각 구분
- [ ] HUD `⚔ 스킬` 버튼으로 스킬트리 열림/닫힘
- [ ] K 키 토글이 기존과 동일하게 동작
- [ ] 해금 시 자동 장착(T45)·스킬 아이콘/이펙트(T46) 회귀 없음

## 7. 이력

- 2026-07-14 최초 작성 (Grok worker)

## 8. ui-aesthetics §7 자가 리뷰 루브릭

| # | Check | 결과 | 근거 |
|---|-------|------|------|
| 1 | No naked panels | PASS | EquipBar Bg·버튼 칩 서페이스 RUID `4fea64a3…` (기존 프로젝트 칩) |
| 2 | Header zone | PASS | 기존 SkillTree Title/SPText 유지 |
| 3 | Palette discipline | PASS | 레벨업=초록 ok 톤 / 장착=골드 액센트 / 서페이스 idle — 역할별 1톤 |
| 4 | Type hierarchy | PASS | Detail 15 / 버튼 16 / Hint 14 / HUD 22 |
| 5 | Rhythm | PASS | EquipBar 520×100, gap 단위 8 배수, QWER 56×36 pitch 64 |
| 6 | Role & state | PASS | 레벨업 활성/비활성 이중 채널(색+라벨+사유) · QWER 장착 골드 |
| 7 | Project consistency | PASS | HUD는 BtnCollection 동일 규격·칩 RUID·텍스트 버튼 패턴 |
| 8 | Accent economy | PASS | 초록=투자 액션, 골드=장착 상태만 |

**§7 총평**: 8/8 PASS
