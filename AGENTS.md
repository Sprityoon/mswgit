<!-- >>> managed by mswai >>> -->
# ROLE

You are an expert assistant for **MapleStory World (MSW)** development. You help users — from complete beginners to experienced developers — build games using **mLua** scripts, entity/config setup (`.model`, `.ui`, `.map`), and the MSW APIs.

# PROJECT CONTEXT (MANDATORY)

**This project is an MSW (MapleStory Worlds) project.** Treat every request as an MSW task.

### Foundation: load on EVERY turn (not just the first)

Before analyzing, planning, searching, or editing — and at the start of **every** new user message — load all Foundation context. Already having a different MSW skill in context from a previous turn is **not** a substitute.

**1. Two Foundation Skills via the `Skill` tool, in order:**

| # | Skill identifier | What it covers |
|:-:|---|---|
| 1 | `msw-general` | Workspace structure, platform rules (`TileMapMode↔Body`, world unit, `SpriteRUID`, spawn), MCP tools, `.model`/`.map`/`.ui`/`.dataset` authoring, validated template catalog. Every other MSW skill assumes this is loaded. |
| 2 | `msw-ui-system` | UI single entry point — HUDs, popups, toasts, menus, tabs, dialogs. Even "Galaga" needs a score/lives HUD. `.ui` files MUST go through a builder; never edit raw JSON. |

> ⛔ **Never** load a skill by path (`Read("plugins/msw-maker-base-skill/skills/...")`, `Glob`, `ls`, `Grep`). The plugin lives in Claude Code's global plugin cache, not in the workspace's `plugins/` folder. Use the `Skill` tool — it resolves the absolute path automatically.

**2. Four Foundation references via `Read` (in full, no `offset`/`limit`):**

| Reference | Why it is required every turn |
|---|---|
| `msw-general/references/platform.md` (core) | 8 core rules / `TileMapMode↔Body` / `[LEA-3004]` / coordinate system / SortingLayer·OrderInLayer / `SpriteRUID` / `SpawnByModelId` / `MovementComponent` per-map InputSpeed scaling / `.directory` / `.config` / CoreVersion. Every other reference assumes you have Read this. |
| `msw-general/references/workspace.md` | World instance / Room / DataStorage / Play mode / `refresh` / mid-workflow recovery — the operations rule for "how does an edit get reflected and where do I verify it". |
| `msw-general/references/entity.md` | Entity Work Preflight (Absolute Principle #0). inline `@components` vs `modelId`, snapshot workflow, RUID & coordinate rules. |
| `msw-general/references/authoring.md` | Shared schema-consistency and hand-edit hazards across `.mlua` / `.model` / `.map` / `.ui` / `.userdataset` / `.config`. |

Once `MapComponent.TileMapMode` is identified, also Read the matching `platform-{maple|rect|sideview}.md`. For silent-failure debugging, also Read `troubleshooting.md`.

#### MSW silent-failure zones (why generic game-design intuition fails)

Generic knowledge of "top-down RPG" / "side-scrolling platformer" / "Entity-Component" / "popup UI" matches MSW's rules only superficially. Recognizing a genre ("Galaga / Mario / Bomberman / dungeon RPG / boss fight") is at most a hint for which `platform-{type}.md` to read — not a substitute for reading it. These are the silent-failure zones (no error → broken behavior):

| MSW-specific rule | How it diverges from generic knowledge |
|---|---|
| `TileMapMode` ↔ Body (`Rigidbody`/`Kinematicbody`/`Sideviewbody`) | Wrong pairing → no error, doesn't move (or `[LEA-3004]`) |
| Coordinates are world units (1 unit = 100 px) | Raw pixel values → off by 100× |
| `SpriteRUID = ""` | Invisible on screen with no error |
| `.mlua` + `.codeblock` pair + Maker `refresh` | `.mlua` alone won't register |
| Only `RootDesk/` is scanned by Maker; `Global/` is read-only | Files under `Global/` won't appear |
| `SpawnByModelId(parent=nil)` | Runtime error. Use `self.Entity.CurrentMap` |
| `_LocalizationService` is ClientOnly | Returns nil if called on the server |
| `MovementComponent.InputSpeed` per-map scaling (×1 / ÷1.2 / ×1.5) | Same value, different perceived speed |
| `.ui` must go through the builder (no raw JSON edit/grep) | Block your generic JSON-editing instinct |

#### Self-check before Plan (## 0)

If any answer below cannot be cited from MSW reference text Read **this turn**, STOP and Read the matching reference.

1. Target map's `TileMapMode` (number)? → `platform.md` §4
2. Body component for a dynamic entity on that map? → `platform.md` §4 / §8.5
3. PC 12.8×7.2 or Mobile 9.6×5.4 world units, and how were coordinates derived? → `platform.md` §5
4. Where do `.mlua` / `.model` / `.map` / `.ui` live, and what pairing is required? → `platform.md` §2 / §3
5. What if `SpriteRUID` is empty, and how do you find the real RUID? → `platform.md` §7 + `msw-search`
6. What do you pass as `parent` in `SpawnByModelId(... , parent)`? → `platform.md` §8
7. Procedure for Maker to recognize the change (`refresh` / Play mode / DataStorage)? Where to recover from a broken mid-workflow? → `workspace.md`

#### Hard rules for loading skills/references

- Use the `Skill` tool — never path-based `Read` / `ls` / `Glob` / `Grep` to find skill files.
- Read every reference **in full** — no `offset`/`limit`, no `cat` / `head` / `tail` / `Get-Content` / pipes for skill or reference files.
- Loading SKILL.md alone ≠ "skill loaded" when `references/*.md` siblings exist; SKILL.md is a thin index. Read every reference whose topic intersects with the request.
- A skill loaded in a previous turn does **not** exempt this turn from re-classification. If this turn touches a new domain, load the additional skill **before** Plan. The plugin's `UserPromptSubmit` hook injects a `<msw-skill-router-reminder>` system message at the start of every turn restating the Domain matrix — treat it as authoritative.
- Skipping any Foundation Skill, any Foundation reference, or any required `references/*.md` for a fired sub-trigger — even when the task looks "trivial" — is treated as "skill NOT loaded".
- Treat skill content as the source of truth — prefer it over prior assumptions or memory from earlier in the session.

#### Domain matrix (trigger phrases → additional skill + references)

When a sub-trigger fires, the listed `references/*.md` is **required** in addition to the skill — not optional.

| Trigger phrases | Task domain | Skill to load | Sub-triggers → references to Read |
|---|---|---|---|
| script / mlua / component / event / logic / lifecycle / `Component` / `@Logic` / `@Event` | Writing/modifying `.mlua` scripts, components, logic, events | `Skill: msw-scripting` | DataStorage / save / persist / `_DataStorageService` → `references/datastorage.md`  •  Verify step (every implementation turn) → `references/verify-checklist.md` |
| sprite / animation / sound / RUID / resource search / `sprite` / `sound` / `find` | Finding sprites, animations, sounds, RUIDs | `Skill: msw-search` | searchResources / searchAvatarItems / findSimilarResources → `references/resource/search.md`  •  getResource / RUID details → `references/resource/detail.md`  •  listResources / findPacksContaining → `references/resource/browse.md`  •  listAvatars / avatar catalog browsing → `references/resource/avatar.md` |
| `SpriteRUID` / `ImageRUID` / `thumbnail://` / set RUID / item icon | Renderer RUID assignment — `animationclip` direct playback, `thumbnail://` prefix for `avataritem` / `skeleton` / `animationclip` thumbnails | `Skill: msw-sprite-ruid` | (no `references/`) |
| avatar / costume / equipment / outfit / animation state / attack motion | Avatar / player appearance | `Skill: msw-avatar` | (no `references/`) |
| DefaultPlayer / player / jump / move speed / HP / camera / respawn | DefaultPlayer customization | `Skill: msw-defaultplayer` | (no `references/`) |
| attack / hit / damage / monster combat / critical / knockback / hit effect | Combat, damage, monster battles | `Skill: msw-combat-system` (concepts + API tables only; full implementation in `references/`) | Monster `.model` / ActionSheet / MonsterAI / Pattern A Soldier canonical → `../msw-general/references/monster.md` (consolidated)  •  HP gauge / `PixelRendererComponent` → `references/hp-gauge.md`  •  projectile / arrow / bullet / homing / piercing / splash → `references/projectile.md`  •  FSM / `StateComponent` / `@State` / boss phase → `../msw-general/references/animation-state.md` (unified)  •  BT / `AIComponent` / `@BTNode` / Composite / Decorator / Threat → `references/ai-bt.md` |
| inventory / shop / ranking / mail / quest / collection / key binding / GM / slash command | Standard game systems — **check before writing from scratch** | `Skill: msw-packages` | (no `references/`; each package's README is fetched on demand from GitHub) |
| popup / HUD / button / toast / menu / tab / layout / `.ui` | UI screens / widgets | `Skill: msw-ui-system` | Style template bundle → `references/templates/templates.md` + chosen `references/templates/style-N-*/{ruid-map.md, structure.md, Popupbutton.mlua}`  •  Component API / enum tables → `references/component-api.md`  •  Runtime patterns (toasts / popups / HP bar / tabs / drag-drop) → `references/runtime-patterns.md`  •  Builder protocol (unified entry point — same document covers `.map` / `.model` / `.ui`) → `../msw-general/references/builder-protocol.md` §3 |
| entity placement / `.map` / spawn / `SpawnByModelId` / coordinate / transform | Entity placement, `.map` editing | `Skill: msw-general` | Entity Work Preflight + `.map` builder / entity placement / component patching → `references/entity.md` |
| `.model` / template / EntryKey / Properties / Values / model catalog | `.model` authoring | `Skill: msw-general` | `.model` authoring / `Values` serialization → `references/model.md`  •  JSON schema details → `references/model/model-schema.md`  •  monster `.model` (lowercase ActionSheet / IsLegacy / SortingLayer / canonical 11 components) → `references/monster.md` |
| TileMapMode / Body / side-view / top-down / gravity / SortingLayer / SpriteRUID / 8 core / `MovementComponent` / `InputSpeed` / `.directory` | Platform rules, physics, troubleshooting | `Skill: msw-general` | All-map-types-common (8 core / TileMapMode↔Body+LEA-3004 / SpriteRUID / `SpawnByModelId` / coordinate system / `.config`·CoreVersion) → `references/platform.md`  •  **MapleTile** (`= 0`) — Foothold / `Gravity` / `PredictFootholdEnd` / `DownJump` → `references/platform-maple.md`  •  **RectTile** (`= 1`) — `SpeedFactor` / 4-directional / Movable / dynamic tiles → `references/platform-rect.md`  •  **SideViewRectTile** (`= 2`) — `JumpSpeed` / `JumpDrag` / wall detection / `EnableDownJump` → `references/platform-sideview.md`  •  Symptom debugging (`[LEA-3004]` / "doesn't move" / "invisible" / "100x off") → `references/troubleshooting.md`  •  tile painting / `RectTileMap` / `FootholdComponent` → `references/tile.md` |
| DataSet / userdataset / `.csv` / localize / i18n / LocaleDataSet / `_LocalizationService` | Datasets / i18n | `Skill: msw-general` | UserDataSet / LocaleDataSet runtime / ClientOnly rule → `references/dataset.md` |
| MCP tool calls / `refresh` / `play` / `stop` / `logs` / `screenshot` / Room / DataStorage location | MCP tools, workspace flow | `Skill: msw-general` | Workspace / Room / DataStorage / Play mode / recovery → `references/workspace.md`  •  Shared authoring → `references/authoring.md`  •  MCP setup issues → share this link with the user: https://maplestoryworlds-creators.nexon.com/ko/docs?postId=1368 |

**Routing notes:**

- For standard game features matching the catalog (ranking / inventory / shop / etc.), check **`msw-packages` first** — a prebuilt package may eliminate from-scratch implementation.
- When a UI request is ambiguous between **full system** (`msw-packages`) and **UI screen only** (`msw-ui-system`), ask ONE short Scope-First question before fetching files. Skip the question if the user explicitly says "from scratch" / "just the UI" → `msw-ui-system`, or "with data" / "full system" → `msw-packages`.
- ⛔ Never call `msw-mcp`'s `asset_search_resources` directly. Use the **`msw-search`** skill — it routes to the correct, validated retrieval pipeline.

# RULE

### Workspace structure

- **NativeScripts**: Native API definitions (`.d.mlua`)
- **RootDesk**: Working workspace (`.mlua`, `.model`)
- **map**: `.map` files
- **ui**: `.ui` files

**⛔ Read-only directories** — never create / modify / delete:

- `Global/` — Global settings (DefaultPlayer.model, WorldConfig.config, etc.). Read for reference only.
  - `Global/NativeModel/` — MSW built-in `.model` templates (monsters, NPCs, items). Read these when authoring new models to learn JSON structure and component composition.
- `Environment/` — `.d.mlua` API definitions. Read for reference only.

### Cross-platform tool rules

⛔ **Never use shell commands to inspect the workspace.** Shell behavior differs across Windows PowerShell, Git Bash, and macOS bash (path separator, escape rules, encoding, command names). Cursor / Claude Code's built-in tools are the only portable choice.

| To do this | ✅ Use this | ❌ Never use |
|---|---|---|
| List files | `Glob("RootDesk/MyDesk/**/*.mlua")` | `ls`, `dir`, `Get-ChildItem`, `gci` |
| Check folder | `Glob("map/*")` | `ls`, `Test-Path`, `dir` |
| Read a file | `Read("RootDesk/MyDesk/Foo.mlua")`; for `.map` use `MapBuilder.read(...)` | `cat`, `type`, `Get-Content`, `gc`, `head`, `tail`, `more`, `less` |
| Search contents | `Grep("@Logic", glob: "*.mlua")` | `grep`, `findstr`, `Select-String`, `sls`, `rg` directly |
| Find file by name | `Glob("**/PlayerController.mlua")` | `find`, `where`, `Get-ChildItem -Recurse` |

The `Bash` / shell tool is reserved for actual programs (`git`, `npm`, MCP, build scripts). When you must invoke one:

1. Prefer workspace-relative paths (`git add RootDesk/MyDesk/Foo.mlua`).
2. If an absolute path is unavoidable, use forward slashes and double-quote: `"D:/msw-world-projects/.../map/"` — never `D:\...`. In bash on Windows, `\` is an escape character; `D:\foo\bar\` collapses to `D:foobar`.
3. Always double-quote paths containing spaces or non-ASCII.
4. Prefer POSIX commands (`ls`, `mv`, `cp`, `rm`) over OS-specific (`dir`, `type`, `del`).

> Symptom of violation: `ls: cannot access 'D:msw-world-projects...'` — the backslashes were eaten by bash. Stop and re-issue as `Glob` / `Read` / `Grep`.

### Runtime interaction requires MCP — no exceptions

⛔ **Never claim a runtime result without an actual MCP tool call.**

- Saying "I clicked the button" without calling `mouse_input` is a hallucination.
- Saying "it works" without calling `play` → `logs` is a hallucination.
- Saying "no errors" without calling `logs(category="build")` or `logs(category="runtime")` is a hallucination.

If a task requires runtime interaction (playing, clicking, typing, verifying behavior, checking logs), you **must** invoke the corresponding Maker MCP tool (`play`, `stop`, `logs`, `keyboard_input`, `mouse_input`, `maker_execute_script`). Text alone cannot substitute for tool execution. Use `screenshot` when you need to identify screen coordinates for input targeting or when the user explicitly requests it.

## 0. Plan (MANDATORY)

> **Prerequisite:** Foundation Skills (2) + Foundation references (4) + the matching `platform-{maple|rect|sideview}.md` + every triggered domain skill/reference must already be loaded (see PROJECT CONTEXT). Pass the 7 self-check questions before continuing.

1. **Classify the task:**
   - **New only** — add new scripts/entities/UI; no existing files to change.
   - **Modify existing** — change or extend existing files only.
   - **Both**.

2. **Branch:**
   - **New only** → skip workspace analysis; go to step 3.
   - **Modify existing / Both** → analyze the workspace by domain:

     | Domain | Editable | Reference | Search in |
     |---|---|---|---|
     | **Script** (logic, components, events) | `.mlua` | `.d.mlua` | RootDesk |
     | **Entity** (models, config, spawning) | `.model` | `.d.mlua` | RootDesk |
     | **UI** (widgets, layouts, bindings) | `.ui` | `.d.mlua` | ui |

     Search only the file types relevant to the request; read matches to learn patterns and dependencies.

3. **`TodoWrite`** — break the task into concrete, verifiable steps. A **Verify** todo (load `msw-scripting`, then Read `references/verify-checklist.md`) is required (see ## 3). Mark each todo `in_progress` when starting; `completed` only after verification passes.

## 1. Analyze

- Read `.d.mlua` for available APIs, signatures, parameter types.
- Read existing `.mlua` to learn current code patterns and conventions.
- For config tasks, read existing `.model` / `.ui` / other JSON config to understand structure.
- For new `.model` files, read examples from `Global/NativeModel/`.

## 2. Implement

- **Editable:** `.mlua`, `.model`, `.ui`, `.map` only. All other file types are read-only.
- **Never modify `.codeblock`** — auto-generated metadata for `.mlua`. Read for reference only; the runtime manages it.
- **File paths:** `.mlua` → `RootDesk/MyDesk/`, `.model` → `RootDesk/MyDesk/Models/`, `.map` → `map/`, `.ui` → `ui/`. Files outside these paths won't be recognized.
- **Never modify `Global/` or `Environment/`** — tell the user these are read-only and must be edited manually in the MSW editor.
- **Use builders for structured files:** `.model`, `.ui`, and `.map` edits must go through their skill-local builders (`ModelBuilder`, `UIBuilder`, `MapBuilder`) instead of raw JSON patching unless the relevant reference explicitly permits an exception.
- **Property types:** use `integer` (not `int`), `number` (not `float`).
- **Add `log()` calls** at critical checkpoints (e.g. `OnBeginPlay` entry, key variable values, important events) so Verify can confirm behavior.
- **`SpawnService` parent must NOT be nil.** Pass the target map entity (`self.Entity.CurrentMap`, or `_EntityService:GetEntityByPath("/maps/map01")`).

  ```
  -- ✅ Correct
  local map = self.Entity.CurrentMap
  _SpawnService:SpawnByModelId(modelId, name, pos, map)

  -- ❌ Wrong — LWA-3019 warning, undefined behavior
  _SpawnService:SpawnByModelId(modelId, name, pos, nil)
  ```

- **Pick the right script scope** based on lifetime, not just "globalness":

  | Scope | Use | Why |
  |---|---|---|
  | World-wide global manager (login session, account data, world-wide event bus, global UI manager) | `@Logic` | Engine-managed singleton; lives the entire world session, persists across map transitions; auto-registered. |
  | Map-scoped content (that map's quest controller, wave spawner, mini-game, NPC dialog) | `@Component` on the map entity (in `.map`'s `@components` or via `AddComponent`) | A `@Logic` survives map transitions and would leak state. The map-entity component participates in `OnBeginPlay` / `OnEndPlay` / `OnMapEnter` / `OnMapLeave` and is cleaned up on map unload. |
  | Per-entity behavior (monster AI, item pickup, player skill on a specific actor) | `@Component` on that entity (via `.model` or `AddComponent`) | Lifetime is tied to the actor. |

  Rule of thumb: *"Should this still be running when the player walks into another map?"* → Yes ⇒ `@Logic`. → No, only this map ⇒ map-entity `@Component`. → No, only this actor ⇒ actor `@Component`.

### Camera → Everything mapping

The camera perspective (`TileMapMode`) determines the entire physics, movement, map, and collision stack. **An entity with the wrong Body component will not move.**

| TileMapMode | View | Body | Map structure | Gravity | Movement |
|---|---|---|---|---|---|
| `MapleTile` | Side-view | `RigidbodyComponent` | `FootholdComponent` platforms | Yes | Left/right + jump |
| `RectTile` | Top-down | `KinematicbodyComponent` | `RectTileMapComponent` tiles | No | Free 4-directional |
| `SideViewRectTile` | Side-view | `SideviewbodyComponent` | `RectTileMapComponent` tiles | Yes | Left/right + jump (tile-based) |

### Script lifecycle

**Component lifecycle methods** (execute in this order based on entity state):

- `OnInitialize` — once after the entity and its components are created. Earliest point to reference other components, but they may not all be ready yet.
- `OnBeginPlay` — once when logic starts. Guarantees other components/entities exist; safe to reference.
- `OnMapEnter(Entity)` / `OnMapLeave(Entity)` — fires on every map transition. On the client, `OnMapEnter` also fires for other players already in the map. Both server and client.
- `OnSyncProperty(string name, any value)` — client-only. Called when a `@Sync` property finishes synchronizing. Not called if sync setting is None.
- `OnUpdate(number delta)` — every frame.
- `OnEndPlay` — when the entity is removed from the map.
- `OnDestroy` — immediately before the entity is destroyed.

**Logic lifecycle** — Logic is an engine-managed global singleton: created **once per world session** and persists across **all** map transitions. Its lifecycle is a **subset** of Component's — `OnMapEnter` / `OnMapLeave` do **NOT** fire on `@Logic`.

- `OnInitialize`, `OnBeginPlay` — once at world start.
- `OnUpdate` — every frame; runs **before** any Component's `OnUpdate`.
- `OnEndPlay` — only at world session end (e.g. shutdown). **Not** on map change.
- `OnDestroy` — when the Logic is removed (rare).

> ⚠️ **`OnMapEnter` / `OnMapLeave` do not fire on `@Logic`** — they are dispatched only to Components attached to map-scoped entities. Writing `method void OnMapEnter(Entity m) ... end` on a Logic compiles but the method is never invoked (silent dead code). For per-map setup/cleanup either (1) move the behavior to a `@Component` on the map entity (preferred), or (2) inside the Logic, poll `_UserService.LocalPlayer.CurrentMap` from `OnUpdate` and react to changes. Because a Logic survives map transitions, any timer / event handler / mutable state in a Logic that should reset per map must be cleared by one of these workarounds — there is no automatic hook.

**ExecSpace annotations** — control where code runs:

| Annotation | Behavior |
|---|---|
| `@ExecSpace("ServerOnly")` | Server only. |
| `@ExecSpace("ClientOnly")` | Client only. |
| `@ExecSpace("Server")` | Server; if called from client, sends a request to the server. |
| `@ExecSpace("Client")` | Client; if called from server, sends a request to the client. |

## 3. Verify

Load `msw-scripting` (`Skill: msw-scripting`) if not already loaded this turn, then Read `references/verify-checklist.md` in full and follow it.

## 4. On Failure

- Check ExecSpace first — confirm `_Service` calls run on the correct side (Client vs Server).
- Fix the code, then return to step 3 (Verify).
- Do not mark the todo as completed until verification passes.

## 5. Finally

If none of the above resolves the issue, tell the user:

> I could not find a solution through local implementation, Maker MCP, or Guide documents.
> You can get help from the MapleStory Worlds official Discord community:
>
> **https://discord.com/invite/maplestoryworlds**
<!-- <<< managed by mswai <<< -->

# ROLE & PROJECT CONTEXT

You are an expert assistant for **MapleStory World (MSW)** development. Treat every request as an MSW task in this project.

> 📚 **세부 가이드 (온디맨드 로드)** — 아래 본문에는 **항상 적용되는 핵심 규칙만** 인라인으로 남겼습니다. 나머지는 기능별 문서로 분리되어 있으며, 일반 마크다운 링크라 자동 임포트되지 않습니다. **작업 도메인이 해당하면 시작 전 반드시 직접 Read로 로드**하십시오.
> - 게임 물리·조작키·맵 모드 → [docs/agents/physics-controls.md](./docs/agents/physics-controls.md)
> - 컴포넌트 설계·디렉터리 구조 규칙 → [docs/agents/directory-structure.md](./docs/agents/directory-structure.md)
> - 스킬/레퍼런스 로드 프로토콜 (도메인 트리거 매트릭스) → [docs/agents/skill-routing.md](./docs/agents/skill-routing.md)
> - 개발 워크플로우·MCP 검증 프로세스 → [docs/agents/workflow.md](./docs/agents/workflow.md)

---

## 1. 작업 범위 (Scope of Work) — 항상 적용

* **허용된 작업 영역**:
  * **스크립트, 데이터셋 및 모델 작성**: [RootDesk/MyDesk/](./RootDesk/MyDesk/) 폴더 하위에서만 수행합니다.
  * **플레이어 설정**: [Global/DefaultPlayer.model](./Global/DefaultPlayer.model)을 직접 수정 및 설정할 수 있습니다.
  * **월드 구성**: [Global/WorldConfig.config](./Global/WorldConfig.config)를 수정하여 물리 및 카메라 관련 전역 값을 튜닝할 수 있습니다.
  * **맵 데이터**: `map/` 폴더 하위의 맵 파일들(예: [map01.map](./map/map01.map))을 수정할 수 있습니다.
* **수정 금지 영역**:
  * **`Environment/` 폴더**: 절대 생성, 수정, 삭제하지 마십시오.
  * **자동 생성 파일**: 자동 생성되는 `.codeblock` 또는 `.d.mlua` 파일은 직접 수정하지 마십시오 (에디터 Refresh 시 자동 재생성됨).

---

## 2. ⛔⛔ 하드코딩 절대 금지 룰 (CRITICAL — 최우선 준수 사항)

모든 게임 로직, 특히 **상호작용 로직**(채집/제련/제작/거래/설치/전투 등 아이템·자원·엔티티 간 상호작용)을 작성할 때 아래 순서를 **반드시** 따르십시오. 이는 협상 불가능한 절대 규칙입니다.

1. **데이터셋 우선 (Data-Driven First)**: 아이템 이름, 레시피, 수량, 소요 시간, 확률, 연료/재료 종류, 분기 조건 등 **모든 "데이터성" 값**은 코드에 박지 말고 **데이터셋(`.userdataset` + `.csv`), 스트럭트(Struct), 컴포넌트(Component) 프로퍼티**로 분리하여 런타임에 `_DataService:GetTable(...)` 등으로 조회하십시오.
   * 예: 화로 제련은 `SmeltingRecipeDataSet`(InputItem/InputCount/OutputItem/SmeltDuration) + `FurnaceFuelDataSet`(FuelItem/BurnTime)로 관리하며, 서버(`Furnace.mlua`)와 클라(`UIFurnaceController`/`UIInventoryController`) **양쪽 모두** 데이터셋을 조회합니다. 신규 연료·광석은 **CSV 행 추가만으로** 자동 반영되어야 합니다.
2. **서버/클라 이름 일관성**: 아이템 식별 문자열은 반드시 **인벤토리에 실제 저장되는 키(= `item_dataset`의 `Name` 컬럼 값)** 와 일치시키십시오. 소문자 `id`와 표시명 `Name`을 혼동하여 비교하면 상호작용이 조용히 실패합니다.
3. **`if itemName == "..."` 형태의 이름 분기 금지**: 특정 아이템/모델 이름을 코드에 직접 비교하는 분기문을 작성하지 마십시오. 대신 데이터셋에 행이 존재하는지(`FindRow`)로 판정하십시오.
4. **하드코딩이 불가피하다고 판단될 때**: 구현을 시작하기 **전에** 반드시 멈추고, **왜 데이터 주도 설계가 불가능한지 근거와 함께 사용자에게 질문하여 명시적 승인을 받은 뒤** 진행하십시오. 승인 없이 임의로 하드코딩하지 마십시오.

> 공통 속성 모듈화·컴포넌트 기반 설계의 세부 가이드는 [docs/agents/directory-structure.md](./docs/agents/directory-structure.md)를 참조하십시오.

---

## 3. 8대 핵심 규칙 (8 Core Rules) — 항상 적용

1. **TileMapMode ↔ Body mapping** 불일치 시 엔티티가 움직이지 않으며 에러 없이 실패합니다 (`platform.md` §4).
2. 유저 스크립트는 반드시 `.mlua` + `.codeblock` **쌍(pair)**으로 존재해야 합니다. `.codeblock`은 Maker `refresh` 시 자동 생성됩니다.
3. `SpriteRUID`가 빈 문자열(`""`)이면 엔티티가 화면에 렌더링되지 않습니다 (무언가 그려져야 한다면 반드시 유효 RUID 바인딩).
4. `SpawnByModelId` 호출 시 `parent` 매개변수에 `nil`을 전달하면 런타임 에러가 발생합니다 (`self.Entity.CurrentMap` 등을 사용).
5. 좌표는 **월드 단위(world unit)**를 사용합니다 (1 unit = 100 px). 픽셀 단위로 설정 시 100배 큰 값으로 동작하여 화면 밖으로 벗어납니다.
6. Maker는 오직 `RootDesk/`만 스캔합니다. 유저가 생성한 파일이 `Global/` 아래에 있을 경우 Maker 에디터에 보이지 않습니다.
7. `.d.mlua` 및 `.codeblock` 파일은 절대 직접 수정하지 마십시오.
8. CoreVersion 호환성은 `26.5.0.0`으로 고정됩니다.

---

## 4. 운영 및 툴 규칙 (Operational & Tool Rules) — 항상 적용

* **경로 표현**: 모든 파일 경로에는 백슬래시(`\`) 대신 슬래시(`/`)를 사용하십시오.
* **파일 및 탐색 제어**: 워크스페이스를 조회하거나 파일을 읽을 때 `ls`, `dir`, `cat`, `grep` 등의 **쉘 명령어를 사용하지 마십시오**. 에디터 탐색 및 리드에는 반드시 `Glob`, `view_file`, `grep_search` 도구만 사용하고, `Bash` 쉘 도구는 `git` 또는 `npm` 등 실제 프로그램 구동 시에만 사용하십시오.
* **런타임 상호작용 검증**: Play mode 실행, 로그 확인, UI 인터랙션 등은 반드시 MCP 도구(`play`, `stop`, `logs`, `keyboard_input` 등)를 호출하여 확인하십시오. 도구 호출 없는 결과 확언은 불가능합니다.

> 구현→검증 단계의 상세 절차(필수 툴 체인, 5단계 워크플로우)는 [docs/agents/workflow.md](./docs/agents/workflow.md)를 참조하십시오.
