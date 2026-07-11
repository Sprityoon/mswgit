const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

const map = MapBuilder.read("map/town.map");
console.log("Town entities:");
map.listEntities().forEach(e => {
  const tc = map.component(e.name, "MOD.Core.TransformComponent");
  if (tc) {
    console.log(` - ${e.name}:`, tc.Position);
  }
});
