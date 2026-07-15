# T55 작업 보고서 — 사운드 파운데이션 (맵별 BGM + 날씨 앰비언스)

- **작업**: T55 사운드 파운데이션 — 맵별 BGM + 날씨 앰비언스 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker refresh 가능, Play 미수행
- **날짜**: 2026-07-15

## 1. 요약

맵 kind(`home`/`town`/`field`/`boss`)별 BGM과 비(rain) 날씨 앰비언스를 데이터 주도(`BGMDataSet` + `WeatherDataSet.AmbienceSoundRUID`)로 재생하는 클라 `@Logic` `BGMManager`를 추가했다. `WeatherManager`·`PlayerController`는 수정하지 않았다. SoundService에 페이드 API가 없어 `FadeSec`은 CSV 예약만 하고 전환은 즉시 Stop+Play다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Sound.directory` | Sound 카테고리 디렉터리 신설 |
| `RootDesk/MyDesk/Sound/Scripts.directory` | Scripts 하위 디렉터리 |
| `RootDesk/MyDesk/Sound/DataSets.directory` | DataSets 하위 디렉터리 |
| `RootDesk/MyDesk/Sound/Scripts/BGMManager.mlua` | 클라 BGM/앰비언스 폴링 매니저 |
| `RootDesk/MyDesk/Sound/DataSets/BGMDataSet.csv` | MapKind→BgmRUID/Volume/FadeSec |
| `RootDesk/MyDesk/Sound/DataSets/BGMDataSet.userdataset` | 데이터셋 메타 |
| `RootDesk/MyDesk/Weather/DataSets/WeatherDataSet.csv` | `AmbienceSoundRUID` 컬럼 + rain 음원 |

## 3. 구현 상세

- ① **BGMDataSet**: home/town/field/boss 4행. 음원 msw-search `bgm` 검색 결과 공식 RUID.
  - home `cead8b04…` 평화 목가 / town `87455f5f…` 밝은 마을 / field `eb63df16…` 가벼운 모험 / boss `e81c438b…` 긴장 보스.
- ② **BGMManager**: `@Logic`, 클라 `IsClient` 가드. `LocalPlayer.CurrentMap` 폴링(`PollIntervalSec=0.5`). MapKind = T37 규약 + `template_boss`/`boss` 부분문자열→boss, 그 외 field. 같은 kind면 곡 재시작 없음. `_SoundService:PlayBGM` / `StopBGM(true)` / `IsPlayBGM` (`.d.mlua` 확인).
- ③ **날씨 앰비언스**: `_WeatherManager:GetCurrentWeatherId()`(읽기) → `WeatherDataSet.AmbienceSoundRUID`. rain만 설정, `PlayLoopSound` / `StopSound`로 BGM과 독립 채널.
- ④ 볼륨/음소거 UI = 범위 밖.
- **스펙 편차**: `FadeSec` 미적용 — SoundService 페이드 전환 API 부재, 즉시 전환 + 로그에 `fadeSecCsv` 기록.
- **하드코딩 RUID**: 코드 리터럴 0. 전부 CSV.

## 4. 수행한 검증과 결과

- Maker `maker_refresh_workspace` → build logs: **total 492 / Error=0 / Warning=17 / Info=475**.
- Play 런타임 검증 **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 페이드 인/아웃이 필요하면 SoundService 확장 또는 볼륨 램프 티커 후속 티켓.
- 설정 UI 음소거 토글은 후속(티켓 미발행).

## 6. 제작자 런타임 체크리스트

- [ ] 영지(`Home_*`) 입장 시 home BGM 재생 로그 `[T55][BGM] play kind=home`
- [ ] 마을(`town`) 이동 시 town BGM 전환
- [ ] 사냥터/필드 이동 시 field BGM
- [ ] 보스 맵 이동 시 boss BGM
- [ ] 같은 kind 맵 간 이동 시 곡 재시작 없음
- [ ] 비(weather=rain) 시작 시 `[T55][AMB] ambience on`, 종료 시 `ambience off`
- [ ] BGM과 빗소리 동시 재생
- [ ] 음량·톤 감성 밸런스 확인

## 7. 이력

- 2026-07-15 최초 작성 (Grok worker)
