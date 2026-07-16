const path = require("path");
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const b = UIBuilder.load("ui/HUDGroup.ui");

// 1. SkillBar patch
b.patch("/ui/HUDGroup/SkillBar", {
  anchor: "bottom-right",
  pos: [-235, 395],
  rect_size: [400, 100],
  pivot: [0.5, 0.5]
});

// 2. SkillSlots and children patch
const slotXs = [-150, -50, 50, 150];
for (let i = 1; i <= 4; i++) {
  const slotPath = `/ui/HUDGroup/SkillBar/SkillSlot${i}`;
  b.patch(slotPath, {
    rect_size: [88, 88],
    pos: [slotXs[i - 1], 0]
  });

  const cdPath = `${slotPath}/Cooldown`;
  b.patch(cdPath, {
    rect_size: [88, 88]
  });

  const iconPath = `${slotPath}/Icon`;
  b.patch(iconPath, {
    rect_size: [48, 48]
  });

  const keyPath = `${slotPath}/Key`;
  b.patch(keyPath, {
    pos: [-28, 28]
  });
}

// 3. SkillTooltip patch
b.patch("/ui/HUDGroup/SkillTooltip", {
  pos: [-235, 510]
});

b.write("ui/HUDGroup.ui");
console.log("Successfully updated HUDGroup.ui");
