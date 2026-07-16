// 규칙 11 사고 판정 — 워킹 트리 .ui 2종에서 T50~T58 핵심 산출물 실존 검사 (읽기 전용)
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

function probe(label, file, checks) {
  const b = UIBuilder.read(path.join(__dirname, "..", file));
  console.log("==== " + label);
  for (const [name, fn] of checks) {
    try { console.log((fn(b) ? "OK  " : "FAIL") + " " + name); }
    catch (e) { console.log("ERR  " + name + " :: " + e.message); }
  }
  return b;
}

probe("HUDGroup.ui (T52/T53)", "ui/HUDGroup.ui", [
  ["T52 SkillTooltip 존재", b => !!b.find("/ui/HUDGroup/SkillTooltip")],
  ["T52 SkillSlot1 ButtonComponent", b => b.hasComponent("/ui/HUDGroup/SkillBar/SkillSlot1", "MOD.Core.ButtonComponent")],
  ["T53 BtnBag 88px", b => { const t = b.getComponent("/ui/HUDGroup/MobileUI/BtnBag", "MOD.Core.UITransformComponent"); return t && t.RectSize && t.RectSize.x === 88; }],
  ["T53 UIMyInfo top-left(AO=4)", b => { const t = b.getComponent("/ui/HUDGroup/UIMyInfo", "MOD.Core.UITransformComponent"); return t && t.AlignmentOption === 4; }],
  ["T47 BtnSkillTree 존재", b => !!b.find("/ui/HUDGroup/BtnSkillTree")],
]);

const pg = UIBuilder.read(path.join(__dirname, "..", "ui", "PopupGroup.ui"));
console.log("==== PopupGroup.ui (T50/T54/T58)");
const ents = pg.listEntities();
const links = ents.filter(e => /\/Link_/.test(e.path)).map(e => e.path.split("/").pop());
console.log((links.length >= 3 ? "OK  " : "FAIL") + " T58 Link_* 커넥터 수 = " + links.length + " [" + links.join(",") + "]");
console.log((!!pg.find("SkillTreePopup/Bg/SkillDetailPanel") || ents.some(e => /SkillDetailPanel/.test(e.path)) ? "OK  " : "FAIL") + " T50 SkillDetailPanel 존재");
const closes = ents.filter(e => /BtnClose$/.test(e.path));
const close88 = closes.filter(e => { const t = pg.getComponent(e.path, "MOD.Core.UITransformComponent"); return t && t.RectSize && t.RectSize.x === 88; });
console.log((closes.length >= 12 && close88.length >= 12 ? "OK  " : "FAIL") + " T54 BtnClose " + close88.length + "/" + closes.length + "개가 88px");
