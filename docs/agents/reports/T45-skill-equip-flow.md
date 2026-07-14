# T45 작업 보고서 — 스킬 해금·장착 흐름 정합

- **작업**: T45 스킬 해금·장착 흐름 정합 — QWER 선장착 제거 + 장착 RPC + 시전 검증 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | refresh Error=0 | 런타임 검증 보류(제작자 수행)
- **수행 에이전트/환경**: Grok worker, Maker 기동, refresh 수행
- **날짜**: 2026-07-14

## 1. 요약 (3~5줄)

신규 캐릭터가 해금 없이 QWER 완비로 시작하던 문제를 제거했다. `EquippedSkillsJson` 기본값을 `[]`로 바꾸고, 장착/해제 RPC·해금 시 빈 슬롯 자동 장착·로드 시 미해금 필터·트리 팝업 QWER 장착 UX·스킬바 빈 슬롯 시각을 추가했다. 시전 서버 검증(레벨≥1)은 기존에 이미 존재함을 확인. refresh **Error=0**.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `Player/Scripts/PlayerController.mlua` | 기본 장착 `[]`, Equip RPC, AutoEquip, Sanitize, 슬롯 정규화 |
| `Player/Scripts/PersistenceManager.mlua` | 로드/디폴트 후 `SanitizeEquippedSkills` |
| `UI/Scripts/UISkillTreeController.mlua` | 선택·QWER 장착 버튼·상세 표시 |
| `UI/Scripts/UISkillBarController.mlua` | 빈/잠김/장착 슬롯 톤 구분 |
| `ui/PopupGroup.ui` | SkillTree EquipBar (DetailText + BtnQWER) |

## 3. 구현 상세

- **①** `EquippedSkillsJson` 기본값 `"[]"`.
- **②** `ServerRequestEquipSkill(slotIndex, skillId)`: sender 검증, 미해금 거부, Passive 거부, 중복 슬롯 스왑, 빈 skillId=해제.
- **③** `ServerRequestCastSkill` / 클라 `TryCastSlot` — 이미 `GetSkillLevel < 1` 차단 존재(추가 불필요).
- **④** `ServerRequestSkillLevelUp` 0→1 직후 `TryAutoEquipOnUnlock`(빈 슬롯만, 패시브 제외).
- **⑤** SkillTreePopup 하단 EquipBar: 노드 클릭=선택+해금/강화 RPC, QWER=장착/토글 해제. 스킬바 빈 슬롯 `—`+어두운 배경.
- **⑥** `SanitizeEquippedSkills` — 로드·디폴트 경로에서 미해금/패시브/중복 제거. 세이브 스키마 무변경.
- **스펙 편차**: 없음. 장착 목록 영속은 티켓 범위 밖(세이브 경로 무변경).

## 4. 수행한 검증과 결과

- **Maker `maker_refresh_workspace`**: status=ok (Play 중지 후).
- **Build logs**: **Error=0** / Warning=13 / Info=440 / total=453.
- **Play 런타임 검증**: **보류(제작자 수행)**.

## 5. 발견한 문제 / 후속 제안

- `EquippedSkillsJson`은 현재 세이브에 저장되지 않음 — 재접속 시 기본 `[]`로 시작 후, 이미 해금된 스킬은 트리에서 재장착 필요(자동 장착은 해금 순간의 빈 슬롯만). 영속이 필요하면 후속 티켓.

## 6. 제작자 런타임 체크리스트

- [ ] 신규/디폴트 캐릭 QWER 공백(빈 슬롯 `—`)
- [ ] 레벨업 SP → K 트리 해금 → 빈 슬롯 자동 장착(액티브)
- [ ] 트리 QWER 버튼으로 수동 장착/스왑/해제
- [ ] 패시브 장착 시도 시 거부 토스트
- [ ] 미해금 스킬 시전 불가
- [ ] 구세이브 로드 후 미해금 장착 정리·해금분 유지

## 7. 이력

- 2026-07-14 최초 작성 (Grok worker)

## 8. ui-aesthetics §7 자가 리뷰 루브릭

| # | Check | 결과 | 근거 |
|---|-------|------|------|
| 1 | No naked panels | PASS | EquipBar Bg 서페이스 스프라이트(기존 칩 RUID) |
| 2 | Header zone | PASS | 기존 Title/SPText 유지 |
| 3 | Palette discipline | PASS | 골드 액센트+서페이스 idle, 프로젝트 토큰 |
| 4 | Type hierarchy | PASS | Detail 15 / 버튼 16 / 힌트 14 |
| 5 | Rhythm | PASS | 버튼 56×36 gap 8(64 pitch) |
| 6 | Role & state | PASS | 장착 슬롯 골드 vs idle 이중 채널 |
| 7 | Project consistency | PASS | Craft/Collection 칩 톤 재사용 |
| 8 | Accent economy | PASS | 선택/장착 표시에만 골드 |

**§7 총평**: 8/8 PASS
