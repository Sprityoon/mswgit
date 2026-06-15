const { UIBuilder } = require("../scripts/msw_ui_builder.cjs");
const b = UIBuilder.read("C:/Users/yaong/Documents/메이플월드/ui/HUDGroup.ui");
function ruid(p) {
  const e = b.find(p);
  if (!e) { console.log(p, "NOT FOUND"); return; }
  const c = e.jsonString["@components"].find(x => x["@type"] === "MOD.Core.SpriteGUIRendererComponent");
  if (!c) { console.log(p, "(no sprite comp)"); return; }
  console.log(p.replace("/ui/HUDGroup/", "").padEnd(28), "ImageRUID:", c.ImageRUID, "ImageType:", c.ImageType, "Color:", JSON.stringify(c.Color));
}
["/ui/HUDGroup/HP/Fill","/ui/HUDGroup/HP","/ui/HUDGroup/ResourcePanel/Bg","/ui/HUDGroup/Stamina/Fill","/ui/HUDGroup/MobileUI/BtnMine"].forEach(ruid);
