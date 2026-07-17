// L2(잔디 커버) 표면 비교: 현 게시판 셀 vs 이동 후보 셀 (tileIndex 대조)
const fs = require("fs");
const raw = JSON.parse(fs.readFileSync("map/town.map", "utf8"));
const ents = raw.ContentProto.Entities;

function tilesOf(name) {
  for (const e of ents) {
    const js = typeof e.jsonString === "string" ? JSON.parse(e.jsonString) : e.jsonString;
    if (js.name === name) {
      const c = js["@components"].find((c) => c["@type"] === "MOD.Core.RectTileMapComponent");
      return c ? c.tileMap : null;
    }
  }
  return null;
}
const l2 = tilesOf("RectTileMap2") || [];
const idx = new Map();
for (const t of l2) idx.set(t.position.x + "," + t.position.y, t.tileIndex);

function probe(label, cx, cy) {
  const rows = [];
  for (let dy = 1; dy >= -1; dy--) {
    const row = [];
    for (let dx = -1; dx <= 1; dx++) {
      const v = idx.get((cx + dx) + "," + (cy + dy));
      row.push(v === undefined ? "홀" : v);
    }
    rows.push(row.join("\t"));
  }
  console.log(label + " cell(" + cx + "," + cy + ") L2 tileIndex 3x3:");
  for (const r of rows) console.log("   " + r);
}
probe("current board", -2, -3);
probe("candidate", 3, -6);
probe("pond center", -3, -4);
