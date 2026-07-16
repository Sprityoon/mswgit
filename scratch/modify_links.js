const path = require("path");
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const b = UIBuilder.load("ui/PopupGroup.ui");

const linkPaths = [
  "/ui/PopupGroup/SkillTreePopup/Bg/Link_2_1",
  "/ui/PopupGroup/SkillTreePopup/Bg/Link_2_2",
  "/ui/PopupGroup/SkillTreePopup/Bg/Link_2_3",
  "/ui/PopupGroup/SkillTreePopup/Bg/Link_3_1",
  "/ui/PopupGroup/SkillTreePopup/Bg/Link_3_2",
  "/ui/PopupGroup/SkillTreePopup/Bg/Link_3_3"
];

linkPaths.forEach(p => {
  b.patch(p, { rect_size: [14, 28] });
  console.log(`Patched ${p} size to [14, 28]`);
});

b.write("ui/PopupGroup.ui");
console.log("Successfully wrote PopupGroup.ui");
