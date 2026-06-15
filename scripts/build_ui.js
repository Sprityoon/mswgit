const path = require("path");
const { UIBuilder } = require("../plugins/msw-maker-base-skill/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

// ─────────────────────────────────────────────────────────────────────────────
// build_ui.js — INCREMENTAL PATCHER (not a from-scratch generator)
//
// The live `ui/*.ui` files are the SOURCE OF TRUTH. They have diverged far from
// any from-scratch script (Minimap 15x15 grid, 10 QuickSlots, 5 mobile buttons,
// FurnacePopup, etc. were authored in Maker / other passes). Regenerating them
// from scratch would wipe all of that.
//
// So this script: UIBuilder.read(live .ui) -> apply only idempotent, additive
// mutations -> write back. Entity UUIDs are preserved across read/write, so the
// `.mlua` property bindings that are already baked in stay valid — we do NOT
// re-inject existing bindings. When you ADD a new bound entity, create it here
// and inject ONLY that one property (see the example in patchHUD).
//
// RULE: every mutation below must be safe to run repeatedly (idempotent). Guard
// creation with `b.getId(path)` so a second run does not duplicate or reset.
// ─────────────────────────────────────────────────────────────────────────────

const uiDir = path.join(__dirname, "..", "ui");
const rootUIDir = path.join(__dirname, "..", "RootDesk", "MyDesk", "UI", "Scripts");

function patchHUD() {
  const file = path.join(uiDir, "HUDGroup.ui");
  const b = UIBuilder.read(file);
  const before = b.listEntities().length;

  const mobileUI = b.listEntities().filter(e => e.path.startsWith("/ui/HUDGroup/MobileUI"));
  console.log("MobileUI Children:", JSON.stringify(mobileUI, null, 2));

  // ── Incremental HUD additions go here (idempotent) ──────────────────────────
  if (!b.getId("/ui/HUDGroup/MobileUI/BtnInteract")) {
    b.button("MobileUI/BtnInteract", "", {
      anchor: "bottom-right",
      pos: [-225, 95],
      rect_size: [75, 75],
      image_ruid: "d6268ee7f5164177a6f272a81816e100"
    });
    b.patchComponent("MobileUI/BtnInteract", "MOD.Core.SpriteGUIRendererComponent", {
      Color: { r: 0.101960786, g: 0.121568628, b: 0.101960786, a: 0.75 }
    });
    // Add Sprite icon inside the button
    b.sprite("MobileUI/BtnInteract/Icon", {
      anchor: "middle-center",
      pos: [0, 0],
      rect_size: [34, 34],
      image_ruid: "8dd14df2030b4c6cabc8f7816c3b709e"
    });
    // Add Text label inside the button
    b.text("MobileUI/BtnInteract/Label", "상호작용", {
      anchor: "middle-center",
      pos: [0, -30],
      rect_size: [90, 24],
      size: 14,
      color: "#FFFFFF"
    });
  }

  // Spawn cover: full-screen opaque black sprite shown until the server signals the
  // player's home is ready (UIHUDController.FadeOutSpawn fades it out). High displayOrder
  // so it sits above every other HUD element; raycast blocks input during the load.
  b.sprite("SpawnFade", {
    anchor: "middle-center", pos: [0, 0], rect_size: [1920, 1080],
    color: "#000000", alpha: 1.0, raycast: true,
  });
  b.patch("SpawnFade", { display_order: 9999 });

  b.write(file, {
    bind: {
      mlua: path.join(rootUIDir, "UIHUDController.mlua"),
      props: { spawnFade: "SpawnFade" },
    },
  });
  const after = b.listEntities().length;
  console.log(`HUDGroup.ui patched: ${before} -> ${after} entities.`);
}

function patchPopups() {
  const file = path.join(uiDir, "PopupGroup.ui");
  const b = UIBuilder.read(file);
  const before = b.listEntities().length;

  // ── Incremental popup additions go here (idempotent) ────────────────────────

  // Discard (버리기) feature: a "버리기" button on the inventory tooltip + a
  // centered quantity-stepper modal with Drop / Delete / Cancel actions.
  const IP = "InventoryPopup";

  // 1) Tooltip: enlarge to fit the discard button + add the button.
  b.patch(`${IP}/Tooltip`, { rect_size: [240, 270] });
  b.patchComponent(`${IP}/Tooltip/Bg`, "MOD.Core.UITransformComponent", { SizeDelta: { x: 240, y: 270 } });
  b.patch(`${IP}/Tooltip/Desc`, { pos: [0, 8], rect_size: [210, 110] });
  b.button(`${IP}/Tooltip/BtnDiscard`, "버리기", {
    anchor: "middle-center", pos: [0, -112], rect_size: [200, 42], font_size: 22, color: "#FFFFFF",
  });
  b.patchComponent(`${IP}/Tooltip/BtnDiscard`, "MOD.Core.SpriteGUIRendererComponent", {
    Color: { r: 0.55, g: 0.18, b: 0.16, a: 1.0 },
  });

  // 2) Quantity-stepper discard modal (hidden by default; controller toggles Enable).
  b.panel(`${IP}/DiscardPopup`, { anchor: "middle-center", pos: [0, 0], rect_size: [800, 700], enable: false });
  b.patch(`${IP}/DiscardPopup`, { display_order: 50 });
  b.sprite(`${IP}/DiscardPopup/Dim`, { anchor: "middle-center", pos: [0, 0], rect_size: [800, 700], color: "#000000", alpha: 0.55, raycast: true });
  b.sprite(`${IP}/DiscardPopup/Card`, { anchor: "middle-center", pos: [0, 0], rect_size: [380, 330], color: "#2B2B33", alpha: 1.0, raycast: true });
  b.text(`${IP}/DiscardPopup/Card/TitleText`, "아이템 버리기", { anchor: "middle-center", pos: [0, 130], rect_size: [340, 40], size: 26, color: "#FFFFFF", alignment: 4 });
  b.text(`${IP}/DiscardPopup/Card/ItemText`, "", { anchor: "middle-center", pos: [0, 88], rect_size: [340, 32], size: 20, color: "#FFE9A8", alignment: 4 });
  b.button(`${IP}/DiscardPopup/Card/BtnMinus`, "−", { anchor: "middle-center", pos: [-120, 25], rect_size: [64, 64], font_size: 36, color: "#FFFFFF" });
  b.patchComponent(`${IP}/DiscardPopup/Card/BtnMinus`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.30, g: 0.30, b: 0.36, a: 1.0 } });
  b.text(`${IP}/DiscardPopup/Card/CountText`, "1", { anchor: "middle-center", pos: [0, 25], rect_size: [120, 64], size: 34, color: "#FFFFFF", alignment: 4 });
  b.button(`${IP}/DiscardPopup/Card/BtnPlus`, "+", { anchor: "middle-center", pos: [120, 25], rect_size: [64, 64], font_size: 36, color: "#FFFFFF" });
  b.patchComponent(`${IP}/DiscardPopup/Card/BtnPlus`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.30, g: 0.30, b: 0.36, a: 1.0 } });
  b.button(`${IP}/DiscardPopup/Card/BtnDrop`, "바닥에 드롭", { anchor: "middle-center", pos: [-95, -55], rect_size: [164, 56], font_size: 21, color: "#FFFFFF" });
  b.patchComponent(`${IP}/DiscardPopup/Card/BtnDrop`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.18, g: 0.40, b: 0.20, a: 1.0 } });
  b.button(`${IP}/DiscardPopup/Card/BtnDelete`, "삭제", { anchor: "middle-center", pos: [95, -55], rect_size: [164, 56], font_size: 21, color: "#FFFFFF" });
  b.patchComponent(`${IP}/DiscardPopup/Card/BtnDelete`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.55, g: 0.18, b: 0.16, a: 1.0 } });
  b.button(`${IP}/DiscardPopup/Card/BtnCancel`, "취소", { anchor: "middle-center", pos: [0, -122], rect_size: [200, 46], font_size: 21, color: "#FFFFFF" });
  b.patchComponent(`${IP}/DiscardPopup/Card/BtnCancel`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.34, g: 0.34, b: 0.40, a: 1.0 } });

  b.write(file, {
    bind: {
      mlua: path.join(rootUIDir, "UIInventoryController.mlua"),
      props: {
        btnDiscardOpen: `${IP}/Tooltip/BtnDiscard`,
        discardPopup: `${IP}/DiscardPopup`,
        discardItemText: `${IP}/DiscardPopup/Card/ItemText`,
        discardCountText: `${IP}/DiscardPopup/Card/CountText`,
        btnDiscardMinus: `${IP}/DiscardPopup/Card/BtnMinus`,
        btnDiscardPlus: `${IP}/DiscardPopup/Card/BtnPlus`,
        btnDiscardDrop: `${IP}/DiscardPopup/Card/BtnDrop`,
        btnDiscardDelete: `${IP}/DiscardPopup/Card/BtnDelete`,
        btnDiscardCancel: `${IP}/DiscardPopup/Card/BtnCancel`,
      },
    },
  });
  const after = b.listEntities().length;
  console.log(`PopupGroup.ui patched: ${before} -> ${after} entities.`);
}

try {
  patchHUD();
  patchPopups();
  console.log("UI patch completed (live .ui preserved as source of truth).");
} catch (err) {
  console.error("Failed to patch UI: ", err);
  process.exit(1);
}
