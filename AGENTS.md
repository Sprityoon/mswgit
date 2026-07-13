# MSW 프로젝트 에이전트 규칙 (AGENTS.md)

> **대상**: 이 저장소에서 작업하는 **모든 AI 코딩 에이전트** (Claude Code, Codex, Cursor, Copilot 등) — 모델 등급 무관.
> **작성 원칙**: 이 문서만 읽어도 규칙 위반 없이 작업을 시작할 수 있도록, 도구명·파일 경로·명령어를 전부 **실명 그대로** 표기한다. 해석의 여지가 있는 표현은 쓰지 않는다.

---

## 0. 프로젝트 정체 (1분 요약)

- **MapleStory Worlds(MSW) 생존/채집 게임.** 모든 요청을 MSW 작업으로 취급한다.
- **맵**: 톱다운 `RectTile`(`TileMapMode = 1`), 동적 엔티티는 전부 **`KinematicbodyComponent`**.
  - 파일 4종: `map/map01.map`(영지 원본), `map/town.map`(공동 마을), `map/template_field.map`(사냥터), `map/template_boss.map`(보스). 런타임 영지 인스턴스 이름은 `Home_<UserId>`.
- **조작**: 방향키 4방향 이동 / `Alt` 비주얼 점프(물리 높이 변화 없음) / `Ctrl` 공격·채광(바라보는 인접 셀) / `F` 상호작용(설치물·NPC·게시판·낚시터).
- **운영 체계**: 지휘자(conductor) 1세션 + 구현자(worker) N세션. 작업 큐 = [docs/agents/subagent-handoff.md](./docs/agents/subagent-handoff.md) §3의 T티켓. 전체 설계 = `game_design.md`(84KB+ — 필요한 §만 검색해 읽을 것).
  - 사용자가 "지휘자"라고 지시하면 → [docs/agents/conductor-role.md](./docs/agents/conductor-role.md) 필독 (또는 `msw-conductor` 스킬 사용).
  - T티켓 구현 지시를 받으면 → [docs/agents/subagent-handoff.md](./docs/agents/subagent-handoff.md) **§1 전체** 필독 (또는 `msw-worker` 스킬 사용).

---

## 1. 편집 가능 영역 (Lanes)

| 경로 | 내용 | 편집 수단 |
|---|---|---|
| `RootDesk/MyDesk/**` | `.mlua` 스크립트, `.userdataset`+`.csv` 데이터셋 | 직접 편집 (Edit/Write) |
| `RootDesk/MyDesk/**/*.model` | 모델 | **ModelBuilder만** (직접 Read/Edit는 훅이 차단) |
| `map/*.map` | 맵 | **MapBuilder** 경유. 블록아웃 재생성은 `node scripts/build_maps.cjs --force` (⚠️ 손편집 전량 덮어씀 — 실행 전 사용자 확인) |
| `ui/*.ui` | UI 레이아웃 | **UIBuilder만** (직접 Read/Edit는 훅이 차단) |
| `Global/DefaultPlayer.model` | 플레이어 설정 | ModelBuilder |
| `Global/WorldConfig.config` | 물리·카메라 전역값 | 직접 편집 |
| `docs/**`, `game_design.md` | 기획·운영 문서 | 직접 편집 |

**수정 금지 (훅이 자동 차단):**

- `Environment/**` — 생성·수정·삭제 절대 금지 (`.d.mlua` API 정의는 **읽기만** 허용).
- `*.codeblock`, `*.d.mlua` — 자동 생성 파일. Maker `refresh` 시 재생성됨.
- `Global/` 하위 그 외 파일 — Maker가 인식하지 않음. 유저 파일은 `RootDesk/MyDesk/` 아래에만.
- 벤더 스킬 (`.claude/skills/`·`.agents/skills/` 중 `skills-lock.json`에 등재된 것) — 해시 잠금 관리 대상(원본: GitHub `MSW-Git/msw-ai-coding-plugins-official`). 수정하면 다음 `mswai update`에서 덮어써진다. 보완이 필요하면 프로젝트 문서/스킬 레이어에 작성. (`plugins/` 중간 사본은 2026-07-13 제거 — mswai가 재생성해도 참조하지 말 것.)

---

## 2. 절대 규칙 (위반 = 작업 무효)

### R1. 프리셋 우선 (Preset-First)

백지에서 만들기 전에 **반드시 기존 프리셋부터 확인**한다. 확인 순서:

1. **표준 게임 시스템** (인벤토리/상점/랭킹/퀘스트/우편/도감/키바인딩 등) → `msw-packages` 스킬의 공식 패키지 카탈로그 확인. 일치 패키지가 있으면 통합을 제안하고, 백지 구현은 카탈로그에 없음을 확인한 뒤에만.
2. **새 `.model`** → `msw-general` 스킬의 `models/` 검증 템플릿 카탈로그(몬스터/NPC/지형/파티클/UI 등)에서 가장 가까운 템플릿을 골라 ModelBuilder로 복제·수정. `Global/NativeModel/`의 MSW 내장 모델도 구조 참고용으로 읽기 가능.
3. **UI** → `msw-ui-system` 스킬의 `references/templates/` 스타일 템플릿에서 출발. 기존 게임 UI(인벤토리/HUD/상점)와 같은 비주얼 아이덴티티 유지 — 화면마다 새 스타일 발명 금지.
4. **스프라이트/사운드** → `msw-search`로 공식 리소스 검색이 1순위, 없을 때만 `msw-painter`/`image-to-pixel`로 제작.

### R2. mlua 전용 문법 엄수

mlua는 표준 Lua가 아니다. **`.mlua`를 한 줄이라도 만지기 전에 `msw-scripting` 스킬을 로드**하고 아래를 지킨다:

- 스크립트 종류·수명: `@Component`(엔티티 수명) / `@Logic`(월드 전역 싱글턴 — `OnMapEnter`/`OnMapLeave`가 **호출되지 않음**) / `@Event` / `@State` / `@BTNode`.
- 실행 공간: `@ExecSpace("ServerOnly" | "ClientOnly" | "Server" | "Client")` — `_Service` 호출이 올바른 쪽에서 실행되는지 항상 확인. `_LocalizationService`는 ClientOnly(서버 호출 시 nil).
- 타입: `integer`/`number`/`boolean`/`string` (`int`, `float` 사용 금지).
- 프로퍼티 동기화: `@Sync` 명시 없이는 클라에 전파되지 않음.
- 표준 Lua 관용구(메타테이블, `require`, `coroutine`, 전역 함수 정의 등)를 임의로 쓰지 않는다 — mlua 어노테이션·컴포넌트 체계로만 구조화.
- API 존재가 불확실하면 `Environment/**/*.d.mlua`에서 시그니처를 검색해 확인하거나 `msw-search`(문서 검색)로 조회. **추정으로 API를 호출하지 않는다.**

### R3. 하드코딩 절대 금지 (Data-Driven First)

상호작용 로직(채집/제련/제작/거래/설치/전투 등) 작성 시:

1. 아이템 이름, 레시피, 수량, 시간, 확률, 분기 조건 등 **모든 데이터성 값**은 코드에 박지 말고 데이터셋(`.userdataset`+`.csv`), Struct, 컴포넌트 프로퍼티로 분리해 `_DataService:GetTable(...)`로 조회한다. 신규 콘텐츠는 **CSV 행 추가만으로** 반영돼야 한다.
2. `if itemName == "..."` 형태의 이름 분기 금지 → 데이터셋 행 존재(`FindRow`)로 판정.
3. 하드코딩이 불가피해 보이면 **구현 전에 멈추고 근거와 함께 사용자에게 질문해 명시적 승인**을 받는다.

### R4. 아이템 식별자 = `item_dataset`의 `Name` 컬럼 값

인벤토리에 실제 저장되는 키다. 소문자 `id`나 표시명 변형과 혼동하면 상호작용이 **에러 없이 조용히 실패**한다.

### R5. `UserDataRow` API — `Count()`와 `GetItem(columnName)` 두 개뿐

- `row.RowIndex`는 존재하지 않는 프로퍼티(nil). `GetCell`에 넘기면 `[LEA-3005] InvalidArgument`로 호출 서버 루프가 통째로 중단된다.
- 존재가 불확실한 컬럼의 `GetItem`은 `[LEA-3011]` — `pcall` 가드 필수.

### R6. 크로스 스크립트 호출 전 정의 확인

다른 스크립트의 메서드/프로퍼티를 호출하기 전에 **대상 `.mlua`에서 해당 정의를 Grep으로 검색해 존재와 시그니처를 확인**한다. 정의가 없으면 추정 호출 금지, 소유 밖 파일에 정의를 새로 만들지도 말 것 — `[보류]` 처리하고 질문한다.

### R7. 세이브 경로 Yield 금지

`SavePlayerData` 등 영속 저장 루틴 안에서 필수 `GetAndWait`/`SetAndWait` 외의 **추가 Yield(다른 GetAndWait, 타이머 대기 등)를 넣지 않는다**. Yield 사이에 플레이어 엔티티가 파괴되면 nil 폴백으로 세이브가 빈 데이터로 덮인다. 저장할 컴포넌트 값은 루틴 진입 직후 전부 지역 변수로 선캡처.

### R8. 런타임 검증은 도구 근거 필수

- "동작 확인" 주장은 §4의 MCP 검증 체인을 실제 호출한 로그 근거가 있을 때만 가능. 도구 호출 없는 결과 확언은 날조다.
- Maker를 못 쓰는 환경이면 정확히 **"코드 수정 완료, 런타임 검증 보류"**로 보고한다.

### R9. T티켓 보고 3종 (누락 = 반려)

T티켓 작업 완료 시: ① 채팅 요약 ② `subagent-handoff.md` §3 해당 항목 상태 갱신 ③ `docs/agents/reports/T<n>-<slug>.md` 보고서 파일([_TEMPLATE.md](./docs/agents/reports/_TEMPLATE.md) 양식, refresh 빌드 Error 수 + 로그 발췌 포함). UI 작업이면 `msw-ui-system`의 `references/ui-aesthetics.md` §7 자가 리뷰 루브릭 표 첨부.

---

## 3. 8대 핵심 규칙 (항상 적용)

1. **TileMapMode ↔ Body 매핑** 불일치 시 엔티티가 에러 없이 움직이지 않거나 `[LEA-3004]` 발생 (상세: msw-general 스킬 `references/platform.md` §4). 이 프로젝트는 `RectTile(1)` → `KinematicbodyComponent`.
2. 유저 스크립트는 `.mlua` + `.codeblock` **쌍**으로만 동작. `.codeblock`은 Maker refresh가 자동 생성 — 새 `.mlua`를 만들면 refresh 전까지 등록되지 않는다.
3. `SpriteRUID = ""`이면 에러 없이 **화면에 렌더링되지 않음**. 그려져야 하면 유효 RUID 바인딩(`msw-search`로 검색).
4. `SpawnByModelId`의 `parent`에 `nil` 전달 시 런타임 에러 → `self.Entity.CurrentMap` 등을 넘길 것.
5. 좌표는 **월드 단위** (1 unit = 100 px). 픽셀 값을 넣으면 100배 커져 화면 밖으로 나간다.
6. Maker는 `RootDesk/`만 스캔. `Global/` 아래 유저 파일은 에디터에 보이지 않는다.
7. `.d.mlua`·`.codeblock` 직접 수정 절대 금지 (훅이 차단).
8. CoreVersion은 `26.5.0.0` 고정 (`Environment/config`). 불일치 시 훅이 경고를 주입하며, 그 경우 개발 작업을 진행하지 않는다.

---

## 4. 도구 규칙 — 실명 표기

### 4.1 워크스페이스 탐색·읽기·검색

에이전트 **내장 도구만** 사용: `Glob`(파일 목록·이름 검색) / `Read`(파일 읽기) / `Grep`(내용 검색).
쉘 명령(`ls`, `dir`, `Get-ChildItem`, `cat`, `type`, `Get-Content`, `head`, `tail`, `find`, `grep`, `findstr`, `Select-String`, `rg`)은 워크스페이스 탐색에 **금지** — Windows/맥 쉘 비호환(특히 bash에서 `D:\path`의 `\`가 이스케이프로 먹혀 `D:path`로 붕괴)이 원인.

쉘(Bash) 도구는 실제 프로그램 구동(`git`, `npm`, `node`, 빌더 스크립트)에만 사용하고: ① 워크스페이스 상대 경로 우선 ② 절대 경로가 불가피하면 슬래시+큰따옴표(`"D:/메이플월도/map/"`) ③ POSIX 명령만.

### 4.2 Maker MCP 도구 — 정확한 이름

서버 이름은 `msw-maker-mcp`. 도구 실명(에이전트에 따라 `mcp__msw-maker-mcp__` 접두사가 붙음):

| 도구 | 용도 |
|---|---|
| `maker_refresh_workspace` | 파일 변경을 에디터에 동기화 + 빌드 (Play 중에는 불가) |
| `maker_play` / `maker_stop` | 플레이 모드 시작/중지 |
| `maker_logs` / `maker_clear_logs` | 빌드·런타임 로그 조회/초기화 |
| `maker_execute_script` | Play 컨텍스트에서 Lua 실행 (상태 조회·시나리오 재현) |
| `maker_keyboard_input` / `maker_mouse_input` | Play 중 입력 시뮬레이션 |
| `maker_screenshot` | 사용자가 명시 요청할 때만 |
| `maker_save` / `maker_get_current_map` / `maker_get_context_keys` / `maker_get_world_id` | 저장 / 현재 맵 / 컨텍스트 / 월드 ID |

### 4.3 표준 검증 체인 (구현 후 필수)

```
1) maker_refresh_workspace        → 빌드 결과에서 Error 수 확인 (Error=0이 통과선, 보고서에 기재)
2) maker_clear_logs               → 이전 로그 제거
3) maker_play                     → 플레이 진입
4) (시나리오 재현: maker_keyboard_input / maker_execute_script)
5) maker_logs                     → Error/Warning 검출, 근거 발췌
6) maker_stop
```

실패 시: ExecSpace(Client vs Server)부터 확인 → 수정 → 체인 재실행. `refresh 진행 중` 에러가 나면 잠시 대기 후 재시도.

---

## 5. 스킬 로딩

- **위치**: Claude Code = `Skill` 도구(프로젝트 `.claude/skills/`) / 타사 에이전트 = `.agents/skills.json`이 가리키는 `.agents/skills/`. 자기 에이전트의 스킬 시스템으로 로드하고, 로드된 스킬이 가리키는 `references/*.md`는 **Read 도구로 전문(全文)** 읽는다(offset/limit·쉘 부분 읽기 금지 — 훅이 차단).
- **Foundation (매 턴)**: `msw-general` + `msw-ui-system` 스킬, 그리고 msw-general의 `references/{platform.md, workspace.md, entity.md, authoring.md}` 4종. 도메인별 추가 스킬·레퍼런스 매트릭스는 매 세션 첫 프롬프트에 훅이 `<msw-skill-router-reminder>`로 전문 주입한다(이후 턴은 요약 리마인더) — **그 지시를 권위 소스로 따른다**. 훅이 없는 환경이면 [docs/agents/skill-routing.md](./docs/agents/skill-routing.md) 참조.
- **프로젝트 스킬**: `msw-conductor`(지휘자 운영) / `msw-worker`(T티켓 구현) / `msw-checkpoint`(문서 동기화 + git 커밋·푸시) / `image-to-pixel`(이미지→픽셀 아트).

---

## 6. 자동 강제(훅) vs 자율 준수

이 저장소의 훅이 아래를 **자동 차단/주입**한다. deny 응답을 받으면 우회하지 말고 지시된 대체 수단을 쓸 것. 전체 목록·타사 에이전트 배선 방법: [docs/agents/hooks.md](./docs/agents/hooks.md).

| 자동 강제됨 (훅) | 에이전트가 스스로 지켜야 함 (문서 규칙) |
|---|---|
| `.model`/`.ui` 직접 Read/Edit 차단 → 빌더 안내 | 하드코딩 금지 (R3) — 판단이 필요해 훅 불가 |
| `Environment/**`, `*.codeblock`, `*.d.mlua`, 벤더 스킬 쓰기 차단 | mlua 문법·ExecSpace 정합 (R2) |
| `.mlua` 저장 시 LSP 진단 자동 실행 (에러 시 차단) | 프리셋 우선 (R1), 검증 체인 실행 (R8) |
| CoreVersion 불일치 경고 주입 | 보고 3종 (R9), 레인 소유권 준수 |
| 스킬 md 쉘 부분 읽기 차단, 스킬 라우터 리마인더 주입 | `game_design.md`·핸드오프 문서 동기화 |

---

## 7. 세부 가이드 (온디맨드 — 해당 도메인 작업 전 Read로 로드)

- 게임 물리·조작키·맵 모드 → [docs/agents/physics-controls.md](./docs/agents/physics-controls.md)
- 컴포넌트 설계·디렉터리 구조 규칙 → [docs/agents/directory-structure.md](./docs/agents/directory-structure.md)
- 스킬/레퍼런스 로드 프로토콜 → [docs/agents/skill-routing.md](./docs/agents/skill-routing.md)
- 개발 워크플로우·MCP 검증 절차 → [docs/agents/workflow.md](./docs/agents/workflow.md)
- 훅 목록·계약·타사 에이전트 적용 → [docs/agents/hooks.md](./docs/agents/hooks.md)
- 지휘자 역할 규약 → [docs/agents/conductor-role.md](./docs/agents/conductor-role.md)
- 하위 에이전트 작업 큐·공통 컨텍스트 → [docs/agents/subagent-handoff.md](./docs/agents/subagent-handoff.md)
