const path = require("path");
const { ModelBuilder, vector2 } = require("../.claude/skills/msw-general/scripts/model/msw_model_builder.cjs");

const modelPath = path.join(__dirname, "..", "RootDesk", "MyDesk", "NPC", "Models", "Merchant.model");

try {
  console.log("Patching Merchant.model with touch properties...");
  const b = ModelBuilder.read(modelPath);
  
  if (!b.hasComponent("MOD.Core.TouchReceiveComponent")) {
    b.addComponent("MOD.Core.TouchReceiveComponent");
  }
  
  // Configure TouchReceiveComponent values to enable touch detection
  b.value("MOD.Core.TouchReceiveComponent", "AutoFitToSize", true, "bool");
  b.value("MOD.Core.TouchReceiveComponent", "TouchArea", vector2(1.5, 2.5), "vector2");

  if (!b.hasComponent("script.MerchantInteract")) {
    b.addComponent("script.MerchantInteract");
  }
  
  b.write(modelPath);
  console.log("Merchant.model successfully patched and configured.");
} catch (err) {
  console.error("Failed to patch Merchant.model: ", err);
  process.exit(1);
}
