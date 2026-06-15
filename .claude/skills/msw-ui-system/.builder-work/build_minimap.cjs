const { UIBuilder } = require("../scripts/msw_ui_builder.cjs");

const UI = "C:/Users/yaong/Documents/메이플월드/ui/HUDGroup.ui";
const SOLID = "4fea64a3307cda641809ad8be0d4890b"; // solid white square (reused from HP/Fill)

const GRID = 15;          // GridCells (matches UIMinimapController.GridCells default)
const CELL = 16;          // spacing between cell centers (px)
const CELL_SIZE = 15;     // rendered cell size (1px gap → grid look)
const HALF = (GRID - 1) / 2; // 7
const SIDE = GRID * CELL;  // 240
const PAD = 10;
const BOX = SIDE + PAD;    // 250 container/bg

const b = UIBuilder.read(UI);

// 1) Remove the reverted ResourcePanel (replaced by the minimap per design §3.10).
if (b.find("/ui/HUDGroup/ResourcePanel")) {
  b.remove("/ui/HUDGroup/ResourcePanel");
}

// 2) Minimap container holding the UIMinimapController script, top-right of HUD.
b.script("Minimap", "script.UIMinimapController", {
  anchor: "top-right",
  pos: [-20, -20],
  rect_size: [BOX, BOX],
});

// 3) Background frame behind the cells.
b.sprite("Minimap/Bg", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [BOX, BOX],
  image_ruid: SOLID,
  color: "#0f1117",
  alpha: 0.85,
});

// 4) 15x15 grid of cells (Cell_r_c). Row r grows north (up), col c grows east (right),
//    matching UIMinimapController.RepaintWindow world->screen mapping.
for (let r = 0; r < GRID; r++) {
  for (let c = 0; c < GRID; c++) {
    b.sprite(`Minimap/Cell_${r}_${c}`, {
      anchor: "middle-center",
      pos: [(c - HALF) * CELL, (r - HALF) * CELL],
      rect_size: [CELL_SIZE, CELL_SIZE],
      image_ruid: SOLID,
      color: "#10121a",
      alpha: 1.0,
    });
  }
}

// 5) Fixed player marker at the center, drawn on top.
b.sprite("Minimap/Marker", {
  anchor: "middle-center",
  pos: [0, 0],
  rect_size: [12, 12],
  image_ruid: SOLID,
  color: "#ffe100",
  alpha: 1.0,
});

b.write(UI);
console.log("Minimap built. Total entities:", b.listEntities().length);
