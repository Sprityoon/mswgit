# 스킬트리 & 목표 해금 시스템 — 확정 설계 (2026-07-03)

> 결정 사항: **목표(퀘스트) 달성 = 해금 게이트 + SP 투자로 해금 + 스킬 레벨 1~N 강화** (풀 메이플식),
> 목표 시스템은 **공식 `quest-achievement-package` 통합**으로 구현.

---

## 1. 현재 자산 (실측)

| 있음 | 내용 |
|------|------|
| `SkillDataSet` | SkillId / Name / Cooldown / DamageMultiplier / StaminaCost / EffectRUID / Description / Type (power_strike, fireball, dash …) |
| 장착 파이프라인 | `PlayerController.EquippedSkillsJson` (Q/W/E/R 4슬롯) + `CooldownMap` + `UISkillBarController` |
| 저장 체계 | `PersistenceManager` (level/xp/stamina/인벤 등) |
| 진행도 이벤트 지점 | 몬스터 처치(Monster), 채집(PlayerController.TryMine), 제작(RecipeDataSet), 제련(Furnace) |

없는 것: 보유/레벨 상태, SP, 해금 조건 데이터, 진행도 추적, 스킬트리 UI.

---

## 2. 아키텍처

### 데이터 (하드코딩 금지 룰 준수 — 전부 CSV 행 추가로 확장)

`SkillDataSet` 컬럼 추가:

| 컬럼 | 의미 |
|------|------|
| `ParentSkillId` | 트리 선행 스킬 (빈 값 = 루트) |
| `RequiredLevel` | 캐릭터 레벨 조건 |
| `UnlockAchievementId` | **패키지 Achievement ID** — 이 업적 완료 = 해금 게이트 |
| `MaxLevel` | 스킬 최대 레벨 |
| `SPCost` | 레벨당 SP 비용 |
| `DamagePerLevel` | 레벨당 DamageMultiplier 증가량 |
| `CooldownPerLevel` | 레벨당 쿨다운 감소량 (음수) |
| `TreeRow` / `TreeCol` | 스킬트리 UI 배치 좌표 |

목표(퀘스트) 정의 = 패키지의 Achievement 데이터 (다단계·반복 지원). 처치/채집/제작/제련 훅에서 패키지 ActionEvent 발행 → ActionCondition이 카운트.

### 상태 & 저장 (소유권 분리 원칙)

| 데이터 | 저장 주체 |
|--------|-----------|
| 업적/퀘스트 진행도 | **패키지** (PlayerDBManager + 자체 DataStorage) |
| `skillLevels{skillId→level}` (0=미해금), `SP` | **기존 PersistenceManager** (필드 추가) |
| 스탯/인벤토리 등 기존 데이터 | 기존 PersistenceManager (변경 없음) |

SP 지급: `PlayerController.AddXP`의 레벨업 루프에서 `SP += n` (n도 데이터/설정값).

### 서버 검증 플로우

```
클라: RequestSkillLevelUp(skillId)
서버(@ExecSpace Server, senderUserId 검증):
  ① ParentSkillId 보유? ② RequiredLevel 충족?
  ③ UnlockAchievementId 완료? (패키지 API 조회)
  ④ SP >= SPCost? ⑤ level < MaxLevel?
  → 통과 시 skillLevels[skillId] += 1, SP -= cost, @Sync 반영
스킬 사용 시: 실효 배율 = DamageMultiplier + DamagePerLevel × (level-1)
```

### UI

- **SkillTreePopup** (PopupGroup 신규): TreeRow/Col 기반 노드 배치, 노드 4상태 —
  잠김(선행/레벨 미달) / 목표 진행 중(업적 진행도 %) / 해금 가능(SP 버튼) / 보유(Lv 표시 + 레벨업 버튼)
- SkillBar: `skillLevels`에 있는 스킬만 장착 허용 (기존 EquippedSkillsJson 유지)

---

## 3. 패키지 통합 시 주의 (README 기반)

- DefaultPlayer에 4컴포넌트 추가: PlayerDBManager / PlayerAccount / PlayerAchievement / PlayerQuest (DefaultPlayer.model 수정은 허용 영역)
- `WorldConfig`에 `PlayerEntityAuthorityCheck = true` 필요
- ActionCondition은 enum 사전 정의 + `ActionConditionData` 상속 클래스 (`Check` / `GetNextUserValue`)
- UUID/RUID 충돌 검사 후 복사, `Sample/`은 복사하지 않음 (F1~F4 디버그 키 충돌 주의)
- **저장 이중화 경계 명확화**: 패키지 저장은 업적/퀘스트만 담당하게 하고 PlayerAccount류가 스탯을 건드리지 않도록 통합 시 확인

---

## 4. 구현 페이즈

| Phase | 내용 | 완료 기준 | 상태 (2026-07-05) |
|:---:|------|-----------|------|
| S1 | 패키지 통합 (Core만) + 처치/채집/제작/제련 ActionEvent 훅 + 조건 클래스 | 업적 진행도가 플레이로 카운트됨 | ✅ **검증 완료 (2026-07-05 MCP 플레이)** — 실제 Monster.Dead() 처치 + Gather/Craft/Smelt 발행으로 업적 1001~1005 전부 카운트·게이트 통과 확인 |
| S2 | SkillDataSet 확장 + SP 지급 + 서버 해금/레벨업 + Persistence 필드 | CSV로 정의한 스킬이 조건 충족 시 SP로 해금·강화됨 | ✅ **검증 완료 (2026-07-05)** — AddXP 레벨업 4회 → SP 12 지급, 재시작 후 skillLevels/SP/업적 영속 확인 |
| S3 | SkillTreePopup UI + SkillBar 연동 | 트리에서 해금→장착→사용 전체 루프 | ✅ **검증 완료 (2026-07-05)** — K 토글·6노드 CSV 좌표 배치·보유 상태 렌더, QWER 자동 장착, Q 시전(power_strike Lv2 → 광역 28 대미지) 확인 |
| S4 | 스킬·업적 밸런싱 CSV 채우기 + 검증 | 초기 트리(예: 전투/채집 2계열 × 4~6스킬) 플레이 가능 | ✅ **검증 완료 (2026-07-05)** — 거절 케이스(레벨 게이트·SP 부족) + 6스킬 해금/강화 체인 + 패시브(MineCooldown -0.08 / MinePower +1, 실효 채집 쿨 0.52) 확인 |

패시브 스킬 지원 (S4에서 추가): `Type=Passive`는 장착/시전 불가, `PlayerController:GetPassiveBonus(stat)`가 CSV의 `PassiveStat`/`PassiveValuePerLevel`을 합산. 적용 지점: `MineCooldown`(채집 스윙 쿨다운, 클라+서버), `MinePower`(TileDurabilityManager 타격 위력, 자원 한정). 신규 패시브는 CSV 행 추가만으로 반영.

---

## 5. 맵 레이어 재구성 (결정: 타일셋 확정 후 일괄 · 2026-07-03 6단계+엔티티 레이어로 갱신)

표준 컨벤션 — 마스크→생성기 파이프라인 도입 시 적용. 렌더 우선순위는 **① SortingLayer → ② OrderInLayer → ③ Z** 이므로, 지형 타일 레이어(0~4)보다 위에 **엔티티 전용 레이어(MapLayer5)** 를 둔다:

| 엔티티 이름 | SortingLayer | 소유 | 내용 |
|------------|:---:|:---:|------|
| TerrainGround | MapLayer0 | 생성기 | 바닥 |
| TerrainShadow | MapLayer1 | 생성기 | 드롭 섀도/오버레이 |
| Terrace1 | MapLayer2 | 생성기 | 테라스 1층 |
| Terrace2 | MapLayer3 | 생성기 | 테라스 2층 |
| Terrace3 | MapLayer4 | 생성기 | 테라스 3층 (예비) |
| **(엔티티)** | **MapLayer5** | 코드/모델 | **몬스터·NPC·자원·가구·건물·드롭 전부** |
| 장식 | MapleMapLayer/스프라이트 | 사용자 | town 방식 유지 |

- 엔티티가 항상 모든 지형 위에 그려진다 — 남향 벽 테라스 문법에서는 모든 경우에 시각적으로 옳음(절벽 앞 엔티티는 벽 앞에 ✓, 위층 엔티티는 상판 위에 ✓, "지형 뒤 숨김"은 화면상 겹침이 발생하지 않음). 테라스 4층이 필요해지면 MapLayer5를 타일과 공유 — 같은 레이어 안에선 타일(OrderInLayer 1) < 엔티티(2~4)라 안전.
- 같은 레이어 내 엔티티 간 앞뒤는 OrderInLayer → Z 순. 겹침이 어색해 보이면 그때 y-sort 검토(현재 불필요).

### 엔티티 SortingLayer 조정 (재구성 배치에 포함)

현황 실측: 몬스터/NPC 모델 5종 = MapLayer0, 런타임 스폰 스프라이트(자원·설치 가구·스포너 몬스터) = `"MapLayer2"` 하드코딩 8곳(4개 스크립트), 플레이어 아바타 = 오버라이드 없음. 상위 레이어에 타일이 칠해지면 SortingLayer 1순위 규칙 때문에 엔티티가 위치 무관하게 타일 아래로 깔린다 → 조정 필수.

1. 하드코딩 8곳 → 공용 @Logic 상수(`_RenderLayers.EntityLayer` = "MapLayer5")로 일원화 — ✅ **완료 (2026-07-03)**: `Util/RenderLayers.mlua` 신설, 스크립트 4종 8곳 교체. 상수값은 2026-07-05 배치에서 `"MapLayer5"`로 플립 완료.
2. 런타임 스폰 시 `OrderInLayer` 명시(≥2) — ✅ **완료**: y-sort 공식 7곳을 `math.max(_RenderLayers.MinEntityOrder, …)`로 클램프 (맵 상단에서 0이 되던 엣지 제거), 프리뷰는 500 고정.
3. 모델 SortingLayer → MapLayer5 — ✅ **완료 (2026-07-05, `scripts/apply_entity_layer.cjs`)**: 명시 7종(Slime/Boar/HornMushroom/SlimeKing/Merchant/Building_House/Building_ResearchLab) + 드롭/설치 모델 16종(SL 미설정 → 명시 부여). 플레이 검증: hunt01 스폰 몬스터 `SortingLayer=MapLayer5` 확인, 지형 위 렌더 정상.
4. 플레이어 아바타: 테라스 타일 아래로 숨는지 확인 → 숨으면 DefaultPlayer에 오버라이드 추가 — 2026-07-05 플레이에서 아바타 렌더 정상. 단 현재 맵에 상위 레이어(3~5) 테라스 타일이 아직 없어 최종 판정은 **테라스 페인팅 후 재확인**.
5. 레이어 엔티티 이름 정규화 (map01은 6레이어이나 RectTileMap_1=MapLayer4 등 이름 뒤죽박죽) — 남음 (Maker UI 수동 + RectTileMap_2의 MapLayer5 점유 정리, RectTileMap_1 타일셋 지정)

현황: **map01 6레이어(MapLayer0~5, 사용자 작업 완료)**, town 3레이어, template_field 1레이어, template_boss 0레이어. 기존 타일은 리테마로 전량 교체 예정이라 재구성 실비용은 정규화+빈 레이어 추가뿐. **선행 조건: 헤네시스 타일셋 확정** (생성기가 타일 인덱스에 의존). 절차: 타일셋 등록 → 레이어 정규화+엔티티 레이어 조정(1~3번, AI) → 높이 마스크 제작(1px=1셀, 사용자 페인팅) → 마스크→프리뷰 PNG→.map 생성기(승인됨) → 장식 손 페인팅.

---

## 6. 메이플 원작화 지시 (⚖️ 2026-07-14 보스 확정)

> 보스 지시 원문 요지: "지금 QWER에 스킬이 기본 장착되어 있는데, 메이플스토리 본래 방식대로 **특정 과정(퀘스트/업적) 혹은 경험치(레벨)에 따라 스킬트리를 해금하고 장착**하게 하라. **MSW가 제공하는 원작 스킬 리소스를 최대한 그대로** 가져와라. 초기에는 아주 기초적인 스킬, **추후 직업/전직 시스템으로 확장**."

- **실사(지휘자 2026-07-14)**: §4의 S1~S4 해금 인프라(SP·업적 게이트 1001~1005·레벨 게이트·K 트리 팝업·서버 검증 레벨업)는 살아있음. 실제 간극 3가지:
  ① `PlayerController.EquippedSkillsJson` **기본값이 4스킬 선장착**(L81 — `["power_strike","fireball","dash","earth_shatter"]`) → 신규 캐릭터가 해금 흐름을 밟지 않고 QWER 완비로 시작 = 해금 시스템 무력화.
  ② **장착 변경 RPC 부재** — `ServerRequestCastSkill`/`ServerRequestSkillLevelUp`만 존재, 플레이어 주도 장착/해제 경로 없음.
  ③ `SkillDataSet.EffectRUID` 전 행 공란 + 아이콘 컬럼 없음 — 원작 리소스 미사용, 시전 비주얼 부재.
- **티켓(배치 F)**: **T45**(해금·장착 흐름 정합 — 선장착 제거/장착 RPC/시전 검증/기존 세이브 정리) → **T46**(원작 스킬 리소스 스킨 + 기초 스킬 세트 정렬 — 내부 SkillId 유지로 세이브 호환). 스펙 원문: `docs/agents/subagent-handoff.md` §3.
- **전직 로드맵(예약 — 티켓 미발행)**: `SkillDataSet`에 `JobId` 컬럼 예약(공란=초보자 공용). 직업 선택 NPC·전직 퀘스트(quest-achievement 패키지 재사용)·직업별 트리 탭·상위 스킬군은 **기초 스킬 안착 후** 기획 확정. `game_design.md` Phase 16-C 참조.
- **배치 F 결과 + 제작자 피드백(2026-07-14)**: T45(장착 흐름)·T46(원작 스킨 — 파워 스트라이크/매직 클로/플래시 점프/슬래시 블러스트 매핑) 코드 완료·Play 확인. 피드백 2건 → **T47**: ① 노드 클릭이 곧 SP 투자(`OnNodeClicked`→`ServerRequestSkillLevelUp` 직결) — 클릭=선택/상세, 투자=[레벨업] 버튼으로 분리 ② 스킬트리 여는 **HUD 버튼** 신설.
- **⚖️ 공식 소스 조사 결론(지휘자 2026-07-14)**: MSWPackages 저장소 29종 전수 확인 — **스킬 시스템 패키지 없음**. MSW 공식 제공 방식 = ① 원작 스킬 리소스 태그 검색(스킬명 → `#skillname#고유ID` 2차 검색, 가이드 "Searching for Effects") + `_EffectService:PlayEffect` 재생(=T46 채택 방식) ② key-binding-package(가상 버튼 — 모바일 온스크린 시전 버튼 후속 후보) ③ UI 프리셋. **자작 트리 인프라(SP/게이트/트리 UI) 유지 확정.**

---

## 7. 직업/전직 확장 대비 구조 설계 (⚖️ 2026-07-14 보스 지시 — 선행 설계, 구현은 Phase 16-C)

> 보스 지시 요지: "나중의 전직 혹은 직업에 따른 스킬 추가도 생길 텐데, 미리 대비해서 디자인해야 할 것."
> 이 §의 목적: 지금은 **데이터 계약과 UI 확장 경로만 고정**하고 구현하지 않는다. 확장 시 기존 세이브·기존 6스킬은 **무마이그레이션**이 원칙.

### 7.1 데이터 계약 (16-C 착수 시 CSV 컬럼 추가만으로 개시)

| 항목 | 설계 |
|---|---|
| `SkillDataSet.JobId` | 컬럼 신설 (공란 = 공용/초보자). **직업별 스킬 = 행 추가만** — 코드 무수정 확장 (R3 데이터 우선 원칙). |
| `TreeRow`/`TreeCol` | **직업 탭 내 로컬 좌표**로 재정의. 현행 6스킬은 JobId 공란 = 초보자 탭 좌표로 그대로 유효 → 마이그레이션 0. |
| `SkillId` | 계속 `skillLevels` 저장 키 — **변경 금지** (§6 세이브 호환 정책 재확인). 전직 후에도 초보자 스킬 투자분 유지. |
| 전직 상태 | `PlayerController.JobId`(@Sync) + `PersistenceManager` 필드 1개. |
| 전직 부여 경로 | 전직 퀘스트 보상 `RewardJobId` 컬럼 — **T27 `RewardUnlockId` 훅 패턴 재사용** (`UserQuestData.Complete` 동일 지점, 신규 훅 발명 금지). |

### 7.2 UI 확장 경로 (구현 시점 16-C — 단계 순서 고정)

1. **직업 탭 행**: SkillTreePopup 상단(Title 아래)에 칩 탭 행 — **T42 도감 카테고리 칩 행 패턴 재사용**(검증된 프로젝트 비주얼 아이덴티티, 새 스타일 발명 금지). 탭 구성은 CSV `JobId` 고유값에서 **파생**(전용 탭 목록 CSV 금지 — T22 도감 파생 원칙과 동일). 탭 1개(미전직)면 탭 행 숨김 → 현행 화면과 동일.
2. **노드 영역 수용량**: 현행 정적 3열×3행 슬롯이 1차. 직업당 스킬이 9개를 넘으면 (a) 팝업 세로 확장으로 4~5행 슬롯 복원 — T48의 3행 축소는 EquipBar 공간 충돌 때문이지 설계 상한이 아님 → (b) 그래도 부족하면 노드 영역만 `ScrollLayoutGroup` 세로 스크롤 전환. **GridView(가상화)는 순차 셀 배치라 TreeRow/Col 좌표 트리에 부적합 — 채택 안 함.** ⚠️ `.ui` 확장 시 §1.2 규칙 10(stretch 미신뢰 — RectSize 명시) 준수.
3. **하단 EquipBar(상세/QWER/레벨업)**: 탭과 무관한 공용 고정 밴드 — 현행 유지.
4. **`UISkillTreeController.Refresh()`**: 노드 재구성 CSV 루프에 `JobId == 현재 탭` 필터 1줄 추가 — 현행 구조 그대로 저비용.

### 7.3 비범위 (16-C 기획 확정 시 보스와 결정)

다중 직업 동시 보유 / 전직 초기화·SP 환급 / 직업별 스킬바 프리셋 / 2차+ 상위 전직 트리 분기.

---

## 8. 트리 위상 시각화 & 연계 강화 (⚖️ 2026-07-15 보스 지시)

> 보스 지시 요지: "핀터레스트 레퍼런스(pin 15410823722566608 'Dnd Mysticism Build 35' — D&D식 계보 스킬트리)처럼 **말 그대로 트리 형식으로 나아가는** 디자인. **연계 스킬 형식으로 강화하는 과정**이 존재해야 한다. 단 **너무 복잡한 구조는 싫다**."
> **실사(지휘자 2026-07-15)**: 계보 데이터(`SkillDataSet.ParentSkillId`)와 서버 게이트(`ServerRequestSkillLevelUp` — PlayerController L2110~)는 S2부터 살아있다. 실제 간극 2가지: ① 게이트가 "부모 **Lv≥1**(해금만)"이라 연계 **강화** 깊이가 없음 ② UI가 연결선 없는 격자 칩이라 **트리로 보이지 않음**. → 해법 = 시각화 + 게이트 깊이. **위상 재편(재부모화)·스킬 추가는 불필요** — 현행 3계열 계보가 이미 트리다(세이브·밸런스 무변경).

### 8.1 확정 위상 (현행 CSV 그대로)

```
[전투 계열]              [이동]              [채집 계열]
파워 스트라이크(1,1)    플래시 점프(1,2)    신속 채집(1,3)
      │                                        │
매직 클로(2,1)                              강력 채집(2,3)
      │
슬래시 블러스트(3,1)
```

### 8.2 데이터 계약

- **`ParentRequiredLevel` 컬럼 신설**: 자식 해금(0→1)에 필요한 **부모 스킬 레벨**. 공란/누락 = 1(현행 동작과 동일 폴백 — pcall 가드, 규칙 7). 조건 변경 = CSV만.
- 시범값(🧭 제안 — CSV 튜닝 자유): 매직 클로 ← 파워 스트라이크 **Lv 3** / 슬래시 블러스트 ← 매직 클로 **Lv 3** / 강력 채집 ← 신속 채집 **Lv 3**.
- 서버 게이트 ①(선행 스킬)을 "부모 Lv ≥ ParentRequiredLevel"로 확장 + 클라 표시 미러 동기(UISkillTreeController의 게이트 미러 주석 지점).

### 8.3 단순성 가드라인 (⚖️ "너무 복잡한 구조는 싫어" — 트리 저작 규칙, 신규 스킬·직업 탭에도 적용)

1. **단일 부모** — `ParentSkillId` 1개, 다중 선행 금지.
2. 부모는 **같은 열(TreeCol)·바로 위 행(TreeRow−1)** 에만 — 교차 열·행 건너뛰기 금지. 컨트롤러는 위반 행의 링크를 그리지 않고 경고 로그(저작 실수 검출).
3. 깊이 최대 3행 × 계열 최대 3열(현행 팝업 슬롯 상한) — 초과 수요는 §7.2 확장 경로(팝업 세로 확장 → 스크롤)로.

### 8.4 UI 설계

- **연결선**: 노드 슬롯이 `.ui` 프리플레이스 정적 슬롯(`Node_<r>_<c>`)이므로 수직 커넥터 스프라이트도 프리플레이스(`Link_<r>_<c>` = 노드 (r,c)와 (r−1,c) 사이, 규칙 10 — RectSize 명시). 표시 여부·색은 컨트롤러가 `ParentSkillId`에서 **파생**(데이터 주도 — 링크 목록 하드코딩 금지).
- **상태 컬러**(노드·링크 공통 문법): 잠김=dim / **해금 가능=금색 하이라이트**(다음 노드가 유혹하는 트리 진행감) / 보유=금색 실선 + Lv 뱃지 / 마스터=강조 테두리(선택).
- **SkillDetailPanel에 선행 조건 줄**: "선행: 매직 클로 Lv 3 (현재 1)" — 충족=금색/미충족=적색. Description 아래.
- §7 직업 탭과 정합: 링크는 탭 필터된 노드 기준 재파생 — 확장 시 추가 작업 0.

구현 티켓: handoff §3 **T58**. 착수 게이트: T54(PopupGroup.ui Play 대기)와 파일 겹침 — **T54 Play 확인 후**(또는 보스 리스크 수용 명시 시 즉시).
