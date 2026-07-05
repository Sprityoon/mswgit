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
