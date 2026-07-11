const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

["map/map01.map", "map/template_field.map", "map/town.map"].forEach(mapPath => {
  const map = MapBuilder.read(mapPath);
  console.log(`Entities in ${mapPath}:`);
  map.listEntities().forEach(e => {
    if (e.name.includes("Fishing") || e.name.includes("Spot")) {
      console.log(` - ${e.name} (${e.path})`);
    }
  });
});
