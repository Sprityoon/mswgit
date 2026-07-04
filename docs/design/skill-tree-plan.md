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

| Phase | 내용 | 완료 기준 | 상태 (2026-07-04) |
|:---:|------|-----------|------|
| S1 | 패키지 통합 (Core만) + 처치/채집/제작/제련 ActionEvent 훅 + 조건 클래스 | 업적 진행도가 플레이로 카운트됨 | ✅ **플레이 검증 완료 (2026-07-04)** — Gather/Smelt 라이브 카운트(1004·1005 0→1), 재접속 복원 확인 |
| S2 | SkillDataSet 확장 + SP 지급 + 서버 해금/레벨업 + Persistence 필드 | CSV로 정의한 스킬이 조건 충족 시 SP로 해금·강화됨 | ✅ **플레이 검증 완료** — 레벨업 SP+3, power_strike/swift_gather 해금, fireball 레벨 게이트 거부, stop→play 라운드트립 저장 복원 |
| S3 | SkillTreePopup UI + SkillBar 연동 | 트리에서 해금→장착→사용 전체 루프 | ✅ **플레이 검증 완료** — K키 팝업, 노드 4상태(보유/해금가능/잠김 2종) 렌더, Q 시전 데미지 24 = (8+도구2×4)×1.5 배율 정확 |
| S4 | 스킬·업적 밸런싱 CSV 채우기 + 검증 | 초기 트리(예: 전투/채집 2계열 × 4~6스킬) 플레이 가능 | ✅ **플레이 검증 완료** — 6스킬 트리 동작, 패시브 GetPassiveBonus(MineCooldown)=-0.08 계산 확인 |

패시브 스킬 지원 (S4에서 추가): `Type=Passive`는 장착/시전 불가, `PlayerController:GetPassiveBonus(stat)`가 CSV의 `PassiveStat`/`PassiveValuePerLevel`을 합산. 적용 지점: `MineCooldown`(채집 스윙 쿨다운, 클라+서버), `MinePower`(TileDurabilityManager 타격 위력, 자원 한정). 신규 패시브는 CSV 행 추가만으로 반영.

---

## 5. 맵 레이어 재구성 — ✅ **실행 완료 (2026-07-04, 9방향 타일 체계로 구현)**

표준 컨벤션 — 마스크→생성기 파이프라인 도입 시 적용. 렌더 우선순위는 **① SortingLayer → ② OrderInLayer → ③ Z** 이므로, 지형 타일 레이어(0~4)보다 위에 **엔티티 전용 레이어(MapLayer5)** 를 둔다:

> **2026-07-04 확정 구현** (아래 표의 이름은 원안 — 실제 맵은 RectTileMap~RectTileMap6 표준명, Maker에서 정규화 저장 완료):
> `wall.tileset` 단일 시트 (`FullGrass` 베이스 / `Soil` 9방향 + **내부 모서리 `SoilLT2/RT2/LD2/RD2` 4종(보조 타일)** /
> `TerraceTop` 9종 / `CliffFace` 6종 / `Big Wall` 충돌).
> Grass는 영지·마을 기본 바닥으로 전면 깔리고 **Soil이 사람이 다니는 길** (기존 Grass 중심 13종 오토타일 폐기).
> 실제 레이어: `RectTileMap`(SL0 베이스) / `RectTileMap2`(SL1 Soil길) / `RectTileMap3`(SL2 설치바닥·tile1) /
> `RectTileMap4`(SL3 Big Wall 밴드) / `RectTileMap5`(SL4 경계 테라스 비주얼) / MapLayer5 = 엔티티 전용.
> 로직: `ResourceSpawner:ComputeAutotileName(prefix, mask, x, y)` 9방향+내부모서리 공용
> (⚠️ XX2 보조 타일은 현재 Soil 패밀리에만 존재).
> 페인팅: `scripts/build_maps.cjs` — **⛔ 초기 블록아웃 전용, `--force` 없이는 실행 거부**.
>
> **🔑 맵 소유권 전환 (2026-07-04)**: 블록아웃 완료 후 맵 타일은 **Maker 손편집이 소스 오브 트루스**.
> 생성기 재실행·런타임 Soil 오토타일 재보정(`AutotileSoilOnSetup=false`)이 손편집을 덮어쓰지 않도록 잠갔다.
> 사용자 워크플로우: Maker에서 map01/town/템플릿을 직접 칠하고 **Ctrl+S 저장** → 영지는 map01 템플릿 복제라 map01을 고치면 된다.
> 맵 디자인 레퍼런스: 영지 = MyMap.png (우물 광장 + S커브 길 + 남서 밭 3구획), 마을 = Town.png (대광장 + 4분면 정원 아일랜드 + 십자 대로).
> 광장류는 팔각형(균일 45° 챔퍼) — 원형 래스터는 스텝이 불규칙해 금지.
> ⚠️ 생성기 제약(실측): ① **레이어 엔티티 리네임/삭제 금지** — Maker refresh 증분 적용이 깨짐(LEA-3054).
> ② **타일 변경 시 jsonString.revision 범프 필수** — 범프 없으면 에디터가 열어둔 맵의 타일 변경을 건너뜀 (setTiles가 자동 처리).
> 바이옴 절차지형·청크 스트리밍은 `ResourceSpawner.UseProceduralBiomes/UseChunkStreaming=false`로 **잠금** —
> 사냥터는 정적 손디자인 템플릿 + 존별 고정 바이옴(PortalDestinationDataSet `Biome` 컬럼: earth_field/rocky/desert/green_island).
> 카메라 ZoomRatio 60→78 (더 멀리 보기).
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

1. 하드코딩 8곳 → 공용 @Logic 상수(`_RenderLayers.EntityLayer` = "MapLayer5")로 일원화 — ✅ **완료 (2026-07-03)**: `Util/RenderLayers.mlua` 신설, 스크립트 4종 8곳 교체. 단 상수값은 동작 유지를 위해 일단 `"MapLayer2"` — 타일셋 확정 후 배치에서 `"MapLayer5"`로 **한 줄 플립**.
2. 런타임 스폰 시 `OrderInLayer` 명시(≥2) — ✅ **완료**: y-sort 공식 7곳을 `math.max(_RenderLayers.MinEntityOrder, …)`로 클램프 (맵 상단에서 0이 되던 엣지 제거), 프리뷰는 500 고정.
3. 모델 7종(Slime/Boar/HornMushroom/SlimeKing/Merchant/Building_House/Building_ResearchLab) SortingLayer 값 MapLayer0→MapLayer5 — ✅ **완료 (2026-07-04)**: `scripts/apply_entity_layer.cjs` 실행, 드롭/설치물 16종에도 명시 부여, `_RenderLayers.EntityLayer` "MapLayer5" 플립 포함.
4. 플레이어 아바타 — ✅ 플레이 테스트에서 지형 타일 위 정상 렌더 확인 (2026-07-04), 오버라이드 불필요.
5. ~~레이어 엔티티 이름 정규화~~ — **철회 (2026-07-04)**: Maker refresh가 기존 엔티티 리네임을 증분 적용하지 못함(LEA-3054 → 맵 미등록). 이름은 맵별 기존 그대로 유지하고 `build_maps.cjs`가 이름→논리 슬롯 매핑으로 흡수.

현황 (2026-07-04): 4맵 전부 5레이어 페인팅 완료 — map01/template_field 61×61(R30), town 71×71(R35), template_boss 31×31(R15). 경계 = Big Wall 충돌 밴드 3겹 + 테라스 링 비주얼(북벽 CliffFace). 플레이 검증: 사냥터 4존 생성·존별 몬스터 배율·스폰 클램프(60/60 플레이어블 내)·벽 충돌(y=27.3 정지)·미니맵 색·마을 광장 모두 통과, 에러 0. **잔여**: ① map01의 테라스 링(RectTileMap_1 데코 696타일)은 에디터가 열어둔 맵 상태 때문에 라이브 미반영 — **Maker 재시작(또는 map01 탭 재오픈) 후 자동 반영**. ② TerraceTop 중앙부는 시트 아트가 비어 흰색 — 타일 그림 교체 시 해소(구조·이름·인덱스는 확정).
