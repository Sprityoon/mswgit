const path = require("path");
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const b = UIBuilder.load("ui/HUDGroup.ui");
const entities = b.listEntities();

const targetNames = ["SkillBar", "SkillTooltip", "SkillSlot1", "Cooldown", "Icon", "Key"];
const filtered = entities.filter(e => targetNames.some(name => e.name === name || e.path.endsWith("/" + name)));

console.log(JSON.stringify(filtered, null, 2));
