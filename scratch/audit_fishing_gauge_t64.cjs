// T64: FishingGauge 빌드 결과 감사 (ui-aesthetics §7 루브릭 근거 — 실측)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.read("ui/HUDGroup.ui");
const ents = b.listEntities();
for (const e of ents) {
  if (e.path.startsWith("/ui/HUDGroup/FishingGauge")) {
    console.log(e.depth, e.path, "|", e.kind, "| pos=" + JSON.stringify(e.pos), "size=" + JSON.stringify(e.size), "enable=" + e.enable);
  }
}
function col(path, type, fields) {
  const c = b.getComponent(path, type);
  if (!c) { console.log(path, "=> MISSING " + type); return; }
  const out = {};
  for (const f of fields) out[f] = c[f];
  console.log(path.replace("/ui/HUDGroup/", ""), "=>", JSON.stringify(out));
}
col("/ui/HUDGroup/FishingGauge/Panel", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type"]);
col("/ui/HUDGroup/FishingGauge/Panel/Title", "MOD.Core.TextComponent", ["FontColor", "FontSize", "Bold", "Alignment"]);
col("/ui/HUDGroup/FishingGauge/Panel/ProgressBg", "MOD.Core.SpriteGUIRendererComponent", ["ImageRUID", "Type"]);
col("/ui/HUDGroup/FishingGauge/Panel/ProgressBg/ProgressFill", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type", "FillMethod", "FillOrigin", "FillAmount"]);
col("/ui/HUDGroup/FishingGauge/Panel/TensionBg/TensionFill", "MOD.Core.SpriteGUIRendererComponent", ["Color", "ImageRUID", "Type", "FillMethod", "FillAmount"]);
col("/ui/HUDGroup/FishingGauge/Panel/HintText", "MOD.Core.TextComponent", ["FontColor", "FontSize", "Alignment"]);
col("/ui/HUDGroup/FishingGauge/Panel/WarnText", "MOD.Core.TextComponent", ["FontColor", "FontSize", "Bold"]);
col("/ui/HUDGroup/FishingGauge", "MOD.Core.UITransformComponent", ["AlignmentOption", "anchoredPosition", "RectSize", "Pivot", "ActivePlatform"]);
