const path = require("path");
const { ModelBuilder, vector2, vector3, collisionGroup } = require("../.agents/skills/msw-general/scripts/model/msw_model_builder.cjs");

const templatePath = path.join(__dirname, "..", ".agents", "skills", "msw-general", "models", "MapObject.model");

const b = ModelBuilder.fromTemplate(templatePath, "FishingSpot_Pond");

b.component("MOD.Core.SpriteRendererComponent")
  .value("MOD.Core.SpriteRendererComponent", "SpriteRUID", "ecb83722d7fa4a3ab425302401032701", "string")
  .value("MOD.Core.TransformComponent", "Position", vector3(0, 0, 0), "vector3")
  .addComponent("MOD.Core.TriggerComponent")
  .value("MOD.Core.TriggerComponent", "BoxSize", vector2(2, 2), "vector2")
  .value("MOD.Core.TriggerComponent", "IsLegacy", false, "bool")
  .addComponent("script.FishingSpot")
  .value("script.FishingSpot", "SpotType", "estate", "string");

b.write("RootDesk/MyDesk/Furniture/Models/FishingSpot_Pond.model");
console.log("Model created.");
