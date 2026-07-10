# T7 작업 보고서 — 연구소 가동

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식의 산출물.

- **작업**: T7 연구소 가동 (`docs/agents/subagent-handoff.md` §3 T7)
- **상태**: **완료 | refresh 빌드 Error=0 | 제작자 Play 검증 PASS (2026-07-11)**
- **수행 에이전트/환경**: Grok 구현 에이전트(코드) / 제작자(Play)
- **날짜**: 2026-07-11

## 1. 요약

마을 `Building_ResearchLab`에 F/터치 상호작용을 붙이고, `ResearchDataSet` 기반 연구 UI·서버 타이머·완료 시 `GrantRecipeUnlock`(T25) 연결을 구현했다. 진행 중 연구는 플레이어 단위로 영속되며 재접속 시 오프라인 경과로 완료 정산된다. 구리/철 도구 UnlockId(`research_copper_tools` / `research_iron_tools`)는 기존 RecipeDataSet 배정을 그대로 사용한다.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/MapObjects/DataSets/ResearchDataSet.csv` | 신규 — 구리/철 도구 연구 2행 |
| `RootDesk/MyDesk/MapObjects/DataSets/ResearchDataSet.userdataset` | 데이터셋 메타 |
| `RootDesk/MyDesk/MapObjects/Scripts/ResearchLab.mlua` | 신규 — F/Touch → ResearchPopup |
| `RootDesk/MyDesk/MapObjects/Models/Building_ResearchLab.model` | TouchReceive + ResearchLab 컴포넌트 |
| `RootDesk/MyDesk/UI/Scripts/UIResearchController.mlua` | 신규 — 목록/상세/시작 UI |
| `RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` | ActiveResearch·Start/Complete·OnUpdate |
| `RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua` | activeResearchId/researchStartTime save/load |
| `ui/PopupGroup.ui` | ResearchPopup (빌더 경유) |
| `scripts/build_ui.js` | ResearchPopup idempotent 패치 + 바인딩 |

## 3. 구현 상세

① **ResearchDataSet**: ResearchId/DisplayName/InputItem/InputCount/Duration/UnlockRecipeId/IconRUID/Desc.  
   - `research_copper_tools`: Copper Ore×10, 120초 → UnlockRecipeId=`research_copper_tools`  
   - `research_iron_tools`: Iron Ore×10, 300초 → UnlockRecipeId=`research_iron_tools`  
② **상호작용**: MerchantInteract 패턴. 거리 ≤3, F/터치 토글.  
③ **UI**: 제작창 하이브리드 골격 축소(리스트+상세+시작). forest dark + gold `#F0A830`.  
④ **서버**: 재료 차감 → ActiveResearchId + ResearchStartTime(os.time) → OnUpdate 1초 틱 / 로드 시 `TryCompleteActiveResearch` → `GrantRecipeUnlock`.  
⑤ **영속**: PersistenceManager `activeResearchId`/`researchStartTime`.  
⑥ **재사용**: T25 Grant/Has, T14 잠금 표시 경로는 제작창 기존 그대로(연구 완료만 소스 연결).

**스펙 이탈**: 없음. 재료를 몹 전용 전리품 대신 현존 광석으로 둔 것은 데이터 주도 확장 가능한 최소 콘텐츠(CSV 행 교체만으로 변경).

## 4. 수행한 검증과 결과

- `node scripts/build_ui.js` 성공 (PopupGroup 275→297, Research 바인딩 10).
- Maker `refresh` 후 build 로그: **Error=0**. Warning 2건 = 기존 Monster BossDrop LWA-4012.
- 최초 BuildList LEA-1108(Parent/Name 할당) 수정 후 재빌드 클린.
- **Play 런타임 검증 보류(제작자 수행)**.

### UI 자가 리뷰 루브릭 (ui-aesthetics §7)

| 항목 | 점수 | 메모 |
|---|---|---|
| Gray Box 회피 | 4/5 | Bg+BgInner+TopBar+AccentLine 복합 |
| 아이덴티티 일관성 | 5/5 | forest/gold 기존 제작·HUD 동일 |
| 계층/타이포 | 4/5 | 제목/본문/캡션 구분 |
| 간격 리듬 | 4/5 | 8px 배수 근사 |
| 역할별 버튼 | 4/5 | 닫기 danger / 시작 accent gold |

## 5. 발견한 문제 / 후속 제안

- 연구 목록은 ScrollView 없이 소수 행 가정(현재 2). 행이 늘면 Scroll 추가 권장 — 신규 T항목으로만.
- 마을 맵에 ResearchLab 엔티티가 배치돼 있어야 F 상호작용 가능(기존 배치 전제).

## 6. 제작자 런타임 체크리스트

- [x] town 연구소 근처 F → ResearchPopup 오픈
- [x] Copper Ore 10개 보유 시 구리 도구 연구 시작·재료 차감
- [x] 연구 완료 해금 토스트 + 제작창 잠금 해제
- [x] 철 도구 연구 루프
- [x] 목록 순서 구리→철 (핫픽스 후)
- [x] 재접속 시 해금/연구 유지

## 7. 이력

- 2026-07-11 최초 작성 (구현 에이전트)
- 2026-07-11 목록 겹침 핫픽스(SortOrder+세로 배치)
- 2026-07-11 제작자 Play 검증 PASS — 통합: `BATCH-A-B-play-verify-2026-07-11.md`

