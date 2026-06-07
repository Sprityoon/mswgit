const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../plugins/msw-maker-base-skill/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

// Set up UI path
const uiDir = path.join(__dirname, "..", "ui");
if (!fs.existsSync(uiDir)) {
  fs.mkdirSync(uiDir, { recursive: true });
}

function buildHUD() {
  console.log("Building HUDGroup.ui...");
  const b = new UIBuilder("HUDGroup", 0, true);
  
  // Attach script component to HUDGroup root
  b.addComponent("/", "script.UIHUDController");

  // LevelBadge
  b.sprite("LevelBadge", { anchor: "top-left", pos: [120, -50], rect_size: [110, 44] });
  b.patchComponent("LevelBadge", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: "5d241898526c4415a055b977e3c77fa2" } });
  b.text("LevelBadge/Text", "LV 12", { size: 22, color: "#F0E8C0", anchor: "middle-center", pos: [0, 0] });
  
  // HP Bar
  b.sprite("HP", { anchor: "top-left", pos: [330, -35], rect_size: [240, 32] });
  b.patchComponent("HP", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: "dee8cd0715454ec08c3ed1793e75bb7a" } });
  b.sprite("HP/Fill", { anchor: "stretch", color: "#5EAD50", sprite_type: 3, fill_method: 0 });
  b.text("HP/ValText", "85/100", { size: 18, color: "#F0E8C0", anchor: "middle-center", pos: [0, 0] });

  // Stamina Bar
  b.sprite("Stamina", { anchor: "top-left", pos: [330, -70], rect_size: [240, 32] });
  b.patchComponent("Stamina", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: "dee8cd0715454ec08c3ed1793e75bb7a" } });
  b.sprite("Stamina/Fill", { anchor: "stretch", color: "#C8901A", sprite_type: 3, fill_method: 0 });
  b.text("Stamina/ValText", "60/100", { size: 18, color: "#F0E8C0", anchor: "middle-center", pos: [0, 0] });

  // ResourcePanel
  b.panel("ResourcePanel", { anchor: "top-right", pos: [-160, -50], rect_size: [280, 50] });
  b.sprite("ResourcePanel/Bg", { anchor: "stretch", color: "#252B25", alpha: 0.8 });
  b.text("ResourcePanel/WoodText", "🪵 12", { size: 20, color: "#F0E8C0", anchor: "middle-left", pos: [20, 0], rect_size: [80, 30] });
  b.text("ResourcePanel/StoneText", "🪨 47", { size: 20, color: "#F0E8C0", anchor: "middle-center", pos: [0, 0], rect_size: [80, 30] });
  b.text("ResourcePanel/GrassText", "🌿 3", { size: 20, color: "#F0E8C0", anchor: "middle-right", pos: [-20, 0], rect_size: [80, 30] });

  // Write and inject UIHUDController properties
  const mluapath = path.join(__dirname, "..", "RootDesk", "MyDesk", "UI", "UIHUDController.mlua");
  b.write(path.join(uiDir, "HUDGroup.ui"), {
    bind: {
      mlua: mluapath,
      props: {
        levelText: "LevelBadge/Text",
        hpFill: "HP/Fill",
        hpValText: "HP/ValText",
        staFill: "Stamina/Fill",
        staValText: "Stamina/ValText",
        woodCountText: "ResourcePanel/WoodText",
        stoneCountText: "ResourcePanel/StoneText",
        grassCountText: "ResourcePanel/GrassText"
      }
    }
  });
  console.log("HUDGroup.ui built successfully.");
}

function buildPopupGroup() {
  console.log("Building PopupGroup.ui...");
  const b = new UIBuilder("PopupGroup", 4, true);

  // Dimmer background overlay
  b.sprite("Dimmer", { anchor: "stretch", color: "#000000", alpha: 0.6 });
  b.patchComponent("Dimmer", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: true });

  // ==========================================
  // INVENTORY POPUP
  // ==========================================
  b.panel("InventoryPopup", { anchor: "middle-center", rect_size: [800, 700], enable: false });
  b.addComponent("InventoryPopup", "script.UIInventoryController");
  b.sprite("InventoryPopup/Bg", { anchor: "stretch", image_ruid: "25e9e89579644202805f535d038a9edb" });
  b.text("InventoryPopup/Title", "Inventory", { size: 32, color: "#F0E8C0", anchor: "top-center", pos: [0, -35], rect_size: [400, 45] });
  b.button("InventoryPopup/BtnClose", "X", { anchor: "top-right", pos: [-35, -35], rect_size: [50, 50], font_size: 20 });
  
  // Tabs
  b.button("InventoryPopup/TabAll", "All", { anchor: "top-left", pos: [100, -90], rect_size: [120, 40], font_size: 18 });
  b.button("InventoryPopup/TabRes", "Resources", { anchor: "top-left", pos: [240, -90], rect_size: [140, 40], font_size: 18 });
  b.button("InventoryPopup/TabEquip", "Equipment", { anchor: "top-left", pos: [400, -90], rect_size: [140, 40], font_size: 18 });

  // GridView
  b.panel("InventoryPopup/Grid", { anchor: "stretch" });
  b.patchComponent("InventoryPopup/Grid", "MOD.Core.UITransformComponent", { 
    OffsetMin: { x: 60, y: 60 }, 
    OffsetMax: { x: -60, y: -150 } 
  });
  b.addComponent("InventoryPopup/Grid", "MOD.Core.GridViewComponent", { 
    CellSize: { x: 72, y: 72 }, 
    FixedCount: 6, 
    FixedType: 0, 
    Spacing: { x: 6, y: 6 }, 
    UseScroll: true 
  });

  // Grid Item template
  b.panel("InventoryPopup/Grid/ItemSlot", { anchor: "top-left", pos: [0, 0], rect_size: [72, 72], enable: false });
  b.sprite("InventoryPopup/Grid/ItemSlot/Bg", { anchor: "stretch", image_ruid: "a7928ea51274446898d8453eb96ee06f" });
  b.text("InventoryPopup/Grid/ItemSlot/Icon", "", { size: 36, anchor: "middle-center", pos: [0, 0] });
  b.text("InventoryPopup/Grid/ItemSlot/Count", "", { size: 16, color: "#FFFFFF", anchor: "bottom-right", pos: [-10, 10] });

  // Capacity & Tooltip
  b.text("InventoryPopup/CapacityText", "0 / 24 items", { size: 18, color: "#F0E8C0", anchor: "bottom-left", pos: [60, 30] });
  
  b.panel("InventoryPopup/Tooltip", { anchor: "middle-right", pos: [240, 0], rect_size: [200, 300], enable: false });
  b.sprite("InventoryPopup/Tooltip/Bg", { anchor: "stretch", color: "#1A1A1A", alpha: 0.9 });
  b.text("InventoryPopup/Tooltip/Name", "", { size: 22, color: "#C8901A", bold: true, anchor: "top-center", pos: [0, -30] });
  b.text("InventoryPopup/Tooltip/Desc", "", { size: 16, color: "#F0E8C0", anchor: "middle-center", pos: [0, -20], rect_size: [180, 150] });
  b.text("InventoryPopup/Tooltip/Count", "", { size: 16, color: "#F0E8C0", anchor: "bottom-center", pos: [0, 30] });


  // ==========================================
  // CRAFTING POPUP
  // ==========================================
  b.panel("CraftingPopup", { anchor: "middle-center", rect_size: [900, 700], enable: false });
  b.addComponent("CraftingPopup", "script.UICraftingController");
  b.sprite("CraftingPopup/Bg", { anchor: "stretch", image_ruid: "25e9e89579644202805f535d038a9edb" });
  b.text("CraftingPopup/Title", "Crafting Table", { size: 32, color: "#F0E8C0", anchor: "top-center", pos: [0, -35], rect_size: [400, 45] });
  b.button("CraftingPopup/BtnClose", "X", { anchor: "top-right", pos: [-35, -35], rect_size: [50, 50], font_size: 20 });

  // Left panel - Recipe List
  b.panel("CraftingPopup/List", { anchor: "left", pos: [170, 0], rect_size: [280, 520] });
  b.sprite("CraftingPopup/List/Bg", { anchor: "stretch", color: "#252B25", alpha: 0.5 });
  b.button("CraftingPopup/List/BtnWoodenAxe", "Wooden Axe", { anchor: "top-center", pos: [0, -40], rect_size: [240, 60], font_size: 20 });
  b.button("CraftingPopup/List/BtnStonePickaxe", "Stone Pickaxe", { anchor: "top-center", pos: [0, -110], rect_size: [240, 60], font_size: 20 });
  b.button("CraftingPopup/List/BtnStoneAxe", "Stone Axe", { anchor: "top-center", pos: [0, -180], rect_size: [240, 60], font_size: 20 });
  b.button("CraftingPopup/List/BtnWoodenChest", "Wooden Chest", { anchor: "top-center", pos: [0, -250], rect_size: [240, 60], font_size: 20 });

  // Right panel - Recipe Details
  b.panel("CraftingPopup/Details", { anchor: "right", pos: [-190, 0], rect_size: [340, 520] });
  b.text("CraftingPopup/Details/Name", "Stone Pickaxe", { size: 28, color: "#C8901A", bold: true, anchor: "top-center", pos: [0, -40] });
  b.sprite("CraftingPopup/Details/Icon", { anchor: "top-center", pos: [0, -130], rect_size: [100, 100], image_ruid: "a7928ea51274446898d8453eb96ee06f" });
  b.text("CraftingPopup/Details/Icon/Text", "⛏️", { size: 48, anchor: "middle-center", pos: [0, 0] });
  b.text("CraftingPopup/Details/Desc", "A sturdy tool for mining ores.", { size: 18, color: "#F0E8C0", anchor: "top-center", pos: [0, -210], rect_size: [300, 100] });

  // Ingredients slots
  b.panel("CraftingPopup/Details/Slot1", { anchor: "bottom-center", pos: [-70, 140], rect_size: [100, 100] });
  b.sprite("CraftingPopup/Details/Slot1/Bg", { anchor: "stretch", image_ruid: "a7928ea51274446898d8453eb96ee06f" });
  b.text("CraftingPopup/Details/Slot1/Icon", "🪵", { size: 36, anchor: "middle-center", pos: [0, 0] });
  b.text("CraftingPopup/Details/Slot1/Count", "2 / 2", { size: 16, color: "#FFFFFF", anchor: "bottom-center", pos: [0, 15] });

  b.panel("CraftingPopup/Details/Slot2", { anchor: "bottom-center", pos: [70, 140], rect_size: [100, 100] });
  b.sprite("CraftingPopup/Details/Slot2/Bg", { anchor: "stretch", image_ruid: "a7928ea51274446898d8453eb96ee06f" });
  b.text("CraftingPopup/Details/Slot2/Icon", "🪨", { size: 36, anchor: "middle-center", pos: [0, 0] });
  b.text("CraftingPopup/Details/Slot2/Count", "47 / 5", { size: 16, color: "#FFFFFF", anchor: "bottom-center", pos: [0, 15] });

  b.button("CraftingPopup/Details/BtnCraft", "CRAFT (Space)", { anchor: "bottom-center", pos: [0, 40], rect_size: [280, 60], font_size: 22 });


  // ==========================================
  // CHARACTER INFO POPUP
  // ==========================================
  b.panel("CharacterPopup", { anchor: "middle-center", rect_size: [850, 700], enable: false });
  b.addComponent("CharacterPopup", "script.UICharacterController");
  b.sprite("CharacterPopup/Bg", { anchor: "stretch", image_ruid: "25e9e89579644202805f535d038a9edb" });
  b.text("CharacterPopup/Title", "Character Info", { size: 32, color: "#F0E8C0", anchor: "top-center", pos: [0, -35], rect_size: [400, 45] });
  b.button("CharacterPopup/BtnClose", "X", { anchor: "top-right", pos: [-35, -35], rect_size: [50, 50], font_size: 20 });

  // Left Panel - Equipment slots arranged around avatar
  b.panel("CharacterPopup/EquipPanel", { anchor: "left", pos: [220, 0], rect_size: [340, 520] });
  
  b.panel("CharacterPopup/EquipPanel/Silhouette", { anchor: "middle-center", pos: [0, 0], rect_size: [150, 250] });
  b.sprite("CharacterPopup/EquipPanel/Silhouette/Bg", { anchor: "stretch", color: "#1A1D1A", alpha: 0.6 });
  b.text("CharacterPopup/EquipPanel/Silhouette/Text", "Avatar Placeholder", { size: 18, color: "#A89870", anchor: "middle-center" });

  b.panel("CharacterPopup/EquipPanel/SlotHelmet", { anchor: "top-center", pos: [0, -40], rect_size: [64, 64] });
  b.sprite("CharacterPopup/EquipPanel/SlotHelmet/Bg", { anchor: "stretch", image_ruid: "004e5fc9c660a1342a055ae7157e5aeb" });
  b.text("CharacterPopup/EquipPanel/SlotHelmet/Label", "Helmet", { size: 12, color: "#A89870", anchor: "bottom-center", pos: [0, 10] });

  b.panel("CharacterPopup/EquipPanel/SlotWeapon", { anchor: "middle-center", pos: [-100, 40], rect_size: [64, 64] });
  b.sprite("CharacterPopup/EquipPanel/SlotWeapon/Bg", { anchor: "stretch", image_ruid: "004e5fc9c660a1342a055ae7157e5aeb" });
  b.text("CharacterPopup/EquipPanel/SlotWeapon/Icon", "⛏️", { size: 32, anchor: "middle-center", pos: [0, 0] });

  b.panel("CharacterPopup/EquipPanel/SlotArmor", { anchor: "middle-center", pos: [0, 40], rect_size: [64, 64] });
  b.sprite("CharacterPopup/EquipPanel/SlotArmor/Bg", { anchor: "stretch", image_ruid: "004e5fc9c660a1342a055ae7157e5aeb" });
  b.text("CharacterPopup/EquipPanel/SlotArmor/Icon", "👕", { size: 32, anchor: "middle-center", pos: [0, 0] });

  b.panel("CharacterPopup/EquipPanel/SlotShield", { anchor: "middle-center", pos: [100, 40], rect_size: [64, 64] });
  b.sprite("CharacterPopup/EquipPanel/SlotShield/Bg", { anchor: "stretch", image_ruid: "004e5fc9c660a1342a055ae7157e5aeb" });

  b.panel("CharacterPopup/EquipPanel/SlotGloves", { anchor: "bottom-center", pos: [-60, 60], rect_size: [64, 64] });
  b.sprite("CharacterPopup/EquipPanel/SlotGloves/Bg", { anchor: "stretch", image_ruid: "004e5fc9c660a1342a055ae7157e5aeb" });

  b.panel("CharacterPopup/EquipPanel/SlotShoes", { anchor: "bottom-center", pos: [60, 60], rect_size: [64, 64] });
  b.sprite("CharacterPopup/EquipPanel/SlotShoes/Bg", { anchor: "stretch", image_ruid: "004e5fc9c660a1342a055ae7157e5aeb" });

  // Right Panel - Stats Panel
  b.panel("CharacterPopup/StatsPanel", { anchor: "right", pos: [-200, 0], rect_size: [360, 520] });
  b.text("CharacterPopup/StatsPanel/Name", "Lv. 12 Explorer Minho", { size: 24, color: "#C8901A", bold: true, anchor: "top-left", pos: [20, -30], rect_size: [320, 40] });

  // Stats Bars
  b.panel("CharacterPopup/StatsPanel/HP", { anchor: "top-left", pos: [180, -90], rect_size: [320, 24] });
  b.sprite("CharacterPopup/StatsPanel/HP/Bg", { anchor: "stretch", image_ruid: "dee8cd0715454ec08c3ed1793e75bb7a" });
  b.sprite("CharacterPopup/StatsPanel/HP/Fill", { anchor: "stretch", color: "#5EAD50", sprite_type: 3, fill_method: 0 });
  b.text("CharacterPopup/StatsPanel/HP/Text", "85 / 100", { size: 16, color: "#F0E8C0", anchor: "middle-center" });

  b.panel("CharacterPopup/StatsPanel/Stamina", { anchor: "top-left", pos: [180, -130], rect_size: [320, 24] });
  b.sprite("CharacterPopup/StatsPanel/Stamina/Bg", { anchor: "stretch", image_ruid: "dee8cd0715454ec08c3ed1793e75bb7a" });
  b.sprite("CharacterPopup/StatsPanel/Stamina/Fill", { anchor: "stretch", color: "#C8901A", sprite_type: 3, fill_method: 0 });
  b.text("CharacterPopup/StatsPanel/Stamina/Text", "60 / 100", { size: 16, color: "#F0E8C0", anchor: "middle-center" });

  b.panel("CharacterPopup/StatsPanel/XP", { anchor: "top-left", pos: [180, -170], rect_size: [320, 24] });
  b.sprite("CharacterPopup/StatsPanel/XP/Bg", { anchor: "stretch", image_ruid: "dee8cd0715454ec08c3ed1793e75bb7a" });
  b.sprite("CharacterPopup/StatsPanel/XP/Fill", { anchor: "stretch", color: "#3A7BC8", sprite_type: 3, fill_method: 0 });
  b.text("CharacterPopup/StatsPanel/XP/Text", "450 / 1200", { size: 16, color: "#F0E8C0", anchor: "middle-center" });

  // Stats rows
  b.text("CharacterPopup/StatsPanel/AtkLabel", "Attack", { size: 20, color: "#A89870", anchor: "top-left", pos: [20, -220], rect_size: [100, 30] });
  b.text("CharacterPopup/StatsPanel/AtkVal", "15 (+5 from Weapon)", { size: 20, color: "#F0E8C0", anchor: "top-right", pos: [-20, -220], rect_size: [200, 30] });

  b.text("CharacterPopup/StatsPanel/DefLabel", "Defense", { size: 20, color: "#A89870", anchor: "top-left", pos: [20, -260], rect_size: [100, 30] });
  b.text("CharacterPopup/StatsPanel/DefVal", "10 (+8 from Armor)", { size: 20, color: "#F0E8C0", anchor: "top-right", pos: [-20, -260], rect_size: [200, 30] });

  b.text("CharacterPopup/StatsPanel/GatherLabel", "Gather Speed", { size: 20, color: "#A89870", anchor: "top-left", pos: [20, -300], rect_size: [130, 30] });
  b.text("CharacterPopup/StatsPanel/GatherVal", "+10%", { size: 20, color: "#F0E8C0", anchor: "top-right", pos: [-20, -300], rect_size: [200, 30] });

  b.text("CharacterPopup/StatsPanel/MoveLabel", "Move Speed", { size: 20, color: "#A89870", anchor: "top-left", pos: [20, -340], rect_size: [130, 30] });
  b.text("CharacterPopup/StatsPanel/MoveVal", "100%", { size: 20, color: "#F0E8C0", anchor: "top-right", pos: [-20, -340], rect_size: [200, 30] });


  // Save and inject bindings into all 3 popup controllers
  const rootUIDir = path.join(__dirname, "..", "RootDesk", "MyDesk", "UI");
  const uiFile = path.join(uiDir, "PopupGroup.ui");
  b.write(uiFile);

  console.log("Injecting UIInventoryController bindings...");
  b.injectBindings(path.join(rootUIDir, "UIInventoryController.mlua"), {
    inventoryPopup: "InventoryPopup",
    btnClose: "InventoryPopup/BtnClose",
    tabAll: "InventoryPopup/TabAll",
    tabRes: "InventoryPopup/TabRes",
    tabEquip: "InventoryPopup/TabEquip",
    gridView: "InventoryPopup/Grid",
    capacityText: "InventoryPopup/CapacityText",
    tooltipPanel: "InventoryPopup/Tooltip",
    tooltipName: "InventoryPopup/Tooltip/Name",
    tooltipDesc: "InventoryPopup/Tooltip/Desc",
    tooltipCount: "InventoryPopup/Tooltip/Count"
  });

  console.log("Injecting UICraftingController bindings...");
  b.injectBindings(path.join(rootUIDir, "UICraftingController.mlua"), {
    craftingPopup: "CraftingPopup",
    btnClose: "CraftingPopup/BtnClose",
    btnWoodenAxe: "CraftingPopup/List/BtnWoodenAxe",
    btnStonePickaxe: "CraftingPopup/List/BtnStonePickaxe",
    btnStoneAxe: "CraftingPopup/List/BtnStoneAxe",
    btnWoodenChest: "CraftingPopup/List/BtnWoodenChest",
    detailName: "CraftingPopup/Details/Name",
    detailDesc: "CraftingPopup/Details/Desc",
    detailIcon: "CraftingPopup/Details/Icon",
    ingSlot1: "CraftingPopup/Details/Slot1",
    ingCount1: "CraftingPopup/Details/Slot1/Count",
    ingSlot2: "CraftingPopup/Details/Slot2",
    ingCount2: "CraftingPopup/Details/Slot2/Count",
    btnCraft: "CraftingPopup/Details/BtnCraft"
  });

  console.log("Injecting UICharacterController bindings...");
  b.injectBindings(path.join(rootUIDir, "UICharacterController.mlua"), {
    characterPopup: "CharacterPopup",
    btnClose: "CharacterPopup/BtnClose",
    charName: "CharacterPopup/StatsPanel/Name",
    hpFill: "CharacterPopup/StatsPanel/HP/Fill",
    hpValText: "CharacterPopup/StatsPanel/HP/Text",
    staFill: "CharacterPopup/StatsPanel/Stamina/Fill",
    staValText: "CharacterPopup/StatsPanel/Stamina/Text",
    xpFill: "CharacterPopup/StatsPanel/XP/Fill",
    xpValText: "CharacterPopup/StatsPanel/XP/Text",
    atkVal: "CharacterPopup/StatsPanel/AtkVal",
    defVal: "CharacterPopup/StatsPanel/DefVal",
    gatherVal: "CharacterPopup/StatsPanel/GatherVal",
    moveVal: "CharacterPopup/StatsPanel/MoveVal"
  });

  console.log("PopupGroup.ui built and all script bindings injected successfully.");
}

try {
  buildHUD();
  buildPopupGroup();
  console.log("All UI generation steps completed!");
} catch (err) {
  console.error("Failed to build UI: ", err);
  process.exit(1);
}
