# T30 작업 보고서 — 가구 비주얼 데이터 주도화 (설치 프리뷰 RUID 컬럼 + Furnace 외형 프로퍼티화)

- **작업**: T30 가구 비주얼 데이터 주도화 — 설치 프리뷰 RUID 컬럼 + Furnace 외형 프로퍼티화 (`docs/agents/subagent-handoff.md` §3 해당 항목)
- **상태**: 코드 완료 | LSP·refresh 보류 (레인 마지막에 일괄 수행) | Play 검증 보류(제작자)
- **수행 에이전트/환경**: Antigravity (Gemini 3.5 Flash), Maker 미기동, LSP 미기동
- **날짜**: 2026-07-11

## 1. 요약

가구 설치 시 프리뷰 RUID와 `Furnace.mlua` 컴포넌트의 대기/가동 스프라이트 RUID에 대한 하드코딩 리터럴을 제거했습니다. `item_dataset.csv`에 `PreviewRUID` 컬럼을 신설하고, `Furnace.mlua`에는 `IdleSpriteRUID` / `ActiveSpriteRUID` 프로퍼티를 추가하여 컴포넌트 레벨에서 비주얼을 데이터 주도적으로 제어할 수 있도록 개편했습니다. 또한, 신규 가구인 조리 냄비(Cooking Pot)에 전용 Cauldron 스프라이트 RUID를 매핑하여 화로 외형 placeholder 문제를 근본적으로 해결했습니다.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `RootDesk/MyDesk/Player/Scripts/PlayerController.mlua` | 가구 설치 프리뷰 RUID 결정 시 `item_dataset`의 `PreviewRUID`를 동적으로 조회하도록 변경 |
| `RootDesk/MyDesk/Furniture/Scripts/Furnace.mlua` | `IdleSpriteRUID`, `ActiveSpriteRUID` 프로퍼티 추가 및 대기/가동 시 스프라이트 RUID 리터럴을 해당 프로퍼티 값으로 대체 |
| `RootDesk/MyDesk/Furniture/Models/Furniture_CookingPot.model` | `SpriteRUID`, `IdleSpriteRUID`, `ActiveSpriteRUID` 프로퍼티를 냄비 RUID(`6017c4c6f4c94c6d8dced78d350d3dac`)로 오버라이드 |
| `RootDesk/MyDesk/item/DataSets/item_dataset.csv` | `PreviewRUID` 컬럼 신설 및 Furnace, Cooking Pot 행에 맞춤형 프리뷰 RUID 할당 |

## 3. 구현 상세

- **Change ①**: `item_dataset.csv`에 `PreviewRUID` 컬럼을 신설하고, `furnace` 행에 `"a3b810b8178847a0b9ec54bc4b63ba96"`을 지정했습니다. `PlayerController.mlua`에서 `"Furnace"` 이름으로 직접 분기하여 RUID를 박아넣던 방식을 제거하고 `item_dataset`에서 `PreviewRUID`를 조회하여 사용하도록 리팩터링했습니다.
- **Change ②**: `Furnace.mlua`에 `IdleSpriteRUID` (기본값 `"a3b810b8178847a0b9ec54bc4b63ba96"`)와 `ActiveSpriteRUID` (기본값 `"3f06b48247e5497190ca26e57bf4729e"`) 프로퍼티를 선언하고, 업데이트 핸들러에서 리터럴 RUID 대신 해당 프로퍼티 값을 읽어 적용하도록 변경했습니다.
- **Change ③**: `msw-search`로 가구/오브젝트 카테고리에서 냄비/솥으로 적합한 RUID `"6017c4c6f4c94c6d8dced78d350d3dac"`을 발굴했습니다. `ModelBuilder`를 활용하여 `Furniture_CookingPot.model` 내 `SpriteRUID` 및 Furnace 컴포넌트의 `IdleSpriteRUID` / `ActiveSpriteRUID` 값을 해당 RUID로 오버라이드했습니다. 또한, `item_dataset.csv` 내 Cooking Pot의 `PreviewRUID`에도 이 값을 매핑하여 설치 프리뷰 비주얼을 일치시켰습니다.

## 4. 수행한 검증과 결과

- **ModelBuilder API 검증**: 임시 node 스크립트를 통해 `ModelBuilder`로 `Furniture_CookingPot.model`의 프로퍼티 값들을 검증 규칙에 맞춰 정상 수정(components 6, values 11개로 확장 반영)했습니다.
- **LSP 및 Maker refresh**: 레인 B의 모든 티켓이 완료된 후에 일괄적으로 1회 refresh 검증을 수행할 예정이므로 보류 상태입니다.
- **Play 런타임 검증**: 지휘자 규정에 따라 런타임 검증은 보류(제작자 직접 수행)입니다.

## 5. 발견한 문제 / 후속 제안

- 없음.

## 6. 제작자 런타임 체크리스트

- [ ] 화로(Furnace) 및 조리 냄비(Cooking Pot) 설치 프리뷰 모드 진입 시 각각의 외형에 맞는 프리뷰 실루엣이 정상 표시되는지 확인
- [ ] 조리 냄비(Cooking Pot)를 맵에 배치했을 때 Cauldron 외형(`6017c4c6f4c94c6d8dced78d350d3dac`)으로 렌더링되며, 화로와 완전히 구분되는지 확인
- [ ] 화로 및 냄비가 가동/대기 상태로 바뀔 때 각 모델의 `IdleSpriteRUID`/`ActiveSpriteRUID` 프로퍼티에 맞게 스프라이트가 정상 전환되는지 확인
- [ ] 기존 화로 가동 전환 로직에 회귀(동작 정지 등)가 없는지 확인

## 7. 이력

- 2026-07-11 최초 작성 (Antigravity)
