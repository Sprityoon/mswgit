// T52/T53 정적 실사 — HUDGroup.ui 산출물 존재 확인 (지휘자 검수용, 읽기 전용)
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const b = UIBuilder.read(path.join(__dirname, "..", "ui", "HUDGroup.ui"));

const targets = [
  "/ui/HUDGroup/SkillTooltip",
  "/ui/HUDGroup/SkillBar",
  "/ui/HUDGroup/SkillBar/SkillSlot1",
  "/ui/HUDGroup/SkillBar/SkillSlot1/Name",
  "/ui/HUDGroup/MobileUI/BtnBag",
  "/ui/HUDGroup/MobileUI/BtnCraft",
  "/ui/HUDGroup/MobileUI/BtnInteract",
  "/ui/HUDGroup/MobileUI/BtnJump",
  "/ui/HUDGroup/UIMyInfo",
  "/ui/HUDGroup/QuickSlots",
  "/ui/HUDGroup/QuickSlots/Slot1",
];

for (const p of targets) {
  const e = b.find(p);
  if (!e) { console.log("MISSING:", p); continue; }
  const t = b.getComponent(p, "MOD.Core.UITransformComponent") || {};
  const hasBtn = b.hasComponent(p, "MOD.Core.ButtonComponent");
  console.log(
    "OK:", p,
    "| size=", JSON.stringify(t.RectSize),
    "| AO=", t.AlignmentOption,
    "| pos=", JSON.stringify(t.AnchoredPosition),
    "| AP=", t.ActivePlatform,
    "| en=", e.jsonString ? e.jsonString.enable : "?",
    "| btn=", hasBtn
  );
}
