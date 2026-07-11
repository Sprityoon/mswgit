const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

["map/map01.map", "map/template_field.map"].forEach(mapPath => {
  const map = MapBuilder.read(mapPath);
  const tc = map.component("FishingSpot", "MOD.Core.TransformComponent");
  console.log(`${mapPath} position:`, tc ? tc.Position : "not found");
});
