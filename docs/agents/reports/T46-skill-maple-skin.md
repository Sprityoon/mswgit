# T46 작업 보고서 — 원작 메이플 스킬 리소스 스킨

- **작업**: T46 원작 메이플 스킬 리소스 스킨 + 기초 스킬 세트 정렬 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker 기동, msw-search 리소스 확보
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

msw-packages에 스킬 시스템 전용 패키지 없음(R1 통과 — 자작 인프라 유지). 원작 skill resource_pack에서 Effect/Icon/Sound RUID를 확보해 액티브 4스킬에 바인딩. SkillId 6종 유지(세이브 호환). 표시명 원작풍 교체, IconRUID/SoundRUID 컬럼 신설, 스킬바·트리 아이콘 표시, 시전 시 MulticastPlaySkillSound 추가. 패시브 2종은 아이콘/이펙트 placeholder(공란+텍스트 폴백). refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `Player/DataSets/SkillDataSet.csv` | IconRUID/SoundRUID 컬럼, Effect·Name·Desc 원작 매핑 |
| `Player/Scripts/PlayerController.mlua` | `MulticastPlaySkillSound` + Cast 시 SoundRUID 재생 |
| `UI/Scripts/UISkillBarController.mlua` | 슬롯 Icon 자식 ImageRUID |
| `UI/Scripts/UISkillTreeController.mlua` | 노드 Icon 표시 |
| `ui/HUDGroup.ui` | SkillSlot1~4/Icon |
| `ui/PopupGroup.ui` | Node_*/Icon |

## 3. 구현 상세

### ① R1
- msw-packages 카탈로그: skill 전용 패키지 **없음**. 기존 S1~S4 인프라 유지.

### ②③ 매핑 표 (SkillId 불변 · 게이트/밸런스 컬럼 무변경)

| SkillId | 표시명(Name) | EffectRUID (pack effect) | IconRUID | SoundRUID (Use/hit) | 원작 pack 근거 |
|---|---|---|---|---|---|
| power_strike | 파워 스트라이크 | `522793cef4ff4b79bdf73b9eda9386f8` | `5c61ff8df1544c05a200e598ea9164ce` | `0befa14a10314d6685ed86f1ff66f271` (generic hit SFX — pack 무오디오) | `skill/800033.img/skill/80003316` |
| fireball | 매직 클로 | `cec1e8c25553408993b680b46baf1c36` | `f3fcac2d460041b288cc1973caaaf30f` | `eb233a9d36c44eb59841219b7ad7af71` | `skill/800016.img/skill/80001661` |
| dash | 플래시 점프 | `86500681cfad4e8488cf4ba9376fe801` | `e7b7455d8b7343bdaeb0e92bb9fbbda5` | `d6cd119e1f834752b13d6cd8fec5ad0f` | `skill/14200.img/skill/142000006` |
| earth_shatter | 슬래시 블러스트 | `eaa71284041b4c8390c32ade11286e16` | `1dc02c9673284efb94da9c86e7414eeb` | `afbb81b51fed47eaaee26cc403d59ccf` | `skill/100.img/skill/1001005` |
| swift_gather | 신속 채집 | (공란) | (공란) | (공란) | 패시브 — 원작 1:1 pack 미확보, 텍스트 폴백 |
| mine_power | 강력 채집 | (공란) | (공란) | (공란) | 동일 |

### ④ UI
- 스킬바/트리 Icon 자식 추가. IconRUID 공란 시 숨김 + 이름 텍스트 폴백.

### ⑤ 시전 연출
- EffectRUID: 기존 `MulticastPlayEffect` 경로 유지.
- SoundRUID: `MulticastPlaySkillSound` → `_SoundService:PlaySound` 신설.

### 스펙 편차
- 파워 스트라이크 pack에 `_audio` 없음 → 범용 skill hit SFX 1개 사용(보고). 감성 픽 교체는 CSV 셀.

## 4. 수행한 검증과 결과

- **Maker refresh**: status=ok.
- **Build logs**: **Error=0** / Warning=13 / Info=439 / total=452.
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 패시브 아이콘은 원작 매핑 미확보 — 제작자 감성 픽 시 CSV 셀만 채우면 됨.
- 전직(JobId)은 16-C 예약 — 본 티켓 범위 밖.

## 6. 제작자 런타임 체크리스트

- [ ] 스킬바·트리에 액티브 4종 아이콘 표시
- [ ] 해금 스킬 시전 시 이펙트+사운드 재생
- [ ] 패시브 텍스트 표시 정상(아이콘 없음)
- [ ] 해금/레벨 게이트·SP 비용 회귀 없음
- [ ] 감성 불만 시 CSV Effect/Icon/Sound 셀만 교체

## 7. 이력

- 2026-07-14 최초 작성 (Grok worker)

## 8. ui-aesthetics §7 자가 리뷰 루브릭

| # | Check | 결과 | 근거 |
|---|-------|------|------|
| 1 | No naked panels | PASS | 기존 패널 유지, 아이콘 스프라이트만 추가 |
| 2 | Header zone | PASS | 무변경 |
| 3 | Palette discipline | PASS | 아이콘 원색, 잠김 시 디밍 |
| 4 | Type hierarchy | PASS | 기존 텍스트 계층 유지 |
| 5 | Rhythm | PASS | 슬롯 아이콘 40×40, 노드 28×28 정렬 |
| 6 | Role & state | PASS | 잠김 아이콘 디밍 vs 보유 정상 |
| 7 | Project consistency | PASS | 기존 스킬바/트리 골격 유지 |
| 8 | Accent economy | PASS | 원작 아이콘이 시각 초점 |

**§7 총평**: 8/8 PASS
