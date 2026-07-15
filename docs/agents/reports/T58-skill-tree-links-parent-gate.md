# T58 작업 보고서 — 스킬트리 트리 위상화 (연결선 + 연계 강화 게이트)

- **작업**: T58 스킬트리 트리 위상화 — 연결선 + 연계 강화 게이트 (`docs/agents/subagent-handoff.md` §3, `skill-tree-plan.md` §8)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker refresh 가능, Play 미수행
- **날짜**: 2026-07-15

## 1. 요약

위상 재편 없이 현행 3계열 계보를 유지한 채, (1) `ParentRequiredLevel`로 선행 강화 깊이 게이트를 서버/클라 동기화하고, (2) 노드 사이 수직 연결선 `Link_<r>_<c>`를 프리플레이스·데이터 파생 렌더하며, (3) 상세 패널에 선행 조건 줄을 추가했다. SkillId 불변·세이브 호환.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/DataSets/SkillDataSet.csv` | `ParentRequiredLevel` 컬럼 + 시범값 3 |
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `ServerRequestSkillLevelUp` 선행 게이트 확장(~15줄) |
| `RootDesk/MyDesk/UI/Scripts/UISkillTreeController.mlua` | 게이트 미러·RefreshLinks·DParent·해금 금색 |
| `ui/PopupGroup.ui` | Link_2_1/2_2/2_3/3_1/3_2/3_3 + DParent (UIBuilder) |

## 3. 구현 상세

### ① ParentRequiredLevel
- CSV 컬럼 신설. 시범값: fireball←power_strike **3**, earth_shatter←fireball **3**, mine_power←swift_gather **3**. 공란 행=폴백 1.
- 조회는 pcall + 공란 가드 (규칙 7).

### ② 서버 게이트
- `curLevel==0` 시 `levels[parentId] < ParentRequiredLevel` 거부.
- 피드백: `선행 스킬 '{Name}' Lv N 필요` (Name은 CSV 조회, 리터럴 스킬명 분기 0).

### ③ 클라 미러
- `EvalLevelUpState` / `RefreshNode` 동일 조건.
- 해금 가능 노드 배경을 금색 하이라이트로 (§8.4, 선택 ⑦ 포함).

### ④ 연결선
- 프리플레이스 `Link_2_1`…`Link_3_3` (10×28, center, 노드 칩 RUID, stretch 금지).
- `RefreshLinks`: `ParentSkillId` 파생, **같은 열·TreeRow−1** 만 Enable. 위반 시 `[SKILL-TREE]` 경고 + 미표시.
- 색: 자식 보유=금 실선 / 부모 충족=금 하이라이트 / 미충족=dim.

### ⑤ 위상 가드
- §8.3 그대로 코드 강제.

### ⑥ DParent
- SkillDetailPanel 내부, DDesc 아래 / DGate 위. 패널 280×300 유지.
- `선행: {부모 Name} Lv N (현재 M)` — 충족 금색 / 미충족 적색. 선행 없으면 숨김.

### 스펙 편차
- 없음. 노드 격자 좌표·EquipBar·T50 칩 크기 불변.

## 4. 수행한 검증과 결과

- Maker `maker_refresh_workspace` → build: **total 497 / Error=0 / Warning=17 / Info=480**.
- `preview_ui_layout.cjs ui/PopupGroup.ui` 실행 (SkillTree 엔티티 포함 출력 확인).
- Play 런타임 검증 **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 없음 (범위 내). 링크 두께/RUID 감성은 Play 후 튜닝 가능(CSV 무관, UI 스프라이트 틴트).

## 6. 제작자 런타임 체크리스트

- [ ] 스킬트리 팝업에서 전투 2링크(파워→매직 클로→슬래시) + 채집 1링크(신속→강력) = **3 연결선** 표시
- [ ] 부모 Lv 미달 시 해금 거부 + "선행 스킬 '…' Lv 3 필요" 피드백
- [ ] 부모 Lv 충족 후 해금 가능(금색 노드/링크) 전환
- [ ] 상세 패널 선행 줄 색(충족 금 / 미충족 적)
- [ ] 서버·클라 게이트 불일치 없음 (레벨업 버튼 사유 = 서버 메시지 정합)
- [ ] QWER 장착·시전·레벨업·T50 상세 패널 회귀 0
- [ ] 기존 세이브 스킬 레벨 유지(SkillId 불변)

## 7. ui-aesthetics §7 자가 리뷰 루브릭 (실측 좌표)

IDENTITY: accent 금 `#F0A830` 계열 / surface dim 노드 기존 유지 / 링크 10×28 리듬 8배수 근처.

| # | 항목 | 판정 | 실측/근거 |
|---|---|---|---|
| 1 | No naked panels | PASS | SkillDetailPanel Bg 기존 프레임 유지; 링크는 노드 칩 RUID `9bb8e4d0…` 틴트 |
| 2 | Header zone | PASS | SkillDetailPanel HeaderBar 유지 |
| 3 | Palette ≤6 + 1 accent | PASS | 노드 보유 파랑 / 해금 금 / 잠김 회색 / 링크 dim·금 — accent 금 1종 |
| 4 | Type hierarchy | PASS | DParent font 14 caption; DName 18 등 기존 계층 유지 |
| 5 | Rhythm | PASS | 노드 y 190/90/−10 (간격 100); Link y 140/40 중점; Link 10×28; DParent [20,-208] 240×22; DDesc h 72; DGate [20,-248] 240×36 |
| 6 | Role/state | PASS | 링크 3상태 색 + 노드 해금 금색 vs 잠김 dim |
| 7 | Project consistency | PASS | 기존 SkillTree 칩·금색 QWER 하이라이트와 동일 팔레트 |
| 8 | Accent economy | PASS | 금색=해금 가능/보유 링크·선행 충족 텍스트에만 |

**실측 좌표 표 (Bg 로컬, center 앵커 노드/링크)**

| 엔티티 | pos | size |
|---|---|---|
| Node_1_1 / 2_1 / 3_1 | (−230, 190/90/−10) | 76×76 |
| Node_1_3 / 2_3 | (−30, 190/90) | 76×76 |
| Link_2_1 / Link_3_1 | (−230, 140/40) | 10×28 |
| Link_2_3 | (−30, 140) | 10×28 |
| SkillDetailPanel | (170, 90) | **280×300** (불변) |
| DParent | (20, −208) | 240×22 |

## 8. 이력

- 2026-07-15 최초 작성 (Grok worker)
