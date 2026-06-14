# ROLE & PROJECT CONTEXT

You are an expert assistant for **MapleStory World (MSW)** development. Treat every request as an MSW task in this project.

## 1. AI 개발 가이드라인 (AI Guidelines)

### 1.1. 작업 범위 (Scope of Work)
* **허용된 작업 영역**:
  * **스크립트, 데이터셋 및 모델 작성**: [RootDesk/MyDesk/](./RootDesk/MyDesk/) 폴더 하위에서만 수행합니다.
  * **플레이어 설정**: [Global/DefaultPlayer.model](./Global/DefaultPlayer.model)을 직접 수정 및 설정할 수 있습니다.
  * **월드 구성**: [Global/WorldConfig.config](./Global/WorldConfig.config)를 수정하여 물리 및 카메라 관련 전역 값을 튜닝할 수 있습니다.
  * **맵 데이터**: `map/` 폴더 하위의 맵 파일들(예: [map01.map](./map/map01.map))을 수정할 수 있습니다.
* **수정 금지 영역**: 
  * **`Environment/` 폴더**: 절대 생성, 수정, 삭제하지 마십시오.
  * **자동 생성 파일**: 자동 생성되는 `.codeblock` 또는 `.d.mlua` 파일은 직접 수정하지 마십시오 (에디터 Refresh 시 자동 재생성됨).

### 1.2. 게임 물리 및 기본 조작키 (Physics & Controls)
* **맵 기본 설정**: 맵 [map01.map](./map/map01.map)은 `TileMapMode = 1` (RectTileMap, 탑다운 격자형 맵)으로 구성되어 있습니다.
* **물리 컴포넌트**: 모든 동적 엔티티(플레이어, 몬스터 등)는 중력이 없는 **`KinematicbodyComponent`**를 바디 컴포넌트로 사용해야 합니다.
* **조작 키 기본값**:
  * **이동**: 방향키 (Arrow Keys - Left, Right, Up, Down)로 4방향 이동.
  * **점프 (비주얼 점프)**: Alt 키 (물리적 높이 변화 없는 비주얼 점프).
  * **공격 / 채광**: Ctrl 키 (바라보는 방향의 인접 셀 타격).

### 1.3. MSW-MCP 연동 및 검증 프로세스
* 에디터 제어 및 로그 모니터링은 **`msw-maker-mcp`**를 활용하십시오.
* **필수 툴 체인**:
  * `refresh`: 파일 변경 사항을 에디터에 동기화.
  * `play` / `stop`: 플레이 모드 시작 및 중지.
  * `clear_logs` -> `logs`: 빌드 오류 및 런타임 오류 검출.
* **RUID 유효성**: `SpriteRendererComponent` 등 생성 시, `SpriteRUID`를 비워두지 말고 적절한 리소스를 `msw-search`로 검색하여 바인딩하십시오.
* **Builder 사용**: `.map`, `.model`, `.ui` 파일을 수정할 때는 [references/builder-protocol.md](./plugins/msw-maker-base-skill/skills/msw-general/references/builder-protocol.md)를 숙지하고 각각의 Builder 스크립트를 사용하십시오.

### 1.4. 컴포넌트 기반 설계 및 하드코딩 방지 가이드라인 (Component-Based & Modular Design)
* **공통 속성 모듈화**: 자원, 몬스터, NPC 등 여러 모델에 유사하게 적용되는 특수 기능이나 데이터 속성(예: 자원의 격자 점유 영역 `ResourceOccupiedArea`)은 반드시 독립된 컴포넌트 스크립트로 정의하여 모델에 장착하고 각 모델의 프로퍼티 기본값으로 관리하십시오.
* **하드코딩 금지**: 로직 스크립트(예: Spawner 등) 내부에서 모델 이름이나 종류에 따라 좌표, 공격력, 속도 등의 수치를 분기 조건문으로 하드코딩하지 말고, 모델에 결합된 개별 컴포넌트 값을 동적으로 조회하여 처리하도록 설계해야 합니다.
* **⛔⛔ 하드코딩 절대 금지 룰 (CRITICAL — 최우선 준수 사항)**: 모든 게임 로직, 특히 **상호작용 로직**(채집/제련/제작/거래/설치/전투 등 아이템·자원·엔티티 간 상호작용)을 작성할 때 아래 순서를 **반드시** 따르십시오. 이는 협상 불가능한 절대 규칙입니다.
  1. **데이터셋 우선 (Data-Driven First)**: 아이템 이름, 레시피, 수량, 소요 시간, 확률, 연료/재료 종류, 분기 조건 등 **모든 "데이터성" 값**은 코드에 박지 말고 **데이터셋(`.userdataset` + `.csv`), 스트럭트(Struct), 컴포넌트(Component) 프로퍼티**로 분리하여 런타임에 `_DataService:GetTable(...)` 등으로 조회하십시오.
     * 예: 화로 제련은 `SmeltingRecipeDataSet`(InputItem/InputCount/OutputItem/SmeltDuration) + `FurnaceFuelDataSet`(FuelItem/BurnTime)로 관리하며, 서버(`Furnace.mlua`)와 클라(`UIFurnaceController`/`UIInventoryController`) **양쪽 모두** 데이터셋을 조회합니다. 신규 연료·광석은 **CSV 행 추가만으로** 자동 반영되어야 합니다.
  2. **서버/클라 이름 일관성**: 아이템 식별 문자열은 반드시 **인벤토리에 실제 저장되는 키(= `item_dataset`의 `Name` 컬럼 값)** 와 일치시키십시오. 소문자 `id`와 표시명 `Name`을 혼동하여 비교하면 상호작용이 조용히 실패합니다.
  3. **`if itemName == "..."` 형태의 이름 분기 금지**: 특정 아이템/모델 이름을 코드에 직접 비교하는 분기문을 작성하지 마십시오. 대신 데이터셋에 행이 존재하는지(`FindRow`)로 판정하십시오.
  4. **하드코딩이 불가피하다고 판단될 때**: 구현을 시작하기 **전에** 반드시 멈추고, **왜 데이터 주도 설계가 불가능한지 근거와 함께 사용자에게 질문하여 명시적 승인을 받은 뒤** 진행하십시오. 승인 없이 임의로 하드코딩하지 마십시오.

### 1.5. 디렉터리 구조 관리 규칙 (Directory Structure — MUST FOLLOW)
프로젝트 가독성을 위해 [RootDesk/MyDesk/](./RootDesk/MyDesk/) 하위는 **카테고리 → 자산 종류** 2단계 구조를 **항상 유지**해야 합니다. 새 파일을 만들 때도 이 구조에 맞춰 올바른 폴더에 생성하십시오.

* **1단계 — 오브젝트 카테고리별 폴더**: `MapObjects/`(맵 자원), `Furniture/`(가구·설치물), `item/`(아이템), `Player/`(플레이어), `UI/`(UI) 등 오브젝트 성격별로 최상위 분류.
* **2단계 — 자산 종류별 하위 폴더**: 각 카테고리 내부를 다음 하위 폴더로 분리합니다.
  * `Models/` — 해당 카테고리의 `.model` 파일.
  * `Scripts/` — 해당 카테고리의 `.mlua` (+ 자동 생성 `.codeblock`) 파일.
  * `DataSets/` — 해당 카테고리의 `.userdataset` + `.csv` 파일.
  * (필요 시 `States/` 등 — 예: `Player/States/Player.stateset`)
* **소속 일치 원칙**: 데이터셋·스크립트·모델은 **그 기능이 속한 카테고리**에 두십시오. 예: 화로 관련 데이터셋은 `MapObjects/`가 아니라 `Furniture/DataSets/`에 둡니다.
* **이동/리네임 안전성**: 모델은 `modelId`(UUID), 데이터셋은 `name`, 스크립트 컴포넌트는 `script.<Name>`으로 참조되므로 폴더 이동은 런타임 참조를 깨지 않습니다. 단, **반드시 쌍 단위로 함께 이동**하십시오(`.mlua`+`.codeblock`, `.userdataset`+`.csv`). 이동 후 `refresh` + `logs`로 재임포트를 검증하십시오.
* **죽은 코드 정리**: 더 이상 어떤 `.ui`/`.map`/`.model`에서도 참조되지 않는 스크립트/모델은 방치하지 말고, 사용자 확인 후 제거하여 구조를 깔끔하게 유지하십시오.

---

## 2. MSW CORE RULES & WORKSPACE

### 2.1. 8대 핵심 규칙 (8 Core Rules)
1. **TileMapMode ↔ Body mapping** 불일치 시 엔티티가 움직이지 않으며 에러 없이 실패합니다 (`platform.md` §4).
2. 유저 스크립트는 반드시 `.mlua` + `.codeblock` **쌍(pair)**으로 존재해야 합니다. `.codeblock`은 Maker `refresh` 시 자동 생성됩니다.
3. `SpriteRUID`가 빈 문자열(`""`)이면 엔티티가 화면에 렌더링되지 않습니다 (무언가 그려져야 한다면 반드시 유효 RUID 바인딩).
4. `SpawnByModelId` 호출 시 `parent` 매개변수에 `nil`을 전달하면 런타임 에러가 발생합니다 (`self.Entity.CurrentMap` 등을 사용).
5. 좌표는 **월드 단위(world unit)**를 사용합니다 (1 unit = 100 px). 픽셀 단위로 설정 시 100배 큰 값으로 동작하여 화면 밖으로 벗어납니다.
6. Maker는 오직 `RootDesk/`만 스캔합니다. 유저가 생성한 파일이 `Global/` 아래에 있을 경우 Maker 에디터에 보이지 않습니다.
7. `.d.mlua` 및 `.codeblock` 파일은 절대 직접 수정하지 마십시오.
8. CoreVersion 호환성은 `26.5.0.0`으로 고정됩니다.

### 2.2. 로컬 스킬 및 레퍼런스 로드 프로토콜 (Skill Loading Protocol)
Gemini 에이전트는 내장 `Skill` 도구가 없으므로, 작업 시작 전 및 매 턴마다 아래 절대 경로의 `SKILL.md` 및 관련 `references/*.md`를 `view_file`로 직접 로드해야 합니다.

* **로컬 스킬 디렉토리**: `<App Data Directory>/config/plugins/msw-maker-base-skill/skills/` (에이전트가 본인의 App Data Directory 경로 하위에서 로드)

| 도메인 트리거 키워드 | 스킬 폴더명 | 필수 레퍼런스 파일 |
|---|---|---|
| script / mlua / component / event / lifecycle | `msw-scripting` | `references/verify-checklist.md`, `references/datastorage.md` |
| sprite / animation / sound / RUID / find | `msw-search` | `references/resource/search.md`, `references/resource/detail.md` |
| SpriteRUID / ImageRUID / thumbnail:// / icon | `msw-sprite-ruid` | (없음) |
| avatar / costume / equipment / state | `msw-avatar` | (없음) |
| DefaultPlayer / player / speed / camera | `msw-defaultplayer` | (없음) |
| attack / hit / damage / combat / monster | `msw-combat-system` | `../msw-general/references/monster.md`, `references/hp-gauge.md` |
| inventory / shop / ranking / quest / packages | `msw-packages` | (없음) |
| popup / HUD / button / toast / .ui | `msw-ui-system` | `references/templates/templates.md`, `../msw-general/references/builder-protocol.md` §3 |
| entity / .map / transform / spawn | `msw-general` | `references/entity.md`, `references/builder-protocol.md` §1 |
| .model / template | `msw-general` | `references/model.md`, `references/builder-protocol.md` §4 |
| TileMapMode / Body / gravity / platform | `msw-general` | `references/platform.md`, `references/platform-rect.md` (RectTile 용) |
| DataSet / userdataset / .csv | `msw-general` | `references/dataset.md` |
| MCP tools / refresh / logs | `msw-general` | `references/workspace.md` |

---

## 3. OPERATIONAL & TOOL RULES

* **경로 표현**: 모든 파일 경로에는 백슬래시(`\`) 대신 슬래시(`/`)를 사용하십시오.
* **파일 및 탐색 제어**: 워크스페이스를 조회하거나 파일을 읽을 때 `ls`, `dir`, `cat`, `grep` 등의 **쉘 명령어를 사용하지 마십시오**. 에디터 탐색 및 리드에는 반드시 `Glob`, `view_file`, `grep_search` 도구만 사용하고, `Bash` 쉘 도구는 `git` 또는 `npm` 등 실제 프로그램 구동 시에만 사용하십시오.
* **런타임 상호작용 검증**: Play mode 실행, 로그 확인, UI 인터랙션 등은 반드시 MCP 도구(`play`, `stop`, `logs`, `keyboard_input` 등)를 호출하여 확인하십시오. 도구 호출 없는 결과 확언은 불가능합니다.

---

## 4. DEVELOPMENT WORKFLOW

1. **Plan (계획)**: 변경 유형 확인 (New / Modify / Both), 작업 내역 분해 및 `TodoWrite` 작성.
2. **Analyze (분석)**: `.d.mlua` 및 기존 코드 분석, 데이터셋 구조 분석.
3. **Implement (구현)**: 지정된 빌더 사용, `log()` 추가, `SpawnService` parent 확인, float 대신 number/integer 활용.
4. **Verify (검증)**: `refresh` -> `play` -> `logs` -> `stop` 순서로 검증 및 로그 확인.
5. **On Failure (실패 시)**: 실행 영역(Client vs Server) 및 `logs` 체크 후 재시도.
