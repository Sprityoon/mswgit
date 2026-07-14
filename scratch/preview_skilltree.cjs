// preview_ui_layout.cjs 래퍼 — 스킬트리 팝업/HUD 레이아웃 시각 확인 (읽기 전용)
const { main } = require("../.claude/skills/msw-ui-system/scripts/preview_ui_layout.cjs");
const target = process.argv[2] === "hud" ? "ui/HUDGroup.ui" : "ui/PopupGroup.ui";
main([target]);
