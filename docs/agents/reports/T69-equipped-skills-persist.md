# T69 작업 보고서 — QWER 스킬 장착 영속화

- **작업**: T69 QWER 스킬 장착 영속화 — 재접속 초기화 수정 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | LSP 무에러 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Cursor Grok worker, Maker refresh만, Play 미수행
- **날짜**: 2026-07-18

## 1. 요약 (3~5줄)

T45가 세션 값으로 둔 `EquippedSkillsJson`을 세이브/로드에 포함했다. `SavePlayerData` 선캡처·저장 테이블에 `equippedSkills` 필드를 추가하고, 로드 시 `SkillLevelsJson` 복원 후·`SanitizeEquippedSkills()` 전에 복원한다. 신규 Yield 0. 구 세이브는 `or "[]"` 폴백. refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PersistenceManager.mlua` | 선캡처·저장·로드에 `equippedSkills` 추가 + `[T69][SAVE]` 로그 |

## 3. 구현 상세

### ① 선캡처 (규칙 9)
- `SavePlayerData` 기존 캡처 블록에 `local capEquippedSkills = pc.EquippedSkillsJson or "[]"` 추가.
- 추가 Yield 없음 — 기존 `GetAndWait`/`SetAndWait` 외 대기 호출 삽입 없음.

### ② 저장 테이블
- `data.equippedSkills = capEquippedSkills` 필드 추가 (`skillLevels` 인접).

### ③ 로드 순서
- `pc.SkillLevelsJson = data.skillLevels or "{}"` 이후
- `pc.EquippedSkillsJson = data.equippedSkills or "[]"`
- 그다음 `pc:SanitizeEquippedSkills()` (해금 레벨을 읽어 미해금/패시브/중복 제거 — `PlayerController` 기존 정의 재사용, 규칙 8 확인됨).

### ④ 무변경
- 신규 캐릭 리셋 경로(`EquippedSkillsJson = "[]"`) 유지.
- `PlayerController.mlua` 무수정.

### 스펙 편차
- 없음.

## 4. 수행한 검증과 결과

- **LSP**: PersistenceManager.mlua Error=0.
- **Maker refresh**: `{"status":"ok"}`.
- **Build**: **Error=0** / Warning=25 / Info=502 / total=527.
- **코드 리뷰(규칙 9)**: `SavePlayerData` 내 신규 Yield 0 — 선캡처·테이블 필드·로그만 추가.
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- 없음. 신규 T항목 발행 없음.

## 6. 제작자 런타임 체크리스트

- [ ] QWER에 스킬 장착 → 로그아웃/재접속 → 슬롯 그대로 유지
- [ ] 구 세이브(equippedSkills 없음) 로드 시 에러 없이 `"[]"`로 시작
- [ ] 미해금 스킬이 세이브에 섞여 있어도 로드 후 sanitize로 슬롯에서 제거
- [ ] 로그 `[T69][SAVE] capture equippedSkills=...` (저장 시) / `[T69][SAVE] load equippedSkills=...` (로드 시) 확인
- [ ] skillLevels·SP·인벤 등 기존 영속 회귀 0

## 7. 이력

- 2026-07-18 최초 작성 (Cursor Grok worker)
