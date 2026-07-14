// T48 재작업 ⑥ 검수 — EquipBar/Bg 지오메트리 확인
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.load("ui/PopupGroup.ui");
const t = b.getComponent("SkillTreePopup/Bg/EquipBar/Bg", "MOD.Core.UITransformComponent");
console.log("EquipBar/Bg:", JSON.stringify({
  anchorsMin: t.AnchorsMin, anchorsMax: t.AnchorsMax, pivot: t.Pivot,
  ap: t.anchoredPosition, rect: t.RectSize,
}));
const s = b.getComponent("SkillTreePopup/Bg/EquipBar/Bg", "MOD.Core.SpriteGUIRendererComponent");
console.log("Sprite:", JSON.stringify({ ruid: s.ImageRUID && s.ImageRUID.DataId, color: s.Color, raycast: s.RaycastTarget }));
