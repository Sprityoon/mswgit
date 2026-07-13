---
name: msw-worker
description: 이 프로젝트의 T티켓 구현자(worker) 표준 절차. 사용자가 "T<번호> 착수/구현/재작업", "다음 큐 진행", "구현자 역할", "마저 작업하자", "중단된 작업 다시 시작"이라고 하거나 subagent-handoff.md의 작업 큐 항목을 수행할 때 사용. 공통 컨텍스트 로드 → 레인 소유권 준수 → 구현 → 검증 체인 → 보고 3종까지 한 절차로 강제한다.
---

# MSW Worker — T티켓 구현 표준 절차

이 스킬은 [docs/agents/subagent-handoff.md](../../../docs/agents/subagent-handoff.md) 기반 구현 작업의 **체크리스트**다. 순서대로 수행하고 건너뛰지 않는다.

## 1. 착수 (Setup)

1. `docs/agents/subagent-handoff.md` **§1 공통 컨텍스트 전체**를 Read (절대 규칙 §1.2, 타일 스킴 §1.3, 검증 프로토콜 §1.4 포함).
2. §3 작업 큐에서 **지정된 T항목**의 Target / Change / Acceptance / 충돌 주의를 Read. 지정 티켓이 없으면 사용자에게 어느 티켓인지 확인 (임의 착수 금지 — 과거 무보고 착수 4회가 사고 원인).
3. 해당 티켓 상태를 `[진행]`으로 갱신 (자기 티켓 블록 라인만 편집).
4. AGENTS.md §2 절대 규칙(R1 프리셋 우선, R2 mlua 문법, R3 하드코딩 금지)을 확인하고, 도메인에 맞는 MSW 스킬을 라우터 리마인더에 따라 로드.

## 2. 레인 소유권 (Lane Ownership) — 병렬 배치 시 필수

- 티켓의 "소유" 파일 목록 **밖의 파일은 읽기만, 수정 절대 금지**. 수정이 필요해 보이면 티켓을 `[보류]`로 바꾸고 질문.
- 다른 스크립트의 메서드를 호출하기 전에 대상 `.mlua`에서 Grep으로 정의를 확인 (AGENTS.md R6). 정의가 없으면 만들어 붙이지 말고 `[보류]`+질문.

## 3. 구현 (Implement)

- 프리셋 우선: 표준 시스템 → `msw-packages` 카탈로그 / 새 모델 → msw-general `models/` 템플릿 / UI → msw-ui-system 템플릿.
- `.model`=ModelBuilder, `.ui`=UIBuilder, `.map`=MapBuilder (호출 전 `builder-protocol.md` 전문 Read). 데이터성 값은 전부 CSV 행으로.
- 검증 포인트에 태그 로그 추가: `log("[티켓태그] ...")` — 제작자 Play 검증의 근거가 된다.
- UI 작업이면 `msw-ui-system`의 `references/ui-aesthetics.md` 전문 로드 + 기존 UI와 동일 비주얼 아이덴티티 유지.

## 4. 검증 (Verify) — 티켓마다, 레인 말미로 몰지 말 것

1. `maker_refresh_workspace` 호출 → 빌드 결과의 **Error 수 기록** (Error=0이 통과선). `refresh 진행 중` 에러면 대기 후 재시도.
2. Maker Play 가능 환경이면: `maker_clear_logs` → `maker_play` → 시나리오 재현(`maker_keyboard_input`/`maker_execute_script`) → `maker_logs`에서 태그 로그·Error 확인 → `maker_stop`.
3. Play 불가 환경이면 **"코드 수정 완료, 런타임 검증 보류(제작자 수행)"**로 정확히 보고 — "동작 확인" 창작 금지.

## 5. 보고 3종 (누락 = 반려)

1. **채팅 요약**: 무엇을 바꿨고, 검증을 어디까지 했는지.
2. **`subagent-handoff.md` §3 상태 갱신**: `[코드 완료 — YYYY-MM-DD | refresh Error=N | 런타임 검증 보류(제작자 수행)]` 형식 + 구현 요약/검증 라인 추가. 자기 티켓 블록만 편집.
3. **보고서 파일**: `docs/agents/reports/T<n>-<slug>.md` — [_TEMPLATE.md](../../../docs/agents/reports/_TEMPLATE.md) 양식. 필수 포함: 변경 파일 목록, refresh Error 수(§4), 로그 발췌, 제작자 Play 체크리스트(§6). UI 작업이면 ui-aesthetics §7 루브릭 표. 재작업이면 새 파일 대신 기존 보고서에 §7 이력 append.

## 금지 사항 (사고 이력 기반)

- 큐에 없는 작업 임의 착수 / 무보고 종료.
- 존재하지 않는 API 추정 호출 (T18 치명 오류의 원인).
- 세이브 루틴 내 추가 Yield (T37 인벤토리 전량 유실의 원인).
- `row.RowIndex` 사용 (T35 사고 — `UserDataRow`는 `Count()`/`GetItem(col)`뿐).
- Acceptance 미충족 상태에서 `[완료]` 격상.
