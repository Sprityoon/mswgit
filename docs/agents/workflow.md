# 개발 워크플로우 및 MCP 검증 (Workflow & Verification)

> 이 문서는 [AGENTS.md](../../AGENTS.md)의 온디맨드 세부 가이드입니다. 구현·검증 단계 진입 시 로드하십시오.
> MCP 도구 실명 표는 AGENTS.md §4.2에 있습니다 — 이 문서의 도구명도 전부 실명입니다.

## 5단계 워크플로우

1. **Plan (계획)**
   - 변경 유형 분류: New(신규만) / Modify(기존 수정만) / Both.
   - 작업을 검증 가능한 단계로 분해해 에이전트의 작업 목록 도구(TodoWrite / TaskCreate 등 자기 에이전트가 제공하는 것)에 기록. **Verify 단계를 반드시 포함**.
   - T티켓 작업이면 [subagent-handoff.md](./subagent-handoff.md) §1 공통 컨텍스트 + 해당 티켓의 Target/Change/Acceptance를 먼저 읽는다.

2. **Analyze (분석)**
   - API 시그니처: `Environment/**/*.d.mlua`를 Grep으로 검색 (읽기는 허용, 수정 금지).
   - 기존 패턴: 관련 `.mlua`·데이터셋 CSV를 Read로 확인. 크로스 스크립트 호출 예정이면 대상 정의를 먼저 검색(AGENTS.md R6).

3. **Implement (구현)**
   - `.model`/`.ui`/`.map`은 각 빌더(ModelBuilder/UIBuilder/MapBuilder) 경유 — 호출 프로토콜은 msw-general 스킬의 `references/builder-protocol.md` **전문**을 먼저 Read (스킬 시스템으로 로드된 경로 기준. 워크스페이스 `plugins/` 경로를 직접 Read하지 말 것 — 훅이 차단).
   - 프리셋 우선(AGENTS.md R1), 데이터 주도(R3), mlua 문법(R2) 준수.
   - 검증 포인트에 `log()` 추가 (예: `[FISHING]` 같은 태그 접두사) — Play 검증 시 로그 근거로 쓴다.
   - 타입은 `integer`/`number` (`int`/`float` 금지). `SpawnByModelId` parent에 nil 금지.

4. **Verify (검증)** — AGENTS.md §4.3 표준 체인 그대로:
   - `maker_refresh_workspace` → 빌드 **Error 수 확인·기록** (티켓마다 1회 이상 — 레인 말미로 몰지 말 것)
   - `maker_clear_logs` → `maker_play` → 시나리오 재현(`maker_keyboard_input`/`maker_execute_script`) → `maker_logs`에서 Error/Warning 확인 → `maker_stop`
   - Maker 미가동 환경이면 여기까지 수행한 범위(LSP 진단/refresh)를 명시하고 **"런타임 검증 보류"**로 보고.

5. **On Failure (실패 시)**
   - ① ExecSpace 확인(`_Service` 호출이 Client/Server 올바른 쪽인지) ② `maker_logs`의 에러 코드로 원인 분류(`[LEA-3004]`=Body 불일치, `[LEA-3005]`=InvalidArgument, `[LEA-3011]`=없는 컬럼) ③ 수정 후 4단계 재실행.
   - `refresh 진행 중` 에러 → 대기 후 재시도.
   - 해결 불가 시 원인 후보와 시도 내역을 정리해 보고 — 임의로 "동작함" 처리 금지.

## RUID 유효성

`SpriteRendererComponent` 등 렌더러 생성 시 `SpriteRUID`를 비워두지 말고 `msw-search` 스킬로 리소스를 검색해 바인딩한다 (빈 문자열 = 에러 없이 안 보임).
