/**
 * T50 — Skill tree node icon chips + fixed detail side panel.
 * Coordinates locked by ticket — do not invent layout.
 * Rule 10: no stretch; every child uses explicit anchor + rect_size.
 */
const path = require("path");
const { UIBuilder } = require(
  path.join(__dirname, "..", ".agents", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs")
);

const UI_PATH = "ui/PopupGroup.ui";
const NODE_BG_RUID = "9bb8e4d004fb46bb9c1b528b3c1ebf9f";
const PANEL_RUID = "4fea64a3307cda641809ad8be0d4890b";

// Ticket grid centers: cols x −230/−130/−30 · rows y 190/90/−10
const COL_X = [-230, -130, -30];
const ROW_Y = [190, 90, -10];

// Identity (match existing SkillTree popup palette)
const TEXT_HI = { r: 0.96, g: 0.94, b: 0.9, a: 1 };
const TEXT_BODY = { r: 0.79, g: 0.75, b: 0.7, a: 1 };
const TEXT_DIM = { r: 0.55, g: 0.52, b: 0.48, a: 1 };
const SURFACE = { r: 0.12, g: 0.13, b: 0.11, a: 0.95 };

const b = UIBuilder.read(UI_PATH);

// ── ① Nodes → 76×76 icon chips ──────────────────────────────────────────
for (let r = 1; r <= 3; r++) {
  for (let c = 1; c <= 3; c++) {
    const base = `SkillTreePopup/Bg/Node_${r}_${c}`;
    if (!b.find(base)) {
      throw new Error(`missing node ${base}`);
    }

    b.patch(base, {
      anchor: "middle-center",
      pos: [COL_X[c - 1], ROW_Y[r - 1]],
      rect_size: [76, 76],
      pivot: [0.5, 0.5],
    });

    // Clear root button text (UIButton model carries TextComponent)
    if (b.hasComponent(base, "MOD.Core.TextComponent")) {
      b.patchComponent(base, "MOD.Core.TextComponent", {
        Text: "",
        FontSize: 1,
        FontColor: { r: 0, g: 0, b: 0, a: 0 },
      });
    }
    if (b.hasComponent(base, "MOD.Core.SpriteGUIRendererComponent")) {
      b.patchComponent(base, "MOD.Core.SpriteGUIRendererComponent", {
        ImageRUID: { DataId: NODE_BG_RUID },
        RaycastTarget: true,
        Type: 1,
      });
    }

    // Remove node-internal name/sub text (ticket: delete entities)
    for (const leaf of ["NameText", "SubText"]) {
      const p = `${base}/${leaf}`;
      if (b.find(p)) b.remove(p);
    }

    // Icon 48×48 center (middle-center (0,4))
    b.sprite(`${base}/Icon`, {
      anchor: "middle-center",
      pos: [0, 4],
      rect_size: [48, 48],
      pivot: [0.5, 0.5],
      raycast: false,
      image_ruid: PANEL_RUID,
      color: { r: 1, g: 1, b: 1, a: 1 },
      sprite_type: 0,
    });

    // LvText badge bottom-right (-4,4) · 40×18 · font 12
    b.text(`${base}/LvText`, "0/5", {
      anchor: "bottom-right",
      pos: [-4, 4],
      rect_size: [40, 18],
      pivot: [1, 0],
      size: 12,
      alignment: 8, // LowerRight
      color: TEXT_HI,
      overflow: 1,
      bestfit: false,
    });

    // FallbackText 44×44 — controller shows only when IconRUID blank
    b.text(`${base}/FallbackText`, "", {
      anchor: "middle-center",
      pos: [0, 4],
      rect_size: [44, 44],
      pivot: [0.5, 0.5],
      size: 18,
      alignment: 4, // MiddleCenter
      color: TEXT_HI,
      overflow: 1,
      enable: false,
    });
  }
}

// ── EquipBar: remove DetailText (role → SkillDetailPanel) ────────────────
const detailPath = "SkillTreePopup/Bg/EquipBar/DetailText";
if (b.find(detailPath)) {
  b.remove(detailPath);
}

// ── ③ SkillDetailPanel 280×300 @ (170, 90) ───────────────────────────────
const panel = "SkillTreePopup/Bg/SkillDetailPanel";
b.panel(panel, {
  anchor: "middle-center",
  pos: [170, 90],
  rect_size: [280, 300],
  pivot: [0.5, 0.5],
  enable: true,
});

// Explicit surface (rule 10 — no stretch)
b.sprite(`${panel}/Bg`, {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [280, 300],
  pivot: [0.5, 0.5],
  image_ruid: PANEL_RUID,
  color: SURFACE,
  raycast: false,
  sprite_type: 0,
});

// Accent header strip (identity — not a new style invention)
b.sprite(`${panel}/HeaderBar`, {
  anchor: "top-center",
  pos: [0, 0],
  rect_size: [280, 4],
  pivot: [0.5, 1],
  color: { r: 0.94, g: 0.66, b: 0.19, a: 1 },
  raycast: false,
  image_ruid: PANEL_RUID,
  sprite_type: 0,
});

// Stack top→bottom, pad 20, all top-left + explicit rect (ticket sizes)
// DIcon 40×40
b.sprite(`${panel}/DIcon`, {
  anchor: "top-left",
  pos: [20, -20],
  rect_size: [40, 40],
  pivot: [0, 1],
  raycast: false,
  image_ruid: PANEL_RUID,
  color: { r: 1, g: 1, b: 1, a: 1 },
  sprite_type: 0,
  enable: false,
});

// DName 220×24 font 18
b.text(`${panel}/DName`, "노드를 선택하세요", {
  anchor: "top-left",
  pos: [20, -72],
  rect_size: [240, 24],
  pivot: [0, 1],
  size: 18,
  alignment: 3, // MiddleLeft
  color: TEXT_HI,
  overflow: 2, // Ellipsis
  bold: true,
});

// DTypeLv 240×20 font 14
b.text(`${panel}/DTypeLv`, "", {
  anchor: "top-left",
  pos: [20, -104],
  rect_size: [240, 20],
  pivot: [0, 1],
  size: 14,
  alignment: 3,
  color: TEXT_BODY,
  overflow: 2,
  enable: false,
});

// DDesc 240×90 font 14
b.text(`${panel}/DDesc`, "", {
  anchor: "top-left",
  pos: [20, -132],
  rect_size: [240, 90],
  pivot: [0, 1],
  size: 14,
  alignment: 0, // UpperLeft
  color: TEXT_BODY,
  overflow: 0,
  enable: false,
});

// DGate 240×40 font 13
b.text(`${panel}/DGate`, "", {
  anchor: "top-left",
  pos: [20, -230],
  rect_size: [240, 40],
  pivot: [0, 1],
  size: 13,
  alignment: 0,
  color: TEXT_DIM,
  overflow: 0,
  enable: false,
});

// DCost 240×20 font 14
b.text(`${panel}/DCost`, "", {
  anchor: "top-left",
  pos: [20, -278],
  rect_size: [240, 20],
  pivot: [0, 1],
  size: 14,
  alignment: 3,
  color: { r: 0.94, g: 0.66, b: 0.19, a: 1 }, // accent = cost
  overflow: 2,
  enable: false,
});

b.write(UI_PATH, { lint_verbose: true });

// Verify geometry
const check = UIBuilder.read(UI_PATH);
const report = [];
for (let r = 1; r <= 3; r++) {
  for (let c = 1; c <= 3; c++) {
    const p = `SkillTreePopup/Bg/Node_${r}_${c}`;
    const tr = check.getComponent(p, "MOD.Core.UITransformComponent");
    const icon = check.getComponent(`${p}/Icon`, "MOD.Core.UITransformComponent");
    const lv = check.getComponent(`${p}/LvText`, "MOD.Core.UITransformComponent");
    const fb = check.find(`${p}/FallbackText`);
    const name = check.find(`${p}/NameText`);
    const sub = check.find(`${p}/SubText`);
    report.push({
      node: `N${r}${c}`,
      pos: tr.anchoredPosition,
      size: tr.RectSize,
      pivot: tr.Pivot,
      icon: { pos: icon.anchoredPosition, size: icon.RectSize, pivot: icon.Pivot },
      lv: { pos: lv.anchoredPosition, size: lv.RectSize, pivot: lv.Pivot },
      fallback: !!fb,
      nameGone: !name,
      subGone: !sub,
    });
  }
}
const ptr = check.getComponent(panel, "MOD.Core.UITransformComponent");
const pbg = check.getComponent(`${panel}/Bg`, "MOD.Core.UITransformComponent");
const detailGone = !check.find(detailPath);
console.log(JSON.stringify({
  nodes: report,
  panel: { pos: ptr.anchoredPosition, size: ptr.RectSize, pivot: ptr.Pivot },
  panelBg: { pos: pbg.anchoredPosition, size: pbg.RectSize },
  detailTextRemoved: detailGone,
  children: check.listEntities()
    .filter((e) => e.path && e.path.includes("SkillDetailPanel"))
    .map((e) => e.path),
}, null, 2));
