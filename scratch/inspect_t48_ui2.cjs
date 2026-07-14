// T48 진단 2차 — HUD 상단 우측 점유물 앵커 + SkillTreePopup 텍스트 요소 앵커
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const hud = UIBuilder.load("ui/HUDGroup.ui");
for (const p of ["Minimap", "QuestTracker", "BuffBar", "UIMyInfo"]) {
  const c = hud.getComponent(p, "MOD.Core.UITransformComponent");
  console.log(`\nHUD/${p} UITransform:`, JSON.stringify(c));
}

const pop = UIBuilder.load("ui/PopupGroup.ui");
for (const p of [
  "SkillTreePopup",
  "SkillTreePopup/Bg",
  "SkillTreePopup/Bg/EquipBar/DetailText",
  "SkillTreePopup/Bg/Hint",
  "SkillTreePopup/Bg/SPText",
  "SkillTreePopup/Bg/Title",
  "SkillTreePopup/Bg/BtnClose",
]) {
  const t = pop.getComponent(p, "MOD.Core.UITransformComponent");
  console.log(`\n${p} UITransform:`, JSON.stringify(t));
  const s = pop.getComponent(p, "MOD.Core.SpriteGUIRendererComponent");
  if (s)
    console.log(
      `${p} Sprite: RUID=${s.ImageRUID && s.ImageRUID.DataId} Color=${JSON.stringify(s.Color)}`
    );
  const x = pop.getComponent(p, "MOD.Core.TextComponent");
  if (x) console.log(`${p} Text: "${x.Text}" size=${x.FontSize} align=${x.Alignment}`);
}
