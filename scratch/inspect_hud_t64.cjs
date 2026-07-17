// T64: HUD 아이덴티티 색상 상세 (2차)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.read("ui/HUDGroup.ui");

function col(path, type, fields) {
  const c = b.getComponent(path, type);
  if (!c) { console.log(path, type, "=> MISSING"); return; }
  const out = {};
  for (const f of fields) out[f] = c[f];
  console.log(path, "=>", JSON.stringify(out));
}

col("/ui/HUDGroup/QuestToast/Bg", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type"]);
col("/ui/HUDGroup/QuestToast/Text", "MOD.Core.TextComponent", ["FontColor", "FontSize", "Bold", "Alignment"]);
col("/ui/HUDGroup/BuffBar/Bg", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type"]);
col("/ui/HUDGroup/BuffBar/Text", "MOD.Core.TextComponent", ["FontColor", "FontSize", "Bold"]);
col("/ui/HUDGroup/SkillBar/SkillSlot1", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type"]);
col("/ui/HUDGroup/SkillBar/SkillSlot1/Key", "MOD.Core.TextComponent", ["FontColor", "FontSize", "Bold"]);
col("/ui/HUDGroup/SkillBar/SkillSlot1/Cooldown", "MOD.Core.SpriteGUIRendererComponent", ["Color", "Type", "FillMethod"]);
col("/ui/HUDGroup/UIMyInfo/info_bottom/Exp/img_bar", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type", "FillMethod", "FillAmount"]);
col("/ui/HUDGroup/UIMyInfo/info_bottom/Hp/img_bar", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type", "FillMethod", "FillAmount"]);
col("/ui/HUDGroup/UIMyInfo/info_bottom/Exp/img_background", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type"]);
col("/ui/HUDGroup/QuickSlots", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type"]);
col("/ui/HUDGroup/UIMyInfo/info_top", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type"]);
col("/ui/HUDGroup/UIMyInfo/info_top/text_level", "MOD.Core.TextComponent", ["FontColor", "FontSize", "Bold"]);
