// FishingRankBoard 이동: (-2.0,-2.6) → (3.5,-5.5) — 낚시터와 상호작용 존 완전 분리(>5.5)
const { MapBuilder } = require("../.claude/skills/msw-general/scripts/map/msw_map_builder.cjs");
const map = MapBuilder.read("map/town.map");

const spr = map.component("FishingRankBoard", "MOD.Core.SpriteRendererComponent");
console.log("before: OrderInLayer=", spr && spr.OrderInLayer, "SortingLayer=", spr && spr.SortingLayer);
const tf = map.component("FishingRankBoard", "MOD.Core.TransformComponent");
console.log("before: pos=", JSON.stringify(tf && tf.Position));

map.patch("FishingRankBoard", { pos: [3.5, -5.5, 0] });
map.write("map/town.map");

const after = MapBuilder.read("map/town.map").component("FishingRankBoard", "MOD.Core.TransformComponent");
console.log("after: pos=", JSON.stringify(after && after.Position));
