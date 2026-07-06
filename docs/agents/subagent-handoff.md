# 하위 에이전트 작업 핸드오프 (Subagent Handoff)

> **용도**: 상위 에이전트/보스가 하위 에이전트에게 작업을 위임할 때 이 문서를 그대로 전달한다.
> 하위 에이전트는 **§1 공통 컨텍스트를 먼저 전부 읽고**, §3 작업 큐에서 지정된 작업 항목만 수행한다.
> 새 작업이 생기면 §3에 항목을 추가하고, 완료되면 상태를 갱신한다.

---

## 1. 공통 컨텍스트 (모든 작업 전 필독)

### 1.1 프로젝트

- MSW(MapleStory Worlds) 생존/채집 게임. 루트: `C:/Users/yaong/Documents/메이플월드`
- 톱다운 `RectTile` 맵 (영지 `Home_<UserId>` / 공동 마을 `town` / 사냥터). 플레이어는 `KinematicbodyComponent`.
- 전체 게임 설계: `game_design.md` (84KB — 필요한 §만 검색해 읽을 것)
- 에이전트 규칙: `AGENTS.md` + `docs/agents/*.md` (특히 하드코딩 금지 룰 §2, 8대 핵심 규칙 §3)

### 1.2 절대 규칙 (위반 시 작업 무효)

1. **하드코딩 금지**: 아이템명/수치/모션명 등 데이터성 값은 `if name == "..."` 분기 금지. 데이터셋(`.csv` + `.userdataset`) 컬럼으로 관리하고 `_DataService:GetTable(...):FindRow(...)`로 조회한다. 불가피하면 **구현 전에 보스에게 질문**.
2. 편집 허용: `RootDesk/MyDesk/**`, `Global/DefaultPlayer.model`, `Global/WorldConfig.config`, `map/*.map`, `ui/*.ui`(빌더 경유). `.codeblock`/`.d.mlua`/`Environment/`는 절대 수정 금지.
3. 좌표는 월드 단위(1 unit = 100px). `SpawnByModelId`의 parent에 nil 금지(`self.Entity.CurrentMap` 사용).
4. 아이템 식별자는 `item_dataset`의 `Name` 컬럼 값(표시명 키)이다. 소문자 `id`와 혼동 금지.
5. 런타임 검증 없이 "동작함"이라고 보고 금지. Maker MCP(`refresh`→`play`→`logs`→`stop`)를 못 쓰는 환경이면 "코드 수정 완료, 런타임 검증 보류"로 정확히 보고.

### 1.3 도구 장착/스윙 파이프라인 (이번 버그의 배경지식)

- **장착**: `PlayerInventory.EquippedTool`(@Sync) → `ApplyHeldToolCostume()`이 `item_dataset`의 `WeaponRUID`를 읽어 `CostumeManagerComponent:SetEquip(MapleAvatarItemCategory.OneHandedWeapon, ruid)`로 아바타 한손무기 슬롯에 반영. (`RootDesk/MyDesk/Player/Scripts/PlayerInventory.mlua` ~L380)
- **스윙**: Ctrl 채집/공격 → `PlayerController.mlua` ~L506 `ChangeState("MINE")` → 커스텀 상태 `MineState.mlua`(`RootDesk/MyDesk/Player/Scripts/`, `Player.stateset`의 MINE 노드)가 `ActionStateChangedEvent`로 아바타 바디에 스윙 액션 재생.
- **핵심 제약**: 도구는 **OneHandedWeapon** 슬롯 장착이므로 무기 파츠 프레임은 **한손(*O*) 계열 액션**(`swingO1~O3`, `stabO1~O2` 등)에만 존재한다. `swingT*`(두손) 액션을 재생하면 몸 모션은 나오지만 **무기 프레임이 없어 모션 중 도구가 사라진다.**
- 스윙 액션 선택은 `item_dataset.csv`의 **`SwingAction` 컬럼**(1순위) → `ToolType` 폴백(pickaxe→`swingO1`, axe→`swingO2`) → 기본 `stabO2` 순.

### 1.4 검증 프로토콜 (Maker MCP)

- 브리지 스크립트: `scratch/mcp_probe.py`(연결/툴 목록), `scratch/run_lua.py`(Play 컨텍스트 Lua 실행), `scratch/watch_maker_logs.py`(로그 감시).
- ⚠️ 위 스크립트들은 MCP bat 경로가 `C:\Users\mh566\...`으로 하드코딩되어 있음 — 현재 머신(`yaong`)에는 해당 경로가 없다. 사용 전 실제 설치 경로로 수정 필요 (§3 T3).
- 표준 절차: Maker 에디터 실행 상태에서 `refresh` → `play` → 시나리오 재현 → `logs(kind=normal)`에서 Error/Warning 확인 → `stop`.

---

## 2. 완료된 작업 기록

### T1. 스윙 모션 중 손에 든 도구 사라짐 버그 수정 — **코드 수정 완료, 런타임 검증 보류**

- **증상**: 도구 장착 시 평상시엔 보이는데, 휘두르는(채집/공격) 모션 동안에만 도구가 안 보임.
- **원인**: `MineState.mlua`가 pickaxe에 두손 액션 `swingT1`을 재생. 도구는 OneHandedWeapon 슬롯 장착이라 swingT 프레임이 없어 모션 중 무기 미렌더 (코드 주석에 이미 경고돼 있던 사항).
- **수정 내용**:
  1. `RootDesk/MyDesk/Player/Scripts/MineState.mlua` — 액션 선택을 데이터 주도로 변경: `item_dataset`의 `SwingAction` 컬럼 1순위(pcall 가드로 컬럼 부재 시 안전), 폴백은 ToolType 기반 **한손 액션만** 사용(pickaxe→`swingO1`, axe→`swingO2`), 기본 `stabO2`.
  2. `RootDesk/MyDesk/item/DataSets/item_dataset.csv` — `SwingAction` 컬럼 추가. 곡괭이 3종=`swingO1`, 도끼 3종(hand/stone/copper/iron)=`swingO2`, 비도구=공백.
- **남은 검증 (§1.4 절차)**: Maker `refresh` 후 Play → 곡괭이/도끼 각각 장착 → Ctrl 스윙 → ①모션 전체 구간에서 도구 렌더 확인 ②`swingO1`/`swingO2` 모션 자연스러움 확인 ③logs에 SwingAction 관련 Error 없음 확인. 모션이 어색하면 **코드 수정 없이 CSV의 SwingAction 값만 교체**(한손 액션 내에서: swingO1/O2/O3, stabO1/O2).

### T1-b. pickaxe 스윙 = `swingT1` (보스 지시) — CSV 데이터로만 반영, **되돌리지 말 것**

- 보스 지시로 곡괭이 스윙을 `swingT1`(양손 머리 위 내리찍기)로 변경. **코드 무수정** — `item_dataset.csv` 곡괭이 3종(stone/copper/iron_pickaxe)의 `SwingAction`을 `swingO1`→`swingT1`로 교체(1순위 데이터 소스). 도끼는 `swingO2` 유지.
- ⚠️ 위 T1 경고(한손 슬롯이라 swingT* 프레임 없음 → 스윙 중 무기 미표시)를 **보스가 인지한 상태에서 명시적으로 선택**한 값이다. 향후 에이전트는 이 값을 임의로 `swingO*`로 되돌리지 말 것(모션/무기표시가 문제면 보스에게 확인). 도구를 스윙 내내 표시해야 한다면 대안은 `PlayerInventory.ApplyHeldToolCostume`에서 곡괭이를 `MapleAvatarItemCategory.TwoHandedWeapon` 슬롯으로 장착하도록 전환하는 것.

---

## 3. 작업 큐 (하위 에이전트 위임 대상)

> 상태: `[대기]` / `[진행]` / `[완료]` / `[보류]`
> 각 항목은 **Target(파일) / Change(변경) / Acceptance(완료 기준)** 3요소를 반드시 채운다.

### T2. [대기] T1 런타임 검증
- **Target**: 코드 변경 없음 (검증 전용)
- **Change**: §2 T1의 "남은 검증" 절차 수행. 실패 시 CSV `SwingAction` 값 조정 또는 원인 재분석 후 보고.
- **Acceptance**: 곡괭이·도끼 스윙 모션 전 구간에서 도구가 보이는 것을 Play 모드에서 확인, logs 무에러.

### T3. [완료] MCP 브리지 스크립트 경로 이식성 수정
- **Target**: `scratch/mcp_probe.py`, `scratch/watch_maker_logs.py`
- **Change**: `C:\Users\mh566\...` 하드코딩을 제거하고 `%LOCALAPPDATA%\Nexon\MapleStory Worlds\MakerMCP\msw-maker-mcp.bat` 기반 자동 탐색 + 환경변수(`MSW_MCP_BAT`) 오버라이드로 교체.
- **Acceptance**: 현재 머신에서 `python scratch/mcp_probe.py` 실행 시 경로 에러 없이 초기화 시도(에디터 미실행 시 "INIT TIMEOUT" 메시지)까지 도달.
- **결과 [완료]**: 두 스크립트에 동일한 `resolve_mcp_bat()` 추가. 우선순위 = `MSW_MCP_BAT` 환경변수 → 프로젝트 `.mcp.json`의 `msw-maker-mcp` args에서 `.bat` 경로 추출 → 알려진 설치 경로(`%LOCALAPPDATA%\Nexon\...`, `C:\Nexon\...`). **문서의 `%LOCALAPPDATA%` 가정은 이 머신에 부재** — 실제 경로는 `.mcp.json` 기준 `C:\Nexon\MapleStory Worlds\MakerMCP\msw-maker-mcp.bat`이므로 `.mcp.json`을 1차 소스로 사용하는 게 가장 이식성 높음. 검증: 리졸버 격리 실행 → 경로 반환·존재·`MSW_MCP_BAT` 오버라이드 확인. (전체 probe 실행은 라이브 Claude MCP 세션과의 브리지 충돌 우려로 생략 — 런타임 연결 확인은 필요 시 직접 `python scratch/mcp_probe.py`.)
- ⚠️ **주의**: `watch_maker_logs.py`는 `if __name__ == "__main__"` 가드 없이 모듈 최상위에서 감시 루프가 즉시 실행됨. **import 금지**(import만으로 MCP 브리지가 떠서 세션 충돌). 반드시 `python scratch/watch_maker_logs.py`로 직접 실행할 것.

### (신규 작업 추가 템플릿)
```
### T<n>. [대기] <제목>
- **배경**: <왜 필요한가, 관련 game_design.md §>
- **Target**: <수정할 파일 경로들>
- **Change**: <단계별 변경 내용, 사용할 데이터셋/API>
- **Acceptance**: <관찰 가능한 완료 기준 + 검증 방법>
```

---

## 4. 하위 에이전트 보고 형식

작업 종료 시 다음을 보고한다:
1. 수정한 파일 전체 목록 (경로)
2. 실제 수행한 검증과 결과 (수행 못 한 검증은 "보류"로 명시 — 허위 "동작 확인" 금지)
3. 새로 발견한 문제 (있다면 §3에 신규 T항목으로 추가)
