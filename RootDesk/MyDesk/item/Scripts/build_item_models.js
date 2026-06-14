const fs = require("fs");
const path = require("path");
const modelBuilderPath = "C:/Users/윤민호/.gemini/config/plugins/msw-maker-base-skill/skills/msw-general/scripts/model/msw_model_builder.cjs";
const { ModelBuilder } = require(modelBuilderPath);

const templatePath = "C:/Users/윤민호/.gemini/config/plugins/msw-maker-base-skill/skills/msw-general/models/ItemAsset.model";
const outputDir = "c:/minho/메이플월드/RootDesk/MyDesk/item/Models";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const items = [
  { id: "wood", Name: "Wood", ModelName: "Item_Wood", EntryId: "2cb8f37e-ef6b-4e17-86fb-d940f18a7412", IconRUID: "b952164321fd4c9c94cb0d3e7c73b182" },
  { id: "stone", Name: "Stone", ModelName: "Item_Stone", EntryId: "05fa541a-a48d-4f36-bf82-0c60784a4a53", IconRUID: "5ed8bdcf520044c0a1660873beb30b10" },
  { id: "copper ore", Name: "Copper Ore", ModelName: "Item_CopperOre", EntryId: "3484bbf6-1973-4b23-a720-9d1b0754aa6f", IconRUID: "914eb87802b64924b5f78bb97a55faeb" },
  { id: "grass", Name: "Grass", ModelName: "Item_Grass", EntryId: "896c7bd8-8a8a-48a8-a7c7-fc8c337c2a9b", IconRUID: "f0bce7f800f140559f35a12a93de9c9e" },
  { id: "hand_axe", Name: "Hand Axe", ModelName: "Item_HandAxe", EntryId: "8fdc2947-7735-4aa3-90ad-208438aeb809", IconRUID: "57345d4aa6a640419af19e340c29940f" },
  { id: "stone_pickaxe", Name: "Stone Pickaxe", ModelName: "Item_StonePickaxe", EntryId: "0f6274e2-70fd-409b-8a20-7999c099c721", IconRUID: "428577ffb2964719b8ab0bb18e5171e1" },
  { id: "stone_axe", Name: "Stone Axe", ModelName: "Item_StoneAxe", EntryId: "08cec3b5-eaaa-4b36-9957-0e96f0708161", IconRUID: "2e0751aabbb14ccf85cfb99c024511c9" },
  { id: "wooden_chest", Name: "Wooden Chest", ModelName: "Item_WoodenChest", EntryId: "ebd82997-e2b7-4a6f-b3cc-0dc9380e529b", IconRUID: "22e9f409617b4e4180f9c92fb26b13f7" },
  { id: "furnace", Name: "Furnace", ModelName: "Item_Furnace", EntryId: "f2d3a4b5-67c8-49d0-bfd1-ebd3c4a2a1b9", IconRUID: "8cb667c940834bb9b19c11ae242a0aa1" },
  { id: "iron_ore", Name: "Iron Ore", ModelName: "Item_IronOre", EntryId: "71d8820c-c72e-4b2a-b7a4-ef8b337c2a01", IconRUID: "79f438d0427142f09f979b58e982b1bd" },
  { id: "copper_bar", Name: "Copper Bar", ModelName: "Item_CopperBar", EntryId: "1234cdef-5678-4321-abcd-ef1234567890", IconRUID: "d7429bc723034933b9b51de9b6b912fc" },
  { id: "iron_bar", Name: "Iron Bar", ModelName: "Item_IronBar", EntryId: "9876fedc-5432-1234-abcd-ef9876543210", IconRUID: "7ac77c77fdc0480080303b2dc0b96c35" },
  { id: "wood_floor", Name: "Wood Floor", ModelName: "Item_WoodFloor", EntryId: "a0123456-789a-bcde-f012-3456789abcde", IconRUID: "22e9f409617b4e4180f9c92fb26b13f7" }
];

items.forEach(item => {
  const modelPath = path.join(outputDir, item.ModelName + ".model");
  console.log(`Building model for ${item.Name} at: ${modelPath}`);
  
  try {
    const b = ModelBuilder.fromTemplate(templatePath, item.ModelName, { model_id: item.EntryId });
    
    // Add itemreact component
    b.addComponent("script.itemreact");
    
    // Set SpriteRUID in SpriteRendererComponent
    b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", item.IconRUID, "string");
    
    // Set ItemName in script.itemreact component
    b.value("script.itemreact", "ItemName", item.Name, "string");
    
    b.write(modelPath);
    console.log(`Model for ${item.Name} created successfully with ID: ${item.EntryId}`);
  } catch (err) {
    console.error(`Failed to build model for ${item.Name}:`, err);
  }
});

console.log("All item models built successfully.");
