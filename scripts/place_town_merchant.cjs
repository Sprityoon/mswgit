const path = require("path");
const { MapBuilder } = require("../plugins/msw-maker-base-skill/skills/msw-general/scripts/map/msw_map_builder.cjs");

const mapPath = path.join(__dirname, "..", "map", "town.map");
const modelPath = "RootDesk/MyDesk/NPC/Models/Merchant.model";

try {
  console.log("Placing merchant in town map...");
  const map = MapBuilder.read(mapPath);
  
  // Guard placement to make it idempotent
  if (map.find("Merchant")) {
    console.log("Merchant already exists, removing old one...");
    map.remove("Merchant");
  }
  
  map.placeModel("Merchant", modelPath, {
    pos: [0, 1, 0]
  });
  
  map.write(mapPath);
  console.log("Merchant successfully placed at (0, 1, 0) in town.map");
} catch (err) {
  console.error("Failed to place merchant: ", err);
  process.exit(1);
}
