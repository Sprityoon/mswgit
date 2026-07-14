// T48 진단용 읽기 전용 검사 — HUD 스킬트리 버튼 위치 + SkillTreePopup 서브트리 지오메트리
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function dump(label, filepath, filterFn) {
  const b = UIBuilder.load(filepath);
  const rows = b.listEntities().filter(filterFn);
  console.log(`\n===== ${label} (${rows.length} entities) =====`);
  for (const e of rows) {
    console.log(
      `${"  ".repeat(e.depth)}${e.name}  kind=${e.kind ?? "?"}  pos=${JSON.stringify(e.pos)}  size=${JSON.stringify(e.size)}  enable=${e.enable}`
    );
  }
  return b;
}

// 1) HUD — 전체 트리 (버튼 행 배치 파악)
const hud = dump("HUDGroup 전체", "ui/HUDGroup.ui", () => true);

// 2) HUD BtnSkillTree / BtnCollection 상세 (UITransform + Sprite + Text)
for (const p of ["BtnSkillTree", "BtnCollection"]) {
  const ent = hud.find(p);
  if (!ent) { console.log(`\n--- ${p}: NOT FOUND`); continue; }
  console.log(`\n--- HUD/${p} components:`);
  for (const t of [
    "MOD.Core.UITransformComponent",
    "MOD.Core.SpriteGUIRendererComponent",
    "MOD.Core.TextComponent",
    "MOD.Core.ButtonComponent",
  ]) {
    const c = hud.getComponent(p, t);
    if (c) console.log(t, JSON.stringify(c));
  }
}

// 3) PopupGroup — SkillTreePopup 서브트리만
const pop = dump(
  "PopupGroup/SkillTreePopup 서브트리",
  "ui/PopupGroup.ui",
  (e) => e.path.includes("SkillTreePopup")
);

// 4) EquipBar 하위 + BtnLevelUp 상세
const targets = pop
  .listEntities()
  .filter((e) => e.path.includes("SkillTreePopup"))
  .filter((e) => /EquipBar|BtnLevelUp|Hint|Slot|Detail/i.test(e.path))
  .map((e) => e.path.replace("/ui/PopupGroup/", ""));
for (const p of targets) {
  console.log(`\n--- ${p} components:`);
  for (const t of [
    "MOD.Core.UITransformComponent",
    "MOD.Core.SpriteGUIRendererComponent",
    "MOD.Core.TextComponent",
    "MOD.Core.ButtonComponent",
  ]) {
    const c = pop.getComponent(p, t);
    if (c) console.log(t, JSON.stringify(c));
  }
}
