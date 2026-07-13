# T21 작업 보고서 — 날씨 시스템 (맑음/비/안개 + 성장·입질 보너스)

> **용도**: `docs/agents/subagent-handoff.md` §4 보고 형식의 산출물.

- **작업**: T21 날씨 시스템 — 맑음/비/안개 + 성장·입질 보너스 (Phase 15-F)
- **상태**: 코드 완료 | Maker refresh 빌드 **Error=0** (total 450 / Warning 13 / Info 437) | **런타임 검증 보류(제작자 수행)**
- **수행 에이전트/환경**: Grok 구현 에이전트, Maker 기동·refresh 수행, Play 미실행
- **날짜**: 2026-07-13

## 1. 요약 (3~5줄)

Phase 15 날씨 인프라를 데이터 주도(@Logic `WeatherManager` + `WeatherDataSet`)로 추가했다. 서버가 Weight 추첨→Duration 유지→재추첨하며 `@Sync`로 클라 오버레이·시계 표시명을 브로드캐스트한다. 비일 때 1분마다 영지 작물 `plantedAt`을 `CropBoostPerMin`초 당기고, 낚시 입질 대기시간에 `FishBiteMult`를 곱한다. 페널티(음수 부스트·입질 지연)는 클램프. EffectRUID 파티클은 CSV 공란 → **틴트만** (후속 아트 바인딩 가능). Play 검증은 제작자 범위.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Weather/WeatherManager.mlua` | **신규** @Logic 전역 날씨 롤·@Sync·작물 부스트 틱·API |
| `RootDesk/MyDesk/Weather/DataSets/WeatherDataSet.csv` | **신규** clear/rain/fog 3행 |
| `RootDesk/MyDesk/Weather/DataSets/WeatherDataSet.userdataset` | **신규** 데이터셋 메타 |
| `RootDesk/MyDesk/MapObjects/Scripts/Crop.mlua` | `ApplyWeatherGrowthBoost` — plantedAt 당김+로그 |
| `RootDesk/MyDesk/Furniture/Scripts/FishingSpot.mlua` | `StartFishing` 입질 대기 × FishBiteMult + 로그 |
| `RootDesk/MyDesk/UI/Scripts/UIHUDController.mlua` | WeatherOverlay 레이어 + 시계 날씨명 + OverlayColor 틴트 |

## 3. 구현 상세

### Change ① 서버 롤 + @Sync
- `WeatherManager` OnBeginPlay → `RollWeather()`: `WeatherDataSet` Weight 가중 추첨 → DurationMin~Max 유지 → `SetTimerOnce`로 재롤.
- `@Sync`: `CurrentWeatherId` / `CurrentDisplayName` / `CurrentOverlayColor` / `CurrentEffectRUID` / `CurrentCropBoostPerMin` / `CurrentFishBiteMult`.
- 로그: `[WEATHER] roll id=... duration=... cropBoost=... fishMult=...`

### Change ② 클라 오버레이
- 밤 `NightOverlay`와 **별도** `WeatherOverlay`(uisprite StretchAll).
- `OverlayColor` CSV 포맷 `r|g|b|a` (0~1, 파이프 구분 — CSV 쉼표 충돌 방지).
- 시계 텍스트: `🌞 낮 HH:MM · 비` 형태 (`DisplayName` @Sync).
- **EffectRUID**: 초기 3행 모두 공란 → 틴트만. 파티클 바인딩은 CSV 셀 기입만으로 확장 여지 남김(현재 런타임 파티클 스폰 미구현 — 틴트 우선).

### Change ③ 비 작물 훅
- `WeatherManager.ApplyCropBoostTick` 60s 반복: 접속 유저 `Home_{userId}` 맵의 `script.Crop`에 `ApplyWeatherGrowthBoost(boost)`.
- `Crop.ApplyWeatherGrowthBoost`: `PlantedAtUnix -= boostSeconds` (성숙 스킵, boost≤0 거부) + `[WEATHER] crop boost` 로그 + 비주얼 갱신.

### Change ④ 낚시 입질 훅
- `waitTime *= _WeatherManager:GetFishBiteMult()` (≤0이면 1.0).
- 로그: `[FISHING] ... wait=... weatherMult=... weather=...`

### Change ⑤ 초기 3종 (CSV)

| WeatherId | DisplayName | Weight | Duration | CropBoostPerMin | FishBiteMult | 비고 |
|---|---|---|---|---|---|---|
| clear | 맑음 | 50 | 120~240s | 0 | 1.0 | 기본 |
| rain | 비 | 30 | 90~180s | 30 | 0.7 | 성장·입질 보너스 |
| fog | 안개 | 20 | 90~150s | 0 | 1.0 | 무드 틴트만 |

- **FishBiteMult 의미**: BiteTime(대기 초) 배수. `<1` = 입질 단축 보너스. `>1`은 페널티로 간주해 적용 시 **1.0 클램프**.
- **DisplayName** 컬럼: 스펙 최소 컬럼 외 UI 표시용 추가(이름 분기 0 — 전부 데이터).

### 스펙 이탈 / 재사용
- 이탈: 없음(하드코딩 승인 요청 없음). 폴백 문자열 `"clear"`/`"맑음"`은 데이터셋 부재 시 안전 폴백만.
- 재사용: 밤낮 패턴(`PersistenceManager` 시간 + `UIHUDController` 오버레이), 낚시/작물 기존 타이머 모델, `GetAllRow`+Weight 추첨(FishingSpot/Request 패턴).

## 4. 수행한 검증과 결과

| 검증 | 결과 |
|---|---|
| Maker `refresh` | **ok** |
| `logs(kind=build)` | **Error=0**, Warning=13(기존 소음 LWA-1111/4012), Info=437, total=450 |
| 크로스스크립트 LIA-1113 `_WeatherManager` | Info 오탐(§17.2) — 빌드 통과 |
| Play / 런타임 로그 | **보류** — 제작자 수행 |

## 5. 발견한 문제 / 후속 제안

- **EffectRUID 파티클 미연출**: CSV 컬럼·@Sync 슬롯은 준비됐으나 공란 + 클라 파티클 스폰 코드 없음. 틴트만. 아트 RUID 확보 후 CSV 기입과 간단한 스폰 훅이 필요하면 후속 T항목 권장(이번 티켓 범위 밖 확장).
- 없음 외 신규 버그 티켓 추가 없음.

## 6. 제작자 런타임 체크리스트

- [ ] Play 시작 직후 서버 로그 `[WEATHER] WeatherManager OnBeginPlay` + `[WEATHER] roll id=...`
- [ ] 시계 UI에 낮/밤 + 날씨 표시명(맑음/비/안개) 갱신
- [ ] 비/안개 시 화면 틴트(WeatherOverlay) 전환, 맑음 시 투명
- [ ] 영지에 작물 심고 비 동안 ~1분 대기 → `[WEATHER] crop boost` 로그 + 성장 가속 체감
- [ ] 낚싯대 장착 후 스폿 F → 캐스팅 로그에 `weatherMult`·`wait` 반영(비일 때 wait 단축)
- [ ] 페널티 체감 0(성장 지연·입질 지연 없음)
- [ ] CSV 행 추가만으로 신규 날씨 후보가 롤에 포함되는지(선택)

## 7. 이력

- 2026-07-13 최초 작성 (Grok 구현 에이전트) — 코드 완료, refresh Error=0, Play 보류
