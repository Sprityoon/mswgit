const path = require("path");
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const b = UIBuilder.load("ui/PopupGroup.ui");
const entities = b.listEntities();

const links = entities.filter(e => e.name.startsWith("Link_") || e.path.includes("Link_"));
console.log(JSON.stringify(links, null, 2));
