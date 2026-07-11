# T20 작업 보고서 — 마을 의뢰 게시판 (일일 납품)

- **작업**: T20 마을 의뢰 게시판 — 일일 납품 의뢰 (Phase 15-D)
- **상태**: 코드 완료 | UI 루브릭 8/8 | 레인 말미 refresh 빌드 **Error=0** | Play 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: 레인 1 · UIBuilder/`scripts/build_ui.js` · MapBuilder town 배치
- **날짜**: 2026-07-11

## 1. 요약

마을에 의뢰 게시판 픽스처·일일 결정론 3건 추첨·납품 RPC·영속 완료 기록을 구현했다. `RequestPoolDataSet` 행 추가만으로 의뢰 확장. 의뢰 UI는 연구소/제작창과 동일 forest dark + gold `#F0A830` 아이덴티티. refresh 빌드 검증은 T27 완료 후 레인 1회에 포함.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `MapObjects/DataSets/RequestPoolDataSet.csv` + `.userdataset` | 신규 풀 8행 (Wood/Stone/Grass/Carrot/Copper Ore → Coin) |
| `MapObjects/Scripts/BulletinBoard.mlua` | F/터치 → RequestPopup |
| `MapObjects/Models/BulletinBoard.model` | TouchReceive + BulletinBoard (ResearchLab 기반) |
| `map/town.map` | BulletinBoard (2.5, 1.5) 배치 |
| `UI/Scripts/UIRequestController.mlua` | 3행 목록·납품·완료 표시 |
| `ui/PopupGroup.ui` | RequestPopup (빌더) |
| `scripts/build_ui.js` | RequestPopup idempotent 패치 + 바인딩 |
| `Player/Scripts/PlayerInventory.mlua` | day 시드 추첨·완료 상태·`ServerRequestDeliver` |
| `Player/Scripts/PersistenceManager.mlua` | dailyRequestDay / dailyCompletedRequests 영속 |

## 3. 구현 상세

- **① 일 번호 시드**: `math.floor(os.time()/86400)` + LCG 가중 추첨 3건(비복원). 전 유저 동일.
- **② 게시판**: ResearchLab 패턴 거리 ≤3 F/터치 토글.
- **③ 납품**: `@ExecSpace("Server")` senderUserId·오늘 풀 소속·당일 1회·`HasItem`/`RemoveItem`/`AddItem`(Coin 통화 경로)·MarkDirty.
- **④ 일 변경**: `EnsureDailyRequestState`가 day 불일치 시 완료 JSON 클리어 (로드 시·조회 시).
- **⑤ 풀**: 현존 채집/농사 아이템 Name 키만 (낚시/가축 제외).

**스펙 이탈**: 없음.

### UI 아이덴티티 토큰

```
frame composite: #2B2620 + #3A332B + TopBar #1E1A16 + AccentLine #F0A830
text-hi #F5EFE6 / body #C9C0B2 / dim #857D6F / accent #F0A830
primary btn gold / close danger red
```

### ui-aesthetics §7 자가 리뷰 루브릭

| # | 항목 | 판정 | 메모 |
|---|---|---|---|
| 1 | No naked panels | PASS | Bg + BgInner + TopBar + AccentLine |
| 2 | Header zone | PASS | TopBar + Title + close |
| 3 | Palette discipline | PASS | forest/gold 기존 연구소 동일, 순수 #000/#FFF 채우기 없음(텍스트 제외) |
| 4 | Type hierarchy | PASS | 28/18/20/15/14 |
| 5 | Rhythm | PASS | 8 배수 근사, 패널 여백 |
| 6 | Role & state | PASS | 납품 gold / 닫기 danger / 완료 dim |
| 7 | Project consistency | PASS | ResearchPopup·Craft 동일 팔레트 |
| 8 | Accent economy | PASS | 액센트 라인·day 텍스트·납품 버튼 |

**합계: 8/8 PASS**

## 4. 수행한 검증과 결과

- `node scripts/build_ui.js` 성공 — RequestPopup 바인딩 5, PopupGroup 313 entities.
- MapBuilder town BulletinBoard 배치 확인 (2.5, 1.5).
- **Maker refresh** (T27 직후 일괄): `{"status":"ok"}` · 빌드 **Error=0** / Warning 9 / Info 424 / total 433.  
  - 중간 이슈: `Clone(Entity)` → LEA-1103/1108 → `Clone(string name)`으로 수정 후 재refresh 클린.
- **Play 런타임 검증 보류(제작자 수행)**

## 5. 발견한 문제 / 후속 제안

- 게시판 스프라이트는 ResearchLab 빌딩 RUID 재사용(placeholder). 전용 게시판 아트는 후속.
- 행 Clone 레이아웃은 세로 고정 3행 가정 — 풀 확장 시 스크롤 권장(신규 T 시).

## 6. 제작자 런타임 체크리스트

- [ ] town 게시판 F → RequestPopup, 의뢰 3건 표시
- [ ] 다른 유저/재접속 동일 day 동일 3건
- [ ] 납품 → 재료 차감·코인 보상·당일 재납품 거부
- [ ] 다음 날(day 변경) 새 의뢰·완료 리셋
- [ ] 재접속 후 당일 완료 기록 유지

## 7. 이력

- 2026-07-11 최초 작성 (레인 1)
