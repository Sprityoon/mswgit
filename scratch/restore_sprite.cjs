const { MapBuilder } = require("../.agents/skills/msw-general/scripts/map/msw_map_builder.cjs");

['map/map01.map', 'map/template_field.map', 'map/town.map'].forEach(mapFile => {
  const m = MapBuilder.read(mapFile);
  const spot = m.find("FishingSpot");
  if (spot) {
    const sr = spot["@components"].find(c => c["@type"] === "MOD.Core.SpriteRendererComponent");
    if (sr) {
      sr.SpriteRUID = "ecb83722d7fa4a3ab425302401032701";
      m.write(mapFile);
      console.log(`Updated ${mapFile}`);
    }
  }
});
