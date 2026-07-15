# T54 작업 보고서 — 팝업 전수 정비 (닫기 88px·Furnace 구조·가독)

- **작업**: T54 팝업 전수 정비 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자)
- **수행 에이전트/환경**: Grok 구현 에이전트 · Maker refresh 가능 · Play 범위 밖
- **날짜**: 2026-07-15

## 1. 요약

12개 팝업을 실사해 **모든 팝업에 BtnClose가 이미 존재**함을 확인(일부는 `Bg/` 하위). 닫기 히트 영역을 전부 **88×88**로 통일하고 RaycastTarget을 보장했다. FurnacePopup 루트를 타 팝업과 같이 **콘텐츠 크기 600×500 + en=false**로 정합(컨트롤러는 기존처럼 `self.Entity.Enable` Open/Close — 회귀 위험 낮음). 본문 폰트 일부를 20~24로 승격. SkillTree 레이아웃 재편 없음. 컨트롤러 로직 수정 0.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `ui/PopupGroup.ui` | 12×BtnClose 88×88, FurnacePopup 루트 정합, 본문 폰트 승격 |

## 3. 구현 상세

### ① 실사표 (12 팝업)

| 팝업 | BtnClose 경로 | 이전 크기 | 이후 | 루트 size / en | 배선(확인) |
|---|---|---|---|---|---|
| Character | `CharacterPopup/BtnClose` | 50 | **88** | 850×700 / false | UICharacterController btnClose |
| Chest | `ChestPopup/Bg/BtnClose` | 50 | **88** | 800×700 / false | UIChestController btnClose |
| Collection | `CollectionPopup/BtnClose` | 48 | **88** | 1000×780 / false | UICollectionController |
| Crafting | `CraftingPopup/BtnClose` | 50 | **88** | 1000×780 / false | UICraftingController |
| Furnace | `FurnacePopup/Bg/BtnClose` | 50 | **88** | **600×500 / false** (was 1920×1080/true) | UIFurnaceController `self.Entity.Enable` |
| Inventory | `InventoryPopup/BtnClose` | 50 | **88** | 800×700 / false | UIInventoryController |
| Permission | `PermissionPopup/Bg/BtnClose` | 50 | **88** | 800×700 / false | (Bg 하위 close) |
| Request | `RequestPopup/Bg/BtnClose` | 40 | **88** | 720×560 / false | 기존 close |
| Research | `ResearchPopup/Bg/BtnClose` | 40 | **88** | 900×640 / false | 기존 close |
| Shop | `ShopPopup/Bg/BtnClose` | 50 | **88** | 800×700 / false | 기존 close |
| SkillTree | `SkillTreePopup/Bg/BtnClose` | 50 | **88** | 920×840 / false | T50 유지, close만 |
| Warp | `WarpPopup/Bg/BtnClose` | 50 | **88** | 800×700 / false | 기존 close |

※ 지휘자 메모 "depth2에 BtnClose 미확인" 7종은 전부 `Bg/BtnClose`로 존재 — 신설 불필요, 크기·Raycast만 정비.

### ② 닫기 버튼 통일

- 전 팝업 BtnClose `RectSize=88×88`, 앵커/피벗/pos 유지(코너 정렬 보존).
- 시각 라벨 "X" 유지, hit만 확대(§9.4 패턴).
- 기존 컨트롤러 UUID/경로 배선 유지 — **mlua 수정 0**.

### ③ FurnacePopup 구조 정합

- 루트: 1920×1080 en=true → **600×500 en=false** (Bg 콘텐츠와 동일).
- `UIFurnaceController.OnBeginPlay`가 이미 `self.Entity.Enable=false`, Open/Close가 루트 Enable 토글 — 크기만 콘텐츠에 맞춤.
- Open 시 Bg를 (330,0)으로 밀고 인벤을 여는 로직은 불변.

### ④ 본문 폰트 승격 (레이아웃 안전 범위)

승격 예: Crafting Desc 18→24, Request Hint/Day, Permission Notice, Research Desc/Progress, Inventory Capacity/Coin/Tooltip Desc, Shop Coin, SkillTree Hint, Collection Info→20.

**의도적 유지(<20, 후속 후보)**: Shop ItemName/Price, Character 스탯 Label 12, 슬롯 Count, ChipTemplate, SkillTree Lv/노드/QWER 칩, 탭 라벨 — 밀도 UI로 24 강제 시 레이아웃 파괴.

### ⑤ 인터랙티브 hit <88 (표기만, 대규모 개편 금지)

| 영역 | 예 | 조치 |
|---|---|---|
| BtnClose | 전 팝업 | **본 티켓에서 88 승격** |
| 탭/칩 | Collection/Crafting ChipTemplate 110×32, 탭 180×44 | 후속 티켓 제안 |
| 그리드 슬롯 | Chest/Inventory 72×72 | 후속(드래그 밀도) |
| SkillTree | 노드 76, Equip 64×40 | T50 유지 — 레이아웃 재편 금지 |
| 기타 | BtnDeliver 100×44, BtnToggle 100×38 등 | 후속 |

## 4. 수행한 검증과 결과

- UIBuilder write + ui_lint: Error 0 (기존 팝업 경고 잔존)
- Maker `maker_refresh_workspace`: ok
- 빌드 로그: total **492** · **Error=0** · Warning 17 · Info 475
- Play: **런타임 검증 보류(제작자 수행)**

## 5. 발견한 문제 / 후속 제안

- 탭/칩/리스트 행 hit 88 승격은 스크롤·그리드 재배치가 필요 → 별도 티켓 권장.
- Shop 가격 폰트 12는 모바일 가독 취약 — CSV/리스트 레이아웃 동반 티켓 권장.
- Furnace 루트 축소 후 전체 화면 클릭 차단 여부는 Play에서 Dimmer 연동 확인 필요.

## 6. 제작자 런타임 체크리스트

- [ ] 12 팝업 각각 열기 → 우상단(또는 기존 위치) X 탭으로 닫기
- [ ] Furnace/냄비: 열기·닫기·인벤 병치·제련 루프 회귀
- [ ] SkillTree: 노드/장착/레벨업 회귀 0 (close hit만 커짐)
- [ ] Inventory/Crafting/Collection 탭·리스트 회귀
- [ ] 모바일에서 닫기 버튼 오탭 없이 ≥88 hit 체감

## 7. 이력

- 2026-07-15 최초 작성 (Grok worker)

## 부록: ui-aesthetics §7

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | Gray Box | PASS | 기존 프레임/아이콘 유지 |
| 2 | 아이덴티티 | PASS | 팝업별 기존 비주얼 유지 |
| 3 | 패널 해부 | PASS | Furnace 콘텐츠 루트 정합 |
| 4 | 닫기 ≥88 | PASS | 12/12 BtnClose 실측 88 |
| 5 | 간격 | PASS | close pos 유지, 코너 피벗 |
| 6 | 타이포 | PASS* | *본문 승격, 밀도 UI 후속 |
| 7 | stretch 함정 | PASS | fixed size close |
| 8 | SkillTree 유지 | PASS | 레이아웃 재편 0, close만 |
