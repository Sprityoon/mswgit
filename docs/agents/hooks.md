# 훅 목록·계약·타사 에이전트 적용 (Hooks)

> 이 문서는 [AGENTS.md](../../AGENTS.md) §6의 온디맨드 세부 가이드입니다.
> 활성 배선은 `.claude/settings.json`의 `hooks` 블록이 단일 소스입니다.

## 레이어 구분

| 위치 | 소유 | 갱신 방식 |
|---|---|---|
| `.claude/hooks/**` | **벤더** (mswai / `@maplestoryworlds/ai-cli`) | `mswai update`가 패키지 템플릿으로 덮어씀 — **직접 수정 금지** |
| `.claude/hooks-project/**` | **프로젝트** | 이 저장소에서 직접 관리 (mswai가 건드리지 않음) |
| ~~`plugins/msw-maker-base-skill/**`~~ | 벤더 | **2026-07-13 제거됨** (미러 중간 사본 — 어디서도 참조하지 않아 삭제). mswai가 재생성하더라도 Claude Code "플러그인"으로 설치하지 말 것 — 플러그인 활성화 시 `inject-agents-md.cjs`가 세션마다 프로젝트 AGENTS.md를 벤더 템플릿으로 **덮어쓴다**. 이 프로젝트는 settings.json 방식만 사용 |

## 활성 훅 인벤토리 (settings.json 기준)

| 이벤트 | 훅 | 역할 | 소유 |
|---|---|---|---|
| PreToolUse (Bash) | `hooks-project/skill-read-guard.cjs` | 스킬/레퍼런스 `.md`의 쉘 부분 읽기 차단 (`plugins/`·`.claude/skills/`·`.agents/skills/` 3경로 모두) → Read 전문 읽기 강제 | 프로젝트 (벤더 포크 — 벤더판은 `plugins/` 경로만 차단해서 확장) |
| PreToolUse (Bash, Read/Edit/Write계열) | `hooks/structured-file-guard.cjs` | `.model`/`.ui` 직접 읽기·쓰기 차단 → ModelBuilder/UIBuilder 강제 | 벤더 |
| PreToolUse (Bash, Edit/Write계열) | `hooks-project/readonly-path-guard.cjs` | `Environment/**`, `*.codeblock`, `*.d.mlua`, `Global/`(허용 2파일 제외), 벤더 스킬 미러 **쓰기** 차단 (읽기는 허용) | 프로젝트 (신설 — AGENTS.md §1을 강제 규칙으로 승격) |
| PostToolUse (Edit/Write/apply_patch) | `hooks/mlua-lsp/mlua-diagnose-post-tool-use.cjs` | `.mlua` 저장 시 LSP 진단 자동 실행, 에러 시 block | 벤더 |
| PostToolUse (Read/Skill), InstructionsLoaded | `hooks/skill-log/skill-log.cjs` | 스킬 로드 기록 → `.mswai/logs/skill.log` (관측 전용, async) | 벤더 |
| PostToolUse (전체) | `hooks/mcp-log/mcp-log.cjs` | MCP 호출 기록 → `.mswai/logs/mcp.log`. **응답 본문은 `MCP_LOG_MAX_OUTPUT_BYTES=2048`로 캡** (settings.json `env`) | 벤더 |
| SessionStart | `hooks-project/mlua-session-start.cjs` (SessionEnd는 벤더 `hooks/mlua-lsp/mlua-session-end.cjs` 유지) | LSP 데몬 기동/종료 | 프로젝트 (벤더 포크 — 2026-07-16 stdin 블록 수정, 아래 변경 항목) |
| SessionStart (startup·resume) | `hooks/update-check/update-check.cjs` | mswai 신버전 안내 | 벤더 |
| UserPromptSubmit | `hooks/core-version-check/core-version-check.cjs` | `Environment/config`의 CoreVersion ≠ `26.5.0.0`이면 작업 중단 지시 주입 (워크스페이스당 1회) | 벤더 |
| UserPromptSubmit | `hooks-project/skill-router-lite.cjs` | 스킬 라우팅 리마인더: **세션 첫 프롬프트 = 벤더 전문(~20KB) 위임 주입, 이후 = 요약(~2KB)** | 프로젝트 (신설 — 매 턴 20KB 주입하던 벤더판 대체. 전문 텍스트의 단일 소스는 여전히 벤더 스크립트) |

### 2026-07-23 변경 — 벤더 스킬 v0.6.0 동기화 + 라우터 LITE에 위키·플래닝 라우팅 추가

- **벤더 스킬 동기화**: `MSW-Git/msw-ai-coding-plugins-official` v0.5.3 → **v0.6.0** (22파일 갱신 + `msw-planning` 스킬 신규). 커스텀 유지 파일 2종(`msw-ui-system/SKILL.md`, `references/layout-recipes.md`)은 업스트림 변경분만 선별 병합. `skills-lock.json` computedHash 전량 재계산(알고리즘 재현 검증 완료: 스킬 폴더 전 파일 POSIX 상대경로 정렬 → `경로+raw bytes` SHA-256 — vercel-labs/skills local-lock 규격). 반입 작업은 `MSW_READONLY_GUARD_DISABLE=1` 1회 우회로 수행(사유: 벤더 마이그레이션 — 본 항목이 그 기록).
- **`skill-router-lite.cjs` LITE 요약 갱신**: `msw-wiki`(로컬 위키 `docs/wiki/` — MSWPackages 미러·RoguelikeWorld 예제) 라우팅 + `msw-planning` 우선순위 주의("다음 작업"류는 T티켓 큐 소관) 2줄 추가. 벤더 전문(첫 턴 주입분)은 벤더 소유라 미수정 — 전문과 LITE가 다르면 프로젝트 문서(`skill-routing.md`)가 보완 소스.

### 2026-07-16 변경 — SessionStart LSP 훅 timeout 수정 (stdin 무기한 대기 → 프로젝트 포크)

- **증상**: `project/settings:session_start[0].hooks[0]` timeout(120s) 에러 (제작자 보고).
- **원인(지휘자 실측 재현)**: 벤더 `hooks/mlua-lsp/mlua-session-start.cjs`의 `fs.readFileSync(0)`가 **stdin EOF를 무기한 대기** — 하네스가 stdin을 닫지 않는 경로(세션 재개·다중 세션 동시 기동 등)에서 훅이 120초 뒤 timeout으로 킬. 실측: stdin을 5초 열어두면 벤더판 node 수명 정확히 5초(EOF까지 블록). 스크립트 본연의 작업은 매번 14~32ms에 완료(`.mswai/logs/lsp.log`) — 느린 게 아니라 stdin 대기가 전부.
- **조치**: `hooks-project/mlua-session-start.cjs` 포크 신설 — stdin 읽기에 **2초 상한**(상한 도달 시 수신분만 파싱, cwd는 `process.cwd()` 폴백). 공용 모듈(resolve-cmd/lsp-log)은 벤더 경로 require로 mswai update 자동 추종. settings.json 배선 교체 + timeout 120→15. 실측: stdin을 8초 열어둬도 node 수명 2초.
- **잔여**: 벤더 SessionEnd 훅(`mlua-session-end.cjs`)도 동일 stdin 패턴(timeout 20s) — 세션 종료 시라 체감 낮아 유지. 재발 시 동일 포크 적용.

### 2026-07-14 변경 — 훅 명령 상대 경로 전환 (타사 하네스 exit 1 해소)

- **증상**: 타사 에이전트 하네스에서 모든 PreToolUse 훅이 "failed with exit code 1".
- **원인(지휘자 실측 재현)**: settings.json 훅 명령이 `node "${CLAUDE_PROJECT_DIR}/..."` 형태였는데, `CLAUDE_PROJECT_DIR`를 정의하지 않는 셸(bash unset → 빈 문자열)이나 `${...}`를 치환하지 않는 cmd.exe(리터럴 유지)에서는 node가 존재하지 않는 경로를 로드하다 `Cannot find module` → **exit 1로 즉사** (훅 로직 진입 전).
- **조치**: 모든 훅 명령을 **저장소 루트 상대 경로**(`node ".claude/..."`)로 전환. 대신 **훅은 반드시 프로젝트 루트를 cwd로 실행**해야 한다 — Claude Code는 기본 충족, 타사 하네스도 루트에서 호출할 것.
- **스크립트 자체는 전 케이스 무결 확인(2026-07-14 매트릭스)**: 정상 stdin/빈 stdin/비JSON/무stdin 전부 exit 0, 차단은 exit 2(stderr) 또는 deny JSON+exit 0. 어떤 입력에서도 exit 1을 내지 않는다.

## 트러블슈팅 — 훅 종료 코드 계약

| exit | 의미 | 대응 |
|---|---|---|
| 0 | 허용 (또는 stdout JSON `permissionDecision:"deny"` — Claude Code 전용 차단) | — |
| 2 | 차단 (사유는 stderr) | deny 메시지의 대체 수단 사용 — 우회 금지 |
| **1** | **훅 로직이 아니라 스크립트 기동 실패** (모듈 미발견/크래시) | ① 명령의 경로 치환 확인(위 2026-07-14 항목) ② cwd가 저장소 루트인지 확인 ③ `node .claude/hooks-project/<훅>.cjs --command "ls"`로 단독 실행해 재현 |

### 2026-07-13 정리에서 제거·변경된 것

- **제거**: PostToolUse의 `mcp_tool: maker_refresh_workspace` (편집마다 전체 워크스페이스 refresh → "refresh 진행 중" 충돌 유발, 티켓 단위 refresh 규약과 중복). refresh는 이제 **검증 체인(AGENTS.md §4.3)에서 명시적으로 호출**한다 — 새 `.mlua`를 만들면 refresh 전까지 `.codeblock`이 생성되지 않음을 잊지 말 것.
- **교체**: `skill-router-reminder`(매 턴 20KB) → `skill-router-lite`(첫 턴만 전문). 항상 전문을 원하면 `MSW_SKILL_ROUTER_FULL=1`.
- **추가**: `readonly-path-guard`, 확장판 `skill-read-guard`, `MCP_LOG_MAX_OUTPUT_BYTES=2048`.
- **삭제**: 워크스페이스 `plugins/` 폴더 전체 (스킬·훅의 중간 사본 — 활성 배선은 `.claude/hooks/`·`.claude/skills/`·`.agents/skills/`만 사용. 이를 참조하던 `scripts/*.cjs`·`scratch/dump_ui.js`의 require는 `.claude/skills/` 경로로 교체 완료).

## deny를 받았을 때 (모든 에이전트 공통)

우회하지 말 것. deny 메시지에 적힌 대체 수단을 그대로 사용한다:
`.model`→ModelBuilder / `.ui`→UIBuilder / 스킬 md→스킬 시스템+Read 전문 / 보호 경로→수정 포기(읽기는 Read/Grep 도구로). 오탐이라 판단되면 각 훅의 `*_DISABLE=1` 환경변수로 1회 우회하고 반드시 사유를 보고서에 남긴다.

## 타사 에이전트 적용

훅 스크립트는 전부 Node 단일 파일이며 **두 가지 호출 방식**을 지원한다:

1. **stdin JSON** (Claude Code 계약): `{"tool_name":..., "tool_input":{...}}` → 허용 시 exit 0, 차단 시 exit 2(stderr) 또는 `permissionDecision:"deny"` JSON.
2. **CLI 인자** (프로젝트 훅 한정 — 임의 하네스용 어댑터):
   - `node .claude/hooks-project/readonly-path-guard.cjs --path <파일>` 또는 `--command "<쉘 명령>"` → exit 0/2
   - `node .claude/hooks-project/skill-read-guard.cjs --command "<쉘 명령>"` → exit 0/2

| 하네스 | 적용 방법 |
|---|---|
| Claude Code | `.claude/settings.json` (이미 배선됨) |
| Cursor (Hooks 지원 버전) | `beforeShellExecution`/`beforeReadFile` 훅에서 위 CLI 모드 호출, exit 2 → 차단으로 매핑 |
| Codex / Copilot CLI (훅 미지원) | 강제 불가 — AGENTS.md §1·§6 규칙 준수에 의존. 커밋 전 `node .claude/hooks-project/readonly-path-guard.cjs --path <변경파일>`를 스스로 실행해 자가 검사 가능. 추가 방어선: git pre-commit 훅으로 보호 경로 diff 거부 가능(미설치 — 필요 시 요청) |

로그(`.mswai/logs/`)와 LSP 훅은 관측·품질 보조라 타사 미적용이어도 안전성에 영향 없음. **안전에 필수적인 것은 위 표의 가드 3종(structured-file-guard, readonly-path-guard, skill-read-guard)이다.**
