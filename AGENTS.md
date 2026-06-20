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
