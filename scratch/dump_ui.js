const path = require("path");
const { UIBuilder } = require("../plugins/msw-maker-base-skill/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const file = path.join(__dirname, "..", "ui", "PopupGroup.ui");
const b = UIBuilder.read(file);
const list = b.listEntities().filter(e => e.path.startsWith("/ui/PopupGroup/CharacterPopup"));
console.log(JSON.stringify(list, null, 2));
