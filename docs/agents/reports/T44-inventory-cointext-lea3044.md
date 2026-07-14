# T44 작업 보고서 — InventoryPopup/CoinText LEA-3044 수정

- **작업**: T44 `InventoryPopup/CoinText` LEA-3044 직렬화 오류 수정 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker 기동, refresh 수행
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

T22에서 발견된 `InventoryPopup/CoinText` LEA-3044(FontColor/OutlineColor 역직렬화 실패)를 조사·수정했다. 정상 동작하는 `ShopPopup/Bg/CoinText`와 비교 후, UIBuilder로 엔티티를 재생성하고 TextComponent 색상·UseOutLine을 상점 코인 라벨과 동일 값으로 정렬했다. UUID(`463e85c6-…`) 유지로 `UIInventoryController.coinText` 바인딩 무변경. `.mlua` 로직 수정 0. Play에서 LEA-3044 소멸 확인은 제작자.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `ui/PopupGroup.ui` | `InventoryPopup/CoinText` UIBuilder 재생성 + FontColor/OutlineColor/UseOutLine=false를 Shop 패턴으로 정렬 |

## 3. 구현 상세

- **① 비교**: Inventory CoinText vs Shop CoinText — 둘 다 `UIText` 모델·Text+Sprite 구성 동일. 차이는 Inventory가 `UseOutLine=true` + 커스텀 OutlineColor `{0.15,0.12,0.08}`, Shop은 `UseOutLine=false` + 빌더 기본 OutlineColor.
- **② 수정**: `UIBuilder.text(...).patchComponent(TextComponent)`로 컴포넌트 페이로드 재작성. 레이아웃(bottom-right, pos -60/30, 300×34) 유지. FontColor=`{1, 0.9137255, 0.65882355, 1}` (Shop 골드), UseOutLine=false.
- **③ 바인딩**: 엔티티 id `463e85c6-17c6-4c0b-a068-e7a182f3aacb` 유지 — `UIInventoryController.coinText` / `UpdateCoinDisplay`(Text만 갱신) 확인, 코드 수정 불필요.
- **스펙 편차**: 없음. Play 재현(Change ① 로그 확인)은 범위 밖 → 제작자 체크리스트.

## 4. 수행한 검증과 결과

- **UIBuilder write**: ui_lint Error 0 (기존 Warning 78).
- **Maker `maker_refresh_workspace`**: status=ok.
- **Build logs**: **Error=0** (total 449 / Warning 13 / Info 436 — UI-only 변경 후 빌드 로그 동일 규모).
- **Play 런타임 검증**: **보류(제작자 수행)** — 인벤 열기 후 LEA-3044 0건·코인 표시 정상 여부.

## 5. 발견한 문제 / 후속 제안

- LEA-3044 근본 원인이 `UseOutLine` 조합인지 엔티티 오염인지는 Play 없이 단정 불가. 재생성+Shop 정렬로 정상 엔티티와 페이로드를 일치시킴. 재발 시 엔티티 삭제 후 신규 UUID+바인딩 재주입 검토.

## 6. 제작자 런타임 체크리스트

- [ ] refresh 후 Play → 인벤토리 열기
- [ ] `maker_logs(kind=normal)`에서 `InventoryPopup/CoinText` 관련 LEA-3044 **0건**
- [ ] 하단 "보유 코인: N" 표시가 Coin 값과 일치·가독성 정상
- [ ] 상점 코인 표시 회귀 없음

## 7. 이력

- 2026-07-14 최초 작성 (Grok worker)

## 8. ui-aesthetics §7 자가 리뷰 루브릭

| # | Check | 결과 | 근거 |
|---|-------|------|------|
| 1 | No naked panels | PASS | 기존 InventoryPopup 프레임 유지, 텍스트 1개 교정만 |
| 2 | Header zone | PASS | 무변경 |
| 3 | Palette discipline | PASS | Shop 코인 골드 톤 재사용, 순수 #FFF 배경 없음 |
| 4 | Type hierarchy | PASS | FontSize 18 캡션 유지 |
| 5 | Rhythm | PASS | 위치·크기 기존 유지 |
| 6 | Role & state | PASS | 코인 표시 전용 라벨 역할 유지 |
| 7 | Project consistency | PASS | ShopPopup CoinText와 동일 색/아웃라인 정책 |
| 8 | Accent economy | PASS | 코인 골드 1곳 |

**§7 총평**: 8/8 PASS (범위=텍스트 교정)
