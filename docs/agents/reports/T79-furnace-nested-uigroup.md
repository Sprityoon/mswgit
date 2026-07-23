# T79 작업 보고서 — PopupGroup.ui 중첩 UIGroup 제거 (L029)

- **작업**: T79 PopupGroup.ui 중첩 UIGroup 제거 — 신규 린트 L029 ERROR 해소 (`docs/agents/subagent-handoff.md` §3)
- **상태**: 코드 완료 | ui_lint error=0 (L029 소멸) | Maker MCP 미연결 — refresh·Play 검증 보류(제작자)
- **수행 에이전트/환경**: Cursor (구현자) · Maker MCP 미연결 · LSP N/A(`.ui`만 수정)
- **날짜**: 2026-07-23

## 1. 요약

`FurnacePopup`에 붙어 있던 중첩 `UIGroupComponent`를 UIBuilder로 제거했다. 화로 여닫기는 이미 entity `Enable` 경로라 `.mlua` 수정은 없었다. `ui_lint` 재실행 결과 **error 0**(이전 L029 1건 소멸). Maker refresh는 MCP 미연결로 보류.

## 2. 수정 파일 목록

| 파일 (경로) | 변경 요지 |
|---|---|
| `ui/PopupGroup.ui` | `FurnacePopup`에서 `MOD.Core.UIGroupComponent` 제거 |

## 3. 구현 상세

1. Grep: `UIFurnaceController`/`UIInventoryController`에서 `UIGroupComponent`/`GroupVisible`/`DefaultShow` 의존 **0건**. 여닫이는 `furnacePopup.Enable`만 사용 — 제거 안전.
2. `UIBuilder.load` → `removeComponent("FurnacePopup", "MOD.Core.UIGroupComponent")` → `write`.
3. 스펙 이탈 없음. `.mlua` 무수정.

## 4. 수행한 검증과 결과

- **ui_lint (실행)**:
  - 이전: `1 error` — `L029 /ui/PopupGroup/FurnacePopup`
  - 이후: `220 finding(s) - 0 error, 89 warning, 131 info` (L029 없음)
- **Maker refresh**: 보류 — `msw-maker-mcp` 서버 미연결.
- **Play 런타임**: 보류(제작자 수행).

## 5. 발견한 문제 / 후속 제안

- 없음. (경고 89건은 기존 L023 등 — 이번 범위 밖)

## 6. 제작자 런타임 체크리스트

- [ ] Maker `refresh` 후 빌드 Error=0
- [ ] 화로 F → 팝업 열림/닫힘
- [ ] input/fuel 슬롯 드래그·제련 정상
- [ ] WarpPopup·ChestPopup 등 타 팝업 무영향

## 7. 이력

- 2026-07-23 최초 작성 (구현자)
