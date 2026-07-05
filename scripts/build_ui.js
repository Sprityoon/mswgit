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

  // Quest tracker (top-left) — 온보딩 진행 퀘스트 표시. 컨트롤러가 자식/토스트를 런타임 조회하므로 별도 바인딩 없음.
  if (!b.getId("/ui/HUDGroup/QuestTracker")) {
    b.panel("QuestTracker", { anchor: "top-left", pos: [190, -120], rect_size: [340, 170] });
    b.addComponent("QuestTracker", "script.UIQuestController");
    b.patch("QuestTracker", { display_order: 30 });
    b.sprite("QuestTracker/Bg", { anchor: "middle-center", pos: [0, 0], rect_size: [340, 170], color: "#22252B", alpha: 0.72, raycast: false });
    b.text("QuestTracker/Header", "★ 퀘스트", { anchor: "middle-center", pos: [0, 66], rect_size: [320, 28], size: 20, color: "#FFE9A8", alignment: 4 });
    b.text("QuestTracker/QuestName", "", { anchor: "middle-center", pos: [0, 32], rect_size: [324, 28], size: 19, color: "#FFFFFF", alignment: 4 });
    b.text("QuestTracker/Guide", "", { anchor: "middle-center", pos: [0, -6], rect_size: [324, 44], size: 14, color: "#C7CBD1", alignment: 4 });
    b.text("QuestTracker/Progress", "", { anchor: "middle-center", pos: [0, -52], rect_size: [324, 26], size: 17, color: "#7ED957", alignment: 4 });
  } else if (!b.hasComponent("QuestTracker", "script.UIQuestController")) {
    b.addComponent("QuestTracker", "script.UIQuestController");
  }

  // Quest completion toast (top-center), 기본 숨김. 컨트롤러가 Enable 토글.
  if (!b.getId("/ui/HUDGroup/QuestToast")) {
    b.panel("QuestToast", { anchor: "top-center", pos: [0, -150], rect_size: [560, 78], enable: false });
    b.patch("QuestToast", { display_order: 60 });
    b.sprite("QuestToast/Bg", { anchor: "middle-center", pos: [0, 0], rect_size: [560, 78], color: "#1E3A1E", alpha: 0.92, raycast: false });
    b.text("QuestToast/Text", "", { anchor: "middle-center", pos: [0, 0], rect_size: [540, 66], size: 22, color: "#EAFBD0", alignment: 4 });
  }

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

  // 3) ChestPopup Panel (hidden by default)
  const CP = "ChestPopup";
  if (!b.getId(`/ui/PopupGroup/${CP}`)) {
    b.panel(CP, { anchor: "middle-center", pos: [0, 0], rect_size: [800, 700], enable: false });
    b.addComponent(CP, "script.UIChestController");
    b.patch(CP, { display_order: 40 });
    
    // Background card
    b.sprite(`${CP}/Bg`, { anchor: "middle-center", pos: [330, 0], rect_size: [340, 390], color: "#2B2B33", alpha: 1.0, raycast: true });
    
    // Title
    b.text(`${CP}/Bg/Title`, "보관함 (8슬롯)", { anchor: "middle-center", pos: [0, 145], rect_size: [280, 40], size: 26, color: "#FFE9A8", alignment: 4 });
    
    // Close button
    b.button(`${CP}/Bg/BtnClose`, "X", { anchor: "middle-center", pos: [135, 145], rect_size: [40, 40], font_size: 22, color: "#FFFFFF" });
    b.patchComponent(`${CP}/Bg/BtnClose`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.55, g: 0.18, b: 0.16, a: 1.0 } });
    
    // 8 Slots
    const positions = [
      [-120, 35], [-40, 35], [40, 35], [120, 35],
      [-120, -55], [-40, -55], [40, -55], [120, -55]
    ];
    
    for (let i = 1; i <= 8; i++) {
      const pos = positions[i - 1];
      const slotName = `${CP}/Bg/Slot${i}`;
      b.button(slotName, "", { anchor: "middle-center", pos: pos, rect_size: [72, 72] });
      b.patchComponent(slotName, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 } });
      
      b.sprite(`${slotName}/Icon`, { anchor: "middle-center", pos: [0, 0], rect_size: [48, 48], image_ruid: "" });
      b.text(`${slotName}/Count`, "", { anchor: "middle-center", pos: [0, -20], rect_size: [72, 24], size: 18, color: "#FFFFFF", alignment: 4 });
    }
  } else {
    if (!b.hasComponent(CP, "script.UIChestController")) {
      b.addComponent(CP, "script.UIChestController");
    }
  }

  // 4) PermissionPopup Panel (hidden by default)
  const PP = "PermissionPopup";
  if (!b.getId(`/ui/PopupGroup/${PP}`)) {
    b.panel(PP, { anchor: "middle-center", pos: [0, 0], rect_size: [800, 700], enable: false });
    b.addComponent(PP, "script.UIPermissionController");
    b.patch(PP, { display_order: 45 });
    
    b.sprite(`${PP}/Bg`, { anchor: "middle-center", pos: [0, 0], rect_size: [380, 420], color: "#2B2B33", alpha: 1.0, raycast: true });
    b.text(`${PP}/Bg/Title`, "영지 권한 설정", { anchor: "middle-center", pos: [0, 160], rect_size: [280, 40], size: 26, color: "#FFE9A8", alignment: 4 });
    b.button(`${PP}/Bg/BtnClose`, "X", { anchor: "middle-center", pos: [155, 160], rect_size: [40, 40], font_size: 22, color: "#FFFFFF" });
    b.patchComponent(`${PP}/Bg/BtnClose`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.55, g: 0.18, b: 0.16, a: 1.0 } });
    
    const rowYPositions = [80, 20, -40, -100];
    for (let i = 1; i <= 4; i++) {
      const rowY = rowYPositions[i - 1];
      const rowName = `${PP}/Bg/Row${i}`;
      b.panel(rowName, { anchor: "middle-center", pos: [0, rowY], rect_size: [340, 50], enable: false });
      b.text(`${rowName}/Name`, "Guest Name", { anchor: "middle-left", pos: [20, 0], rect_size: [180, 30], size: 18, color: "#FFFFFF", alignment: 3 });
      b.button(`${rowName}/BtnToggle`, "권한 부여", { anchor: "middle-right", pos: [-20, 0], rect_size: [100, 38], font_size: 16, color: "#FFFFFF" });
      b.patchComponent(`${rowName}/BtnToggle`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.30, g: 0.30, b: 0.36, a: 1.0 } });
    }
    
    b.text(`${PP}/Bg/Notice`, "영지 주인만 권한을 조정할 수 있습니다.", { anchor: "middle-center", pos: [0, -165], rect_size: [340, 30], size: 14, color: "#999999", alignment: 4 });
  } else {
    if (!b.hasComponent(PP, "script.UIPermissionController")) {
      b.addComponent(PP, "script.UIPermissionController");
    }
  }

  // 5) WarpPopup Panel (hidden by default)
  const WP = "WarpPopup";
  if (!b.getId(`/ui/PopupGroup/${WP}`)) {
    b.panel(WP, { anchor: "middle-center", pos: [0, 0], rect_size: [800, 700], enable: false });
    b.addComponent(WP, "script.UIWarpController");
    b.patch(WP, { display_order: 42 });
    
    b.sprite(`${WP}/Bg`, { anchor: "middle-center", pos: [0, 0], rect_size: [380, 360], color: "#2B2B33", alpha: 1.0, raycast: true });
    b.text(`${WP}/Bg/Title`, "이동 포탈", { anchor: "middle-center", pos: [0, 130], rect_size: [280, 40], size: 26, color: "#FFE9A8", alignment: 4 });
    b.button(`${WP}/Bg/BtnClose`, "X", { anchor: "middle-center", pos: [155, 130], rect_size: [40, 40], font_size: 22, color: "#FFFFFF" });
    b.patchComponent(`${WP}/Bg/BtnClose`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.55, g: 0.18, b: 0.16, a: 1.0 } });
    
    b.button(`${WP}/Bg/BtnMyHome`, "내 영지로 이동", { anchor: "middle-center", pos: [0, 60], rect_size: [280, 50], font_size: 20, color: "#FFFFFF" });
    b.patchComponent(`${WP}/Bg/BtnMyHome`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.19, g: 0.19, b: 0.24, a: 1.0 } });
    
    b.text(`${WP}/Bg/Divider`, "— 또는 다른 영지 방문 —", { anchor: "middle-center", pos: [0, 0], rect_size: [280, 20], size: 14, color: "#AAAAAA", alignment: 4 });
    b.textInput(`${WP}/Bg/InputName`, "유저 이름을 입력하세요", { anchor: "middle-center", pos: [-50, -50], rect_size: [180, 42], font_size: 16 });
    b.button(`${WP}/Bg/BtnVisit`, "방문", { anchor: "middle-center", pos: [100, -50], rect_size: [80, 42], font_size: 18, color: "#FFFFFF" });
    b.patchComponent(`${WP}/Bg/BtnVisit`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.18, g: 0.40, b: 0.20, a: 1.0 } });
  } else {
    if (!b.hasComponent(WP, "script.UIWarpController")) {
      b.addComponent(WP, "script.UIWarpController");
    }
  }

  // 6) BtnPermission inside CharacterPopup/StatsPanel
  if (!b.getId(`/ui/PopupGroup/CharacterPopup/StatsPanel/BtnPermission`)) {
    b.button("CharacterPopup/StatsPanel/BtnPermission", "영지 권한 설정", {
      anchor: "top-center",
      pos: [180, -420],
      rect_size: [240, 46],
      font_size: 20,
      color: "#FFFFFF"
    });
    b.patchComponent("CharacterPopup/StatsPanel/BtnPermission", "MOD.Core.SpriteGUIRendererComponent", {
      Color: { r: 0.19, g: 0.19, b: 0.24, a: 1.0 }
    });
  }

  // 7) SkillTreePopup Panel (hidden by default) — 스킬트리 (docs/design/skill-tree-plan.md §2 UI)
  //    노드 슬롯은 범용 Node_<row>_<col> 그리드(4x3)로 깔아두고, 어떤 스킬이 어느 슬롯에 앉을지는
  //    SkillDataSet의 TreeRow/TreeCol이 결정한다 (UI에 스킬 하드코딩 없음).
  const ST = "SkillTreePopup";
  const ST_ROWS = 4;
  const ST_COLS = 3;
  const ST_COL_X = [-180, 0, 180];
  const ST_ROW_Y = [160, 40, -80, -200];
  if (!b.getId(`/ui/PopupGroup/${ST}`)) {
    b.panel(ST, { anchor: "middle-center", pos: [0, 0], rect_size: [800, 700], enable: false });
    b.addComponent(ST, "script.UISkillTreeController");
    b.patch(ST, { display_order: 44 });

    b.sprite(`${ST}/Bg`, { anchor: "middle-center", pos: [0, 0], rect_size: [560, 620], color: "#2B2B33", alpha: 1.0, raycast: true });
    b.text(`${ST}/Bg/Title`, "스킬트리", { anchor: "middle-center", pos: [0, 275], rect_size: [280, 40], size: 26, color: "#FFE9A8", alignment: 4 });
    b.button(`${ST}/Bg/BtnClose`, "X", { anchor: "middle-center", pos: [245, 275], rect_size: [40, 40], font_size: 22, color: "#FFFFFF" });
    b.patchComponent(`${ST}/Bg/BtnClose`, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.55, g: 0.18, b: 0.16, a: 1.0 } });
    b.text(`${ST}/Bg/SPText`, "SP 0  |  Lv 1", { anchor: "middle-center", pos: [0, 235], rect_size: [340, 30], size: 18, color: "#FFE9A8", alignment: 4 });

    for (let r = 1; r <= ST_ROWS; r++) {
      for (let c = 1; c <= ST_COLS; c++) {
        const nodeName = `${ST}/Bg/Node_${r}_${c}`;
        b.button(nodeName, "", { anchor: "middle-center", pos: [ST_COL_X[c - 1], ST_ROW_Y[r - 1]], rect_size: [164, 100], enable: false });
        b.patchComponent(nodeName, "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.22, g: 0.22, b: 0.26, a: 1.0 } });
        b.text(`${nodeName}/NameText`, "", { anchor: "middle-center", pos: [0, 30], rect_size: [156, 28], size: 20, color: "#FFFFFF", alignment: 4 });
        b.text(`${nodeName}/LvText`, "", { anchor: "middle-center", pos: [0, 2], rect_size: [156, 24], size: 16, color: "#FFE9A8", alignment: 4 });
        b.text(`${nodeName}/SubText`, "", { anchor: "middle-center", pos: [0, -28], rect_size: [156, 22], size: 14, color: "#CCCCCC", alignment: 4 });
      }
    }

    b.text(`${ST}/Bg/Hint`, "노드 클릭 = 해금/강화  ·  K키로 열고 닫기", { anchor: "middle-center", pos: [0, -285], rect_size: [520, 26], size: 14, color: "#999999", alignment: 4 });
  } else {
    if (!b.hasComponent(ST, "script.UISkillTreeController")) {
      b.addComponent(ST, "script.UISkillTreeController");
    }
  }

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

  // Inject Chest bindings
  const chestProps = {
    btnClose: `${CP}/Bg/BtnClose`
  };
  for (let i = 1; i <= 8; i++) {
    chestProps[`slot${i}`] = `${CP}/Bg/Slot${i}`;
    chestProps[`slot${i}_icon`] = `${CP}/Bg/Slot${i}/Icon`;
    chestProps[`slot${i}_count`] = `${CP}/Bg/Slot${i}/Count`;
  }
  b.injectBindings(path.join(rootUIDir, "UIChestController.mlua"), chestProps);

  // Inject Character bindings
  b.injectBindings(path.join(rootUIDir, "UICharacterController.mlua"), {
    btnPermission: "CharacterPopup/StatsPanel/BtnPermission"
  });

  // Inject Permission bindings
  const permissionProps = {
    btnClose: `${PP}/Bg/BtnClose`
  };
  for (let i = 1; i <= 4; i++) {
    permissionProps[`row${i}`] = `${PP}/Bg/Row${i}`;
    permissionProps[`row${i}_name`] = `${PP}/Bg/Row${i}/Name`;
    permissionProps[`row${i}_btn`] = `${PP}/Bg/Row${i}/BtnToggle`;
  }
  b.injectBindings(path.join(rootUIDir, "UIPermissionController.mlua"), permissionProps);

  // Inject Warp bindings — WarpPopup은 Maker/후속 패스에서 슬롯 기반(Slot1~6)으로 재작업됨.
  // 현재 컨트롤러가 바인딩으로 받는 것은 btnClose뿐 (slots은 GetChildByName 런타임 조회).
  b.injectBindings(path.join(rootUIDir, "UIWarpController.mlua"), {
    btnClose: `${WP}/Bg/BtnClose`
  });

  // Inject SkillTree bindings
  b.injectBindings(path.join(rootUIDir, "UISkillTreeController.mlua"), {
    btnClose: `${ST}/Bg/BtnClose`,
    spText: `${ST}/Bg/SPText`
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
