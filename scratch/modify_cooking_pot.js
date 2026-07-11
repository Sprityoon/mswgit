const { ModelBuilder } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");
const path = require("path");

const modelPath = path.resolve(__dirname, "../RootDesk/MyDesk/Furniture/Models/Furniture_CookingPot.model");

const b = ModelBuilder.read(modelPath);

// 1. SpriteRendererComponent.SpriteRUID 값 변경
b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", "6017c4c6f4c94c6d8dced78d350d3dac", "string");

// 2. script.Furnace의 IdleSpriteRUID, ActiveSpriteRUID 값 추가/변경
b.value("script.Furnace", "IdleSpriteRUID", "6017c4c6f4c94c6d8dced78d350d3dac", "string");
b.value("script.Furnace", "ActiveSpriteRUID", "6017c4c6f4c94c6d8dced78d350d3dac", "string");

b.write(modelPath);
console.log("Furniture_CookingPot.model updated successfully.");
