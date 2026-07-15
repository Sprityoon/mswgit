# T56 작업 보고서 — 마을 NPC 생활감 (주민 대화 말풍선)

- **작업**: T56 마을 NPC 생활감 — 주민 대화 말풍선 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker refresh 가능, Play 미수행
- **날짜**: 2026-07-15

## 1. 요약

촌장·낚시꾼 주민 2명을 마을에 배치하고, `DialogDataSet` 기반 시간대/날씨 필터 대사를 `ChatBalloonComponent` 머리 위 말풍선으로 표시한다. F/터치 상호작용 + 근처 플레이어 있을 때 자동 혼잣말(15초).

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/NPC/Scripts/VillagerDialog.mlua` | F/터치 대화 + 자동 혼잣말 + ChatBalloon |
| `RootDesk/MyDesk/NPC/DataSets/DialogDataSet.csv` | 대사 12행 (elder/fisher × day/night/weather) |
| `RootDesk/MyDesk/NPC/DataSets/DialogDataSet.userdataset` | 데이터셋 메타 |
| `RootDesk/MyDesk/NPC/DataSets.directory` | NPC/DataSets 디렉터리 |
| `RootDesk/MyDesk/NPC/Models/Villager_Elder.model` | Merchant 복제 + VillagerDialog |
| `RootDesk/MyDesk/NPC/Models/Villager_Fisher.model` | Merchant 복제 + VillagerDialog |
| `map/town.map` | Villager_Elder(4,0.5) / Villager_Fisher(-3.5,-3.4) 배치 |

## 3. 구현 상세

- **R1 dialog-package**: 공식 `dialog-package`는 **화면 UI 타이프라이터 대화**(Popup 경로)이며 월드 머리 위 말풍선을 지원하지 않음 → **부적합, 자작**.
- **월드 말풍선**: 기존 Merchant 모델에 이미 있는 `ChatBalloonComponent` 미러 — `Message`/`ShowDuration` 설정. HUD/Popup `.ui` 무수정.
- **MerchantInteract 패턴**: F 키 + TouchEvent, 거리 게이트, 서버 `ServerRequestTalk`에서 추첨.
- **필터**: `TimeBand` day|night|any via `_PersistenceManager:IsNight()` (읽기), `WeatherId` via `_WeatherManager` (읽기).
- **자동 혼잣말**: 서버 OnUpdate, `AutoTalkInterval` 프로퍼티, 근처 플레이어 있을 때만.
- 이름 분기 0 — `NpcId` 컬럼 매칭만.

## 4. 수행한 검증과 결과

- Maker `maker_refresh_workspace` → build: **total 492 / Error=0 / Warning=17 / Info=475**.
- `VillagerDialog.codeblock` 생성 확인.
- Play 런타임 검증 **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 없음 (범위 내). 말풍선 폰트/스케일 튜닝은 제작자 Play 피드백 후 후속.

## 6. 제작자 런타임 체크리스트

- [ ] 마을 촌장/낚시꾼 2명 표시
- [ ] F 접근 → 말풍선 3~5초 표시·소멸, 로그 `[T56][DIALOG] balloon`
- [ ] 낮/밤 대사 차이 (로그 band=day|night)
- [ ] 비 날씨 시 낚시꾼 rain 대사 비중 증가 (로그 weather=rain)
- [ ] 근처 있을 때 자동 혼잣말 (~15초)
- [ ] HUD/Popup UI 회귀 없음

## 7. 이력

- 2026-07-15 최초 작성 (Grok worker)
