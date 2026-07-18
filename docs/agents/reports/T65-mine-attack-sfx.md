# T65 작업 보고서 — 채집·기본 공격 스윙/타격 사운드

- **작업**: T65 채집·기본 공격 스윙/타격 사운드 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP 무에러 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker 기동(refresh만), Play 미수행
- **날짜**: 2026-07-18

## 1. 요약 (3~5줄)

Ctrl 채광/공격에 스윙·타격 SFX를 데이터 주도(`item_dataset.SwingSoundRUID`/`HitSoundRUID`)로 연결했다. 빈 `ClientPlayMineEffect`에 자원 타격음을 채우고, 몬스터 피격은 `Monster.HandleHitEvent`→공격자 `MulticastPlaySkillSound` 선례로 전파한다. 음원은 msw-search 공식 `effect` RUID. 맨손 폴백은 PlayerController 프로퍼티. refresh **Error=0**. Play 체감은 제작자 수행.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | `DefaultSwing/HitSoundRUID` · `ResolveEquippedToolSound` · `ClientPlaySwingSound` · `ClientPlayMineEffect` 자원 타격 · TryMine 스윙 훅 |
| `RootDesk/MyDesk/Monster/Scripts/Monster.mlua` | `HandleHitEvent`에서 공격자 HitSoundRUID → `MulticastPlaySkillSound` |
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | `SwingSoundRUID`/`HitSoundRUID` 컬럼 + 도구 행 채움 |

## 3. 구현 상세

### ① 음원 (msw-search `effect`, 자작 금지)

| 용도 | RUID | 근거(검색 설명) |
|---|---|---|
| 맨손 스윙 폴백 | `6e1ff144b36649a681bad20b84b90625` | 짧은 whoosh |
| 맨손 타격 폴백 | `15d8f000508044ae9282464d6e4b4aac` | 펀치 타격 |
| 도끼 스윙 | `7cb2c70523ab465e8676392a73e25329` | 공기 가르는 스윙 |
| 도끼 타격 | `3aa9aec552dc468a90061e26d851f448` | 나무 타격 |
| 곡괭이 스윙 | `76f6b5668847405580db92b2d69c44fb` | 가벼운 whoosh |
| 곡괭이 타격 | `93b1f5aae2ff496ea026ae5f01e4f811` | 돌 파괴 |
| 삽/괭이 스윙 | `680a57905754484e9cfec10f9b54e7cf` | 짧은 whoosh (타격 공란) |

### ② CSV
- `SwingSoundRUID`/`HitSoundRUID` 컬럼 신설. 공란 = `Default*` 폴백. 이름 분기 없음.

### ③ 스윙음
- `TryMine` MINE 진입(채집/공격) + 지형 편집 tool(`isTerrainTool`)에서 `ClientPlaySwingSound` → `_SoundService:PlaySound` (ClientOnly, `.d.mlua` 실확인).

### ④ 타격음
- 자원: `RequestMine`→`ClientPlayMineEffect(true, resource)` → PlaySound.
- 몬스터: `HandleHitEvent` → `ResolveEquippedToolSound("HitSoundRUID")` → `MulticastPlaySkillSound` (T46 선례 재사용). 자원 경로와 이중 재생 방지(몬스터면 ClientPlayMineEffect 스킵).
- `_SoundService:PlaySound(id, volume)` / Multicast 경유 — `PlaySoundAtPos`는 미사용(2D 확정).

### 스펙 편차
- 없음. 스킬 시전 `SoundRUID` 경로 무수정.

## 4. 수행한 검증과 결과

- **LSP**: PlayerController / Monster 진단 Error=0.
- **Maker refresh**: `maker_refresh_workspace` status ok.
- **Build logs**: **Error=0** / Warning=25 / Info=492 / total=517 (`filter_build_errors.py`).
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 스킬 명중 시에도 도구 HitSoundRUID가 `HandleHitEvent`에서 재생됨(티켓 훅 준수). 시전음과 겹치면 CSV Hit 공란/교체로 튜닝 가능.
- 신규 T항목 발행 없음.

## 6. 제작자 런타임 체크리스트

- [ ] Ctrl 허공 스윙마다 스윙음
- [ ] 자원 명중 시 타격음 추가
- [ ] 몬스터 명중 시 타격음
- [ ] 도끼/곡괭이/맨손 소리 차등 (CSV 행만으로 교체 가능)
- [ ] 삽/괭이 지형 편집 시 스윙음만
- [ ] 스킬 시전 사운드(T46) 회귀 없음
- [ ] 로그 `[T65][SWING]` / `[T65][HIT]` 확인

## 7. 이력

- 2026-07-18 최초 작성 (Cursor Grok worker)
