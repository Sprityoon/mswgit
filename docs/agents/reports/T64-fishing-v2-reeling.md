# T64 작업 보고서 — 낚시 v2: 홀드-릴리즈 릴링 미니게임 + 낚시 숙련 레벨

- **작업**: T64 낚시 v2 — 홀드-릴리즈 릴링 미니게임 + 낚시 숙련 레벨 (`docs/agents/subagent-handoff.md` §3, Phase 15-C v2)
- **상태**: 코드 완료 | LSP 진단 errors=0·warnings=0 (전 수정 파일) | **refresh·Play 런타임 검증 보류(Maker 미기동 — 제작자 수행)**
- **수행 에이전트/환경**: Claude Code (Fable 5, 지휘자 직접 수행 — ⚖️ 보스 "직접 구현해도 돼" 2026-07-16). Maker MCP 미연결(에디터 미기동), mlua-diagnose LSP 훅 가용, UIBuilder 가용.
- **날짜**: 2026-07-18

## 1. 요약 (3~5줄)

기존 "입질 후 0.8초 윈도우, 놓치면 실패" 낚시를 폐지하고, **입질 시 자동으로 릴링 페이즈에 진입**하는 홀드-릴리즈 미니게임으로 개편했다(두근두근타운식 조작 + 스타듀식 어종 난이도·숙련 편차). 실패는 오직 **위험(⚠) 중 홀드 유지로 텐션 게이지 초과(줄 끊김)**뿐이다. 어종별 난이도·해금 레벨·숙련 XP는 `FishDataSet` 컬럼 3종 + 신규 `FishingDifficultyDataSet`(티어별 릴링 파라미터)으로 전부 데이터화했고, `FishingLevel`/`FishingXp`는 PersistenceManager 세이브에 영속화했다(규칙 9 선캡처 준수, Yield 추가 없음). HUD에 기존 비주얼 아이덴티티(공용 프레임 + UIMyInfo 바 패밀리 + 골드 액센트)를 그대로 쓴 `FishingGauge`를 신설했다. **Maker가 꺼져 있어 refresh/Play 검증은 수행하지 못했다 — 보류.**

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/item/DataSets/FishDataSet.csv` | 컬럼 3종 신설: `Difficulty`(릴링 티어 1~5) / `MinFishingLevel`(추첨 풀 진입 최소 숙련 — Salmon 3·Tuna 5) / `FishingXp`(어획 숙련 XP). 기존 컬럼·행 유지 |
| `RootDesk/MyDesk/item/DataSets/FishingDifficultyDataSet.csv` (신규) | 난이도 티어별 릴링 파라미터 테이블 — ProgressPerSec/ProgressDecayPerSec/TensionRisePerSec/TensionRecoverPerSec/DangerInterval(Min·Max)/DangerDuration(Min·Max). 튜닝=CSV 행 수정만 |
| `RootDesk/MyDesk/item/DataSets/FishingDifficultyDataSet.userdataset` (신규) | 데이터셋 래퍼 (name=`FishingDifficultyDataSet`, 신규 UUID) |
| `RootDesk/MyDesk/Furniture/Scripts/FishingSpot.mlua` | 릴링 상태기 전면 개편 — `Bite`/`TimeoutBite`(0.8초 미스) 폐지, `TriggerBite`=자동 릴링 진입 + 어종 확정(`RollFish(fishingLevel)` 레벨 풀 게이트), `ReelTick` 10Hz 서버 틱(진행/텐션/위험 스케줄), `SetReelHold`, `SucceedReel`(지급+낚시왕 점수+숙련 XP), `FailReel`(줄 끊김), `GetDifficultyParams`(CSV 조회+결손 안전값). 세션 관리·BiteTime·날씨 `FishBiteMult`(T21)·`AddCatchPoints`(T57) 재사용 |
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `FishingLevel`/`FishingXp` @Sync 신설 + 곡선 설정값(`FishingXpBase`/`FishingXpGrowth` 프로퍼티) + `AddFishingXP`(레벨업 처리) / OnUpdate 릴링 홀드 폴링(F `IsKeyPressed` + 모바일 홀드 플래그, 변화 시에만 `ServerSetReelHold` RPC) / `SetMobileReelHold`(ClientOnly) / 게이지 중계 Client RPC 3종(`ClientReelBegin/Update/End` — targetUserId 지정) / TryInteract·OnInteractButton·ServerRequestFishingInteract에 Reeling 가드 |
| `RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua` | 세이브 선캡처에 `fishingLevel`/`fishingXp` 추가(규칙 9 — Yield 추가 없음), 로드 폴백(`or 1`/`or 0`), `SetDefaultPlayerData` 리셋 |
| `RootDesk/MyDesk/UI/Scripts/UIHUDController.mlua` | BtnInteract에 `ButtonStateChangeEvent`(Pressed/Released) 핸들러 추가 → `SetMobileReelHold` 전달 + OnEndPlay 해제. 기존 ButtonClickEvent 경로 무변경 |
| `RootDesk/MyDesk/UI/Scripts/UIFishingGaugeController.mlua` (신규) | HUD 게이지 컨트롤러 — Show/UpdateGauge/Hide, 위험 중 ⚠ 점멸+진행바 적색 틴트, 바인딩 UUID는 UIBuilder 주입 |
| `ui/HUDGroup.ui` | `FishingGauge` 신설(UIBuilder — bottom-center [0,200] 480×148): 공용 프레임 패널 + 진행 게이지(금색, Filled) + 텐션 게이지(적색, 얇게) + 힌트/⚠ 경고 텍스트. 단일 고정 레이아웃(§1.5), 표시 전용(터치 타겟 해당 없음) |
| `docs/agents/subagent-handoff.md` / `game_design.md` | T64 상태 갱신 / 15-C 트래커 v2 반영 |

스크래치(빌더 스크립트, 산출물 아님): `scratch/build_fishing_gauge_t64.cjs`, `scratch/inspect_hud_t64.cjs`, `scratch/audit_fishing_gauge_t64.cjs`

## 3. 구현 상세 (스펙 ①~⑥ 대비)

- **① 입질 후 미스 제거**: `TimeoutBite`·0.8초 윈도우 삭제. `TriggerBite`가 곧바로 세션을 `Reeling`으로 전환 — 실패 경로는 `FailReel`(텐션≥100) 하나뿐. 이동키 입력은 기존대로 "취소"(도망 아님·패널티 없음, 기존 `ServerRequestCancelFishing` 재사용).
- **② 릴링(홀드-릴리즈)**: 서버 `ReelTick` 0.1s(프로퍼티 `ReelTickInterval`) — 홀드 중 진행 +`ProgressPerSec`·위험 중 텐션 +`TensionRisePerSec`×완화배율, 릴리즈 중 진행 −`ProgressDecayPerSec`·텐션 −`TensionRecoverPerSec`. 위험 페이즈는 `DangerInterval/Duration` 랜덤 스케줄. 진행≥100=어획, 텐션≥100=줄 끊김. 게이지 상한 `GaugeMax` 프로퍼티.
- **③ 어종 편차(CSV)**: `Difficulty`/`MinFishingLevel`/`FishingXp` 컬럼 신설 + 티어 파라미터는 신규 `FishingDifficultyDataSet`(1~5행). `RollFish`가 SpotType+레벨 게이트 통과 행만 가중 추첨. 신규 컬럼 접근은 전부 `pcall` 가드(규칙 7)·공란 폴백.
- **④ 낚시 숙련 레벨**: `FishingLevel`/`FishingXp` @Sync + `AddFishingXP`(필요 XP = `FishingXpBase`×`FishingXpGrowth`^(level−1) — 프로퍼티). 레벨 효과 = 텐션 완화(`TensionReliefPerLevel`=0.04/레벨, 하한 `TensionReliefMinMult`=0.4 — FishingSpot 프로퍼티) + `MinFishingLevel` 풀 개방. 영속은 PersistenceManager(선캡처+dirty 마킹, **세이브 루틴에 Yield 추가 없음**).
- **⑤ UI**: `FishingGauge` — 기존 HUD 아이덴티티 실측 재사용: 패널 프레임 RUID `4fea64a3…`(QuestToast/BuffBar/SkillSlot 공용), 바 배경 `f7ebaa33…`+fill `f0911af5…`(UIMyInfo HP/EXP 바 패밀리), 골드 액센트 `#F0A830`(BuffBar 텍스트와 동일값). 진행=금색 Filled, 텐션=적색 얇은 바, 위험=⚠ 점멸+진행바 적색 틴트. 낚시(릴링) 중에만 표시(컨트롤러가 Panel Enable 토글 — 스크립트 홀더는 상시 enable로 라이프사이클 보장).
- **⑥ 입력**: 규칙 8 사전 확인 — `KeyUpEvent`·`ButtonStateChangeEvent`(state: ButtonState Pressed=2/Released=3) 정의를 `Environment/NativeScripts/Event/`에서 실확인, **[보류] 불필요 판정**. 구현은 KeyUp 이벤트 대신 **OnUpdate 폴링**(F `IsKeyPressed` ∨ 모바일 홀드 플래그, 상태 변화 시에만 RPC — 캐스팅 중 홀드 잔존 등 엣지 케이스에 견고). 모바일 = BtnInteract `ButtonStateChangeEvent` Pressed/Released → `SetMobileReelHold`. 릴링 중 ButtonClick(릴리즈 시 발화)·F 단발은 가드로 무시.
- **스펙에서 벗어난 결정**: ① Target에 없던 `UIHUDController.mlua` 수정 — 스펙 ⑥의 모바일 down/up 경로가 BtnInteract 배선 소유 파일이라 불가피(최소 diff: 핸들러 1쌍 추가). ② FishingSpot의 신규 피드백 메시지에 `targetUserId`를 지정(기존 v1은 전 클라 브로드캐스트 — 멀티플레이 시 타인 메시지 노출 결함이라 신규 경로에서 교정, 기존 캐스팅/취소 메시지도 userId 지정으로 정리). ③ 티어 파라미터를 별도 CSV(`FishingDifficultyDataSet`)로 분리 — 스펙 ③ "Difficulty=티어"의 데이터 주도 구현체(신규 티어=CSV 행 추가만). 하드코딩 예외 없음 — 수치는 전부 CSV/프로퍼티.
- **재사용**: 세션 구조·BiteTime·날씨 배율(T21)·낚시왕 적립(T57/T63)·`MarkPlayerDirty`·`ClientShowMineFeedback`·HUD 바 RUID 패밀리. **신규**: 릴링 상태기·`FishingDifficultyDataSet`·`UIFishingGaugeController`·숙련 레벨 축.

## 4. 수행한 검증과 결과

- **LSP 진단 (mlua-diagnose 훅, 저장 시 자동)**: 수정 `.mlua` 5종 전부 **errors=0 / warnings=0** (info만 잔존 — 크로스 스크립트 동적 디스패치 LIA-1114 계열, 기존 코드베이스 공통 노이즈).
- **UIBuilder 산출 검증**: `write()` 자동 ui_lint 통과(error 0 / warning 65 — 기존 파일 누적 경고, 신규 엔티티 기인 에러 없음). 빌드 후 `UIBuilder.read`로 재조회 실측 — 9개 엔티티 생성, Fill 게이지 `Type=3/FillMethod=0/FillAmount=0`, `ActivePlatform=255`, WarnText `enable=false`, 바인딩 5종 UUID 주입 확인.
- **크로스 스크립트 정의 확인 (규칙 8)**: `KeyUpEvent`/`ButtonStateChangeEvent`/`ButtonState` — `.d.mlua` 실확인. `AddCatchPoints`/`GetFishBiteMult`/`MarkPlayerDirty`/`AddItem` — 기존 호출부 존재 확인.
- **보류**: **Maker refresh 빌드(Error 수) — 미수행(Maker MCP 미연결·에디터 미기동)**. Play 런타임 검증 전량 보류(제작자 수행). ⚠ 신규 `.mlua`/`.userdataset`은 refresh 전까지 미등록 — 첫 refresh에서 `.codeblock` 생성 후 Error=0 확인 필요(신규 스크립트 참조 특성상 stale 캐시 1사이클 가능 — 에러 시 refresh 재실행).

### ui-aesthetics §7 자가 리뷰 루브릭 (빌드된 .ui 실측 기준)

| # | 체크 | 판정 | 근거 (실측) |
|---|---|---|---|
| 1 | 알몸 패널 없음 | PASS | Panel에 HUD 공용 프레임 RUID `4fea64a3…` + 서피스 틴트 (0.129,0.161,0.133,0.92) |
| 2 | 헤더 존 구분 | PASS | 상단 골드 볼드 타이틀 "릴링!" (22 bold `#F0A830`) — HUD 스트립 규모에 맞는 헤더 처리 |
| 3 | 팔레트 절제 | PASS | 서피스 1 + 골드 액센트 1 + 위험 적색 1 + 본문 회갈색 1 (≤6색, 순수 #000/#FFF 채움 없음) |
| 4 | 타이포 계층 | PASS | 22 bold(타이틀) / 20 bold(경고) / 18(힌트) — 3단 |
| 5 | 간격 리듬 | PASS | 좌우 마진 30px 균일(바 420/패널 480), 바 피치 36px 균일 — 기존 HUD 스트립(QuestToast/BuffBar) 밀도 관례와 정합 |
| 6 | 역할·상태 구분 | PASS | 진행(금색·22px 두께) vs 텐션(적색·12px 얇음) + 위험 시 2채널 이상 변화(⚠ 점멸 + 진행바 적색 틴트 + 힌트 숨김) |
| 7 | 프로젝트 일관성 | PASS | 프레임=QuestToast/BuffBar/SkillSlot 공용 RUID, 바=UIMyInfo HP/EXP RUID 패밀리, 골드=BuffBar 텍스트와 동일값 (0.941,0.659,0.188) |
| 8 | 액센트 경제 | PASS | 골드는 타이틀+진행 게이지(핵심 정보)에만 |

## 5. 발견한 문제 / 후속 제안

- **기존 v1 결함 관찰**: `ClientShowMineFeedback`를 targetUserId 없이 호출하면 전 클라이언트에 브로드캐스트된다(Client RPC 규약). FishingSpot 내 호출은 이번에 전부 userId 지정으로 교정했으나, **타 스크립트에 동일 패턴이 남아 있을 수 있음** — 전수 감사는 별도 티켓 후보(신규 T 발행은 보류, 지휘자 판단 대기).
- 난이도·XP 곡선 수치는 1차 제안값 — 제작자 Play 감성 피드백 후 CSV/프로퍼티 튜닝만으로 조정 가능.
- 후속 후보: 낚시 숙련 레벨 HUD/캐릭터 창 노출(현재는 레벨업 메시지만), 낚시왕 보상 지급(T57 §5 기존 제안).

## 6. 제작자 런타임 체크리스트 (Acceptance)

- [ ] ① 입질 후 "그냥 놓침" 0 — 입질 시 자동 릴링 진입, 실패는 텐션 초과(줄 끊김)뿐 (`[T64][FISHING] Reeling started` 로그)
- [ ] ② 위험(⚠ 점멸) 중 홀드 유지 → 텐션 상승 → 줄 끊김(`Line broken` 로그) / 릴리즈-재홀드 리듬으로 어획 성공
- [ ] ③ 어종별 난이도 체감 차이(Carp vs Salmon/Tuna) + 숙련 레벨업 시 고레벨 어종 등장·텐션 완화 (`fishingLevel=`·`reliefMult=` 로그)
- [ ] ④ 재접속 후 숙련 레벨/XP 유지 (세이브 로드)
- [ ] ⑤ 낚시왕 랭킹(T57/T63) 적립·즉시 반영 무회귀 + 날씨 입질 보너스(T21) 무회귀 (`weatherMult=` 로그)
- [ ] ⑥ 모바일 BtnInteract 꾹 누름/떼기로 릴링 동작 (PC F와 동일)
- [ ] ⑦ 게이지 표시/숨김 정상 — 릴링 중에만 표시, 성공/실패/취소/이동 취소 시 숨김 (`[T64][GAUGE] Show/Hide` 로그)
- [ ] ⑧ refresh 빌드 Error=0 (신규 스크립트 2종·데이터셋 1종 등록 — 첫 refresh에서 확인)

## 7. 이력

- 2026-07-18 최초 작성 (Claude Code Fable 5 — 지휘자 직접 수행. Maker 미기동으로 refresh/Play 보류)
