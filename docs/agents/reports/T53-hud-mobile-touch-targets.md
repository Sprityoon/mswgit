# T53 작업 보고서 — HUD 모바일 정비 (터치 88px·UIMyInfo 앵커·QuickSlots hit)

- **작업**: T53 HUD 모바일 정비 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자)
- **수행 에이전트/환경**: Grok 구현 에이전트 · Maker refresh 가능 · Play 범위 밖
- **날짜**: 2026-07-15

## 1. 요약

MobileUI 인터랙티브 버튼 hit를 ≥88×88로 승격하고 Bag 행 pitch를 104로 벌렸다. UIMyInfo는 시각 위치 유지 상태로 top-left 앵커로 재작성하고 서브트리 `ActivePlatform=255`를 명시했다. QuickSlots는 시각 요소를 유지한 채 슬롯 hit만 88×88로 확대. 컨트롤러 경로/이름 불변 — `.mlua` 수정 0.

## 2. 수정 파일 목록

| 파일 | 변경 요지 |
|---|---|
| `ui/HUDGroup.ui` | MobileUI 버튼 크기·좌표, UIMyInfo 앵커/AP, QuickSlots hit |

## 3. 구현 상세

- **① MobileUI 88px**
  | 버튼 | 이전 | 이후 size | pos (bottom-right) |
  |---|---|---|---|
  | BtnBag | 75 | **88** | (-85, 295) |
  | BtnCraft | 75 | **88** | **(-189, 295)** pitch 104 |
  | BtnInfo | 75 | **88** | **(-293, 295)** |
  | BtnInteract | 75 | **88** | (-261, 164) |
  | BtnJump | 85 | **88** | (-248.5, 66) |
  | BtnMine | 110 | 110 유지 | (-130, 130) |
  - Icon/Label 자식 스케일 동반 조정(Icon 48×48).
- **② ActivePlatform**: MobileUI 유지 All(255). UIMyInfo 서브트리 전 엔티티 `ActivePlatform=255` 명시(이전 root undefined).
- **③ UIMyInfo 앵커 정합**
  - 이전: bottom-center AO=6, pos **(-745.95, 984)**, size 334×162, AP undefined
  - 화면 중심 환산: (-746, 444) center-origin
  - 이후: **top-left AO=4**, pivot (0.5,0.5), pos **(214, -96)**, size 334×162, AP=255
  - 등가: `x: -960+214=-746`, `y: 540-96=444` — 동일 시각 위치
  - 자식 상대 좌표 불변
- **④ QuickSlots**: 슬롯 RectSize **88×88**(hit), Icon 52·Border 65 유지(시각≈72). 컨테이너 820×88. 슬롯 x 좌표 불변.
- **컨트롤러**: `UIHUDController` / `UIMyInfoSimple` 무수정 — 경로 문자열 전부 생존.

## 4. 수행한 검증과 결과

- UIBuilder write + ui_lint: Error 0 (기존 HUD 경고 잔존, MobileUI L007 해소)
- Maker `maker_refresh_workspace`: ok
- 빌드 로그: total **492** · **Error=0** · Warning 17 · Info 475
- Play: **런타임 검증 보류(제작자 수행)**

## 5. 발견한 문제 / 후속 제안

- QuickSlots pitch≈78에 hit 88 → 인접 슬롯 hit 약 10px 겹침 가능. 드래그 타겟 주 용도라 수용; 필요 시 후속 pitch 조정 티켓.
- BtnCollection/BtnSkillTree 128×56은 본 티켓 범위 밖(≥88 한 축만 충족).

## 6. 제작자 런타임 체크리스트

- [ ] 모바일: Bag/Craft/Info/Interact/Jump 탭 영역 ≥88, 상호 오탭 최소
- [ ] UIMyInfo 좌상단 동일 위치 렌더 (이름/HP/MP/EXP)
- [ ] QuickSlots 드래그·번호 선택 회귀 0
- [ ] MobileUI 기존 배선(인벤/제작/정보/점프/채광/상호작용) 전부 동작
- [ ] PC에서도 MobileUI 노출 유지(ActivePlatform=All)

## 7. 이력

- 2026-07-15 최초 작성 (Grok worker)

## 부록: ui-aesthetics §7

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | Gray Box | PASS | 기존 스프라이트/라벨 유지, 크기만 승격 |
| 2 | 아이덴티티 | PASS | 신규 스타일 발명 0 |
| 3 | 패널 해부 | N/A | HUD 위젯 정합 |
| 4 | 터치 ≥88 | PASS | MobileUI+QuickSlots hit 실측 |
| 5 | 간격 | PASS | Bag 행 gap 16px (pitch 104−88) |
| 6 | 타이포 | PASS | 라벨 변경 최소 |
| 7 | stretch 함정 | PASS | fixed anchor+RectSize |
| 8 | 경로 불변 | PASS | 이름/경로 0 변경 |
