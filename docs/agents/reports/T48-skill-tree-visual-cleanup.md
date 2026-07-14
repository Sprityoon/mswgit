# T48 작업 보고서 — 스킬트리 UX 비주얼 정리 (HUD 겹침 해소 + EquipBar 재배치)

- **작업**: T48 스킬트리 UX 비주얼 정리 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 재작업 ⑥⑦ + **⑨(⑧ 대체)** 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자·지휘자 재캡처)
- **수행 에이전트/환경**: Grok worker, Maker refresh 수행, Play 미수행
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

HUD `BtnSkillTree`를 미니맵 겹침 구역에서 도감 버튼 아래 열로 이동하고, Node 4행 제거·EquipBar QWER/레벨업 분리·Hint 내부화를 반영했다. EquipBar/Bg는 stretch 제거 후 **640×132** 명시(§1.2 규칙 10). 재작업 ⑧은 BestFit 2줄 래핑으로 부분 실패 → **⑨ 세로 스택**으로 대체(Icon 상단 중앙 → Name 전폭 164×22 1줄 높이 차단 → Lv/Sub). Maker refresh **Error=0**. Play/캡처 최종 판정은 지휘자.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `ui/HUDGroup.ui` | `BtnSkillTree` ap **(−74,−196)** 128×56 top-right |
| `ui/PopupGroup.ui` | Node_4 제거 · EquipBar/Bg 640×132 · **⑨ 노드 9개 Icon/NameText/LvText/SubText 세로 스택** |
| `RootDesk/MyDesk/UI/Scripts/UISkillTreeController.mlua` | `MaxRows=3` · disabledText (0.72,0.72,0.75) — **⑨에서 무수정** |

`UIHUDController.mlua` **무수정**.

## 3. 구현 상세

### 원 Change ①~⑤ (유지)

- **① HUD**: `BtnSkillTree` top-right pivot(1,1) ap **(−74,−196)** 128×56 — Collection(−74,−130) 아래 10px.
- **② 노드 3행**: `MaxRows=3`, `Node_4_*` 제거.
- **⑤ 비활성 시인성**: disabledText **(0.72, 0.72, 0.75, 1.0)**.

### 실파일 좌표 (UIBuilder 재실측 2026-07-14 재작업 시점 — 보고서 권위)

| 경로 | anchoredPosition | RectSize | 앵커 |
|---|---|---|---|
| `SkillTreePopup` | (0,0) | **920×840** | middle-center |
| `SkillTreePopup/Bg` | (0,0) | **680×760** | middle-center |
| `Title` | (0,340) | 360×44 | middle-center |
| `SPText` | (0,298) | 400×32 | middle-center |
| `BtnClose` | (310,340) | 50×50 | middle-center |
| `Node_r_c` | x **−210/0/210**, y **200/50/−100** | **172×108** | middle-center |
| `Hint` | (0,−192) | 620×24 | middle-center |
| `EquipBar` | (0,78) bottom-center | **640×132** | bottom-center |
| `EquipBar/Bg` | **(0,0)** middle-center | **640×132** | **middle-center (비-stretch)** |
| `DetailText` | (12,−10) top-left | 616×30 | top-left · Overflow=2 |
| `BtnQ/W/E/R` | (16/88/160/232, 16) | 64×40 | bottom-left · pitch 72 |
| `BtnLevelUp` | (−16,16) bottom-right | 220×40 | bottom-right |

`EquipBar/Bg` 비주얼: Color **(0.12,0.13,0.11,0.9)**, ImageRUID `4fea64a3307cda641809ad8be0d4890b`, **RaycastTarget=false**.

### 재작업 ⑥ (지휘자 발행)

- 원인: stretch(AnchorsMin≠Max)+Offset0 시 런타임이 부모로 늘리지 않고 **RectSize 100×100** 그대로 렌더 → E~R 위 다크 박스(§1.2 규칙 10).
- 조치: `SkillTreePopup/Bg/EquipBar/Bg` → **anchor middle-center · ap (0,0) · rect_size 640×132**(EquipBar와 동일). stretch 제거 확인: aMin=aMax=(0.5,0.5).

### 재작업 ⑧ (⚖️ 보스 피드백 — 노드 이름 가림) → **지휘자 캡처 부분 실패 → ⑨로 대체**

- 원인(당시): Icon top-left (8,−8) 28×28 과 NameText 겹침.
- 조치(당시, 폐기): NameText top-left (42,−8)·122×30·MiddleLeft·BestFit 12–20.
- **검수 실패**: BestFit이 축소 대신 122px 폭 **2줄 래핑** → LvText/SubText 침범.

### 재작업 ⑨ (2026-07-14 — ⑧ 대체 · 노드 세로 스택)

- 현존 **9노드**(Node_1_1~3_3; 티켓 "12개"는 4행 시절 표기, Node_4 제거 후 3×3=9). 전부 **top-center** 앵커·pivot:
  | 자식 | anchoredPosition | RectSize | Text |
  |---|---|---|---|
  | `Icon` | **(0,−4)** | **28×28** | — |
  | `NameText` | **(0,−34)** | **164×22** | Align **4** MiddleCenter · Font **16** · BestFit Min**12** Max**16** |
  | `LvText` | **(0,−58)** | **164×22** | Align 4 · Font **16** |
  | `SubText` | **(0,−82)** | **164×22** | Align 4 · Font **14** |
- 하단 여백: 노드 172×108 기준 SubText bottom −104 → 여백 **4px**.
- `UISkillTreeController` **무수정** (레이아웃만).
- UIBuilder 재실측: 9×4 자식 좌표·앵커 **45/45 PASS** (fail 0).

### 6스킬 이름 1줄 표시 (정적 검증 — Play 미수행)

| 스킬 표시명 | 글자 수 | 1줄 근거 |
|---|---|---|
| 파워 스트라이크 | 7(+공백1) | 폭 164 ≥ 약 128px@16; 높이 **22** < 12×2줄(24) → 2줄 물리 차단 |
| 매직 클로 | 4(+1) | 동상 |
| 플래시 점프 | 5(+1) | 동상 |
| 슬래시 블러스트 | 7(+1) 최장 | 동상 — 전폭 164·BestFit 12–16 |
| 신속 채집 | 4(+1) | 동상 |
| 강력 채집 | 4(+1) | 동상 |

**정적 결론**: 6스킬 이름 전부 1줄 표시·행 침범 0 (구조적으로 강제). **최종 육안 판정은 지휘자 재캡처.**

### 스펙 편차 (지휘자 사후 승인)

- 원 T48 Change ③의 EquipBar 520×120@(0,68) 등은 **이후 팝업 확대**로 실파일이 920×840 / Bg 680×760 / EquipBar 640×132@(0,78) / 노드 pitch·버튼 확대까지 반영됨.
- **확대 자체는 🧭 지휘자 사후 승인(가독성)** — 보고서-실파일 불일치 지적 해소 위해 본 §3를 실파일 좌표로 전면 갱신.

### 실측 간격 (재작업 후)

| 검사 | 실측 | 결과 |
|---|---|---|
| HUD Skill↔Minimap | Skill (−74,−196) 128×56 vs Minimap (−216,−15) 166×166 — Y 겹침 0, Skill이 아래 | PASS |
| Collection↔Skill | 수직 gap **10px** | PASS |
| Node 가로 간격 | pitch 210 − 172 = **38px** | PASS |
| Node3↔EquipBar | Node3 bottom≈−154, Equip top≈−236 → gap **≈82px** | PASS |
| EquipBar/Bg | **640×132** 비-stretch (100×100 소멸) | PASS (정적) |
| Node_4 | MISSING | PASS |
| QWER↔LevelUp | BtnR right=296, LevelUp left=404 → gap **108px** | PASS |
| NameText↔Icon (⑨) | Icon top-center (0,−4) 28×28; NameText (0,−34) 164×22 — **세로 스택, 수평 겹침 0** | PASS (정적) |
| NameText 높이 2줄 차단 | rect h=22 < 12px×2줄(24) | PASS (정적) |

## 4. 수행한 검증과 결과

- **UIBuilder write**: EquipBar/Bg + ⑨ 9노드×4자식 patch + lint warning only (기존 소음).
- **UIBuilder 재실측**: ⑨ 좌표 45/45 match; EquipBar/Bg 640×132 비-stretch 유지.
- **Maker `maker_refresh_workspace`**: status=ok (재작업 ⑨ 직후).
- **Build logs (재작업 ⑨ 직후 refresh)**: **Error=0** / Warning=17 / Info=473 / **total=490**.
- **6스킬 1줄**: 정적 PASS (표 §3) — 최종 판정 지휘자 재캡처.
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- ⑧ BestFit 2줄 함정 → ⑨ 높이 22 구조 차단으로 해소(코드 측).
- 프로젝트 전역: 다른 stretch+Offset0 자식도 RectSize 점검 후보(§1.2 규칙 10) — 본 티켓 범위 밖.

## 6. 제작자 런타임 체크리스트

- [ ] HUD `⚔ 스킬`이 도감 아래, 미니맵 비겹침
- [ ] 노드 3행, 4행 없음
- [ ] EquipBar **전체 폭 다크 밴드**(100×100 섬 박스 없음)
- [ ] QWER 좌 / 레벨업 우, DetailText 가독
- [ ] 비활성 레벨업 라벨 시인
- [ ] Hint Bg 내부
- [ ] T47 회귀: 노드=선택만 · 레벨업 버튼만 SP · HUD/K 토글
- [ ] 노드 이름 1줄 전체 표시 (파워 스트라이크·매직 클로·플래시 점프·슬래시 블러스트·신속 채집·강력 채집) · Lv/Sub 침범 0 · 아이콘 겹침 0

## 7. ui-aesthetics §7 자가 리뷰 루브릭 (실측 좌표 근거)

| # | Check | 결과 | 근거 |
|---|---|---|---|
| 1 | No naked panels | PASS | EquipBar/Bg 명시 640×132 서페이스 |
| 2 | Header zone | PASS | Title/SP/Close 유지 |
| 3 | Palette discipline | PASS | 기존 팔레트, 레벨업 초록/QWER 골드 |
| 4 | Type hierarchy | PASS | 기존 스케일 |
| 5 | Rhythm | PASS | Collection↔Skill 10; node pitch 210/150; QWER pitch 72; R↔LU 108 |
| 6 | Role & state | PASS | 장착/투자 분리 + 비활성 0.72 |
| 7 | Project consistency | PASS | HUD 칩 128×56 열 스택 |
| 8 | Accent economy | PASS | 초록=투자, 골드=장착 |

**루브릭 8/8 PASS**

## 8. 이력

- 2026-07-14 최초 작성 (Grok worker)
- 2026-07-14 재작업 ⑥⑦: EquipBar/Bg stretch→640×132 명시; §3 실파일 좌표 전면 정정; 팝업 확대 사후승인 명기; refresh Error=0 (total 490) (Grok worker)
- 2026-07-14 재작업 ⑧: NameText 9노드 top-left (42,−8) 122×30 MiddleLeft BestFit 12–20; Icon/Lv/Sub·컨트롤러 불변; refresh Error 수 §4 기재 (Grok worker)
- 2026-07-14 재작업 ⑨ (⑧ 대체): 9노드 Icon/Name/Lv/Sub top-center 세로 스택 (0,−4/−34/−58/−82)·Name 164×22 BestFit 12–16; 컨트롤러 무수정; 6스킬 1줄 정적 PASS; refresh **Error=0** (total 490 / W17 / I473) (Grok worker)
