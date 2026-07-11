const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

const modelPath = "RootDesk/MyDesk/Furniture/Models/FishingSpot_Pond.model";

// map01.map
const map01 = MapBuilder.read("map/map01.map");
if (map01.find("FishingSpot")) {
  map01.remove("FishingSpot");
}
map01.placeModel("FishingSpot", modelPath, {
  pos: [2, 2, 0],
  componentOverrides: {
    "script.FishingSpot": { SpotType: "estate" }
  }
}).write("map/map01.map");
console.log("Updated map01.map");

// template_field.map
const mapField = MapBuilder.read("map/template_field.map");
if (mapField.find("FishingSpot")) {
  mapField.remove("FishingSpot");
}
mapField.placeModel("FishingSpot", modelPath, {
  pos: [2, 2, 0],
  componentOverrides: {
    "script.FishingSpot": { SpotType: "field" }
  }
}).write("map/template_field.map");
console.log("Updated template_field.map");

// town.map
const mapTown = MapBuilder.read("map/town.map");
if (mapTown.find("FishingSpot")) {
  mapTown.remove("FishingSpot");
}
mapTown.placeModel("FishingSpot", modelPath, {
  pos: [1, 4.5, 0],
  componentOverrides: {
    "script.FishingSpot": { SpotType: "town" }
  }
}).write("map/town.map");
console.log("Updated town.map");
