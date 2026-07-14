// SkillTreePopup 확대 — 노드/Hint/EquipBar 여유 공간 확보
// 사용자 요청: 팝업 크기 키워 겹침 완화
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const pop = UIBuilder.load("ui/PopupGroup.ui");

// Root + panel
pop.patch("SkillTreePopup", {
  pos: [0, 0],
  rect_size: [920, 840],
  pivot: [0.5, 0.5],
});
pop.patch("SkillTreePopup/Bg", {
  pos: [0, 0],
  rect_size: [680, 760],
  pivot: [0.5, 0.5],
});

// Header (Bg half-h = 380)
pop.patch("SkillTreePopup/Bg/Title", {
  pos: [0, 340],
  rect_size: [360, 44],
  pivot: [0.5, 0.5],
});
pop.patch("SkillTreePopup/Bg/SPText", {
  pos: [0, 298],
  rect_size: [400, 32],
  pivot: [0.5, 0.5],
});
pop.patch("SkillTreePopup/Bg/BtnClose", {
  pos: [310, 340],
  rect_size: [50, 50],
  pivot: [0.5, 0.5],
});

// Nodes — 가로 pitch 210, 세로 pitch 150, 노드 172×108
const nodeSize = [172, 108];
const cols = [-210, 0, 210];
const rows = [200, 50, -100]; // row 1..3
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const name = `SkillTreePopup/Bg/Node_${r + 1}_${c + 1}`;
    if (!pop.find(name)) continue;
    pop.patch(name, {
      pos: [cols[c], rows[r]],
      rect_size: nodeSize,
      pivot: [0.5, 0.5],
    });
    // 내부 텍스트 폭을 노드에 맞춤 (선택)
    for (const child of ["NameText", "LvText", "SubText"]) {
      const p = `${name}/${child}`;
      if (!pop.find(p)) continue;
      const t = pop.getComponent(p, "MOD.Core.UITransformComponent");
      if (!t) continue;
      pop.patch(p, {
        pos: [t.anchoredPosition.x, t.anchoredPosition.y],
        rect_size: [164, t.RectSize.y],
        pivot: [t.Pivot.x, t.Pivot.y],
      });
    }
  }
}

// Hint — 노드3 하단(-154)과 EquipBar 상단 사이
pop.patch("SkillTreePopup/Bg/Hint", {
  pos: [0, -210],
  rect_size: [620, 24],
  pivot: [0.5, 0.5],
});

// EquipBar — 더 넓고 약간 높게, 하단 여유
pop.patch("SkillTreePopup/Bg/EquipBar", {
  pos: [0, 84],
  rect_size: [640, 132],
  pivot: [0.5, 0.5],
});
pop.patch("SkillTreePopup/Bg/EquipBar/DetailText", {
  pos: [12, -10],
  rect_size: [616, 30],
  pivot: [0, 1],
});
// QWER 좌측, LevelUp 우측 (간격 유지)
const qwer = [
  ["BtnQ", 16],
  ["BtnW", 88],
  ["BtnE", 160],
  ["BtnR", 232],
];
for (const [name, x] of qwer) {
  pop.patch(`SkillTreePopup/Bg/EquipBar/${name}`, {
    anchor: "bottom-left",
    pos: [x, 16],
    rect_size: [64, 40],
    pivot: [0, 0],
  });
}
pop.patch("SkillTreePopup/Bg/EquipBar/BtnLevelUp", {
  anchor: "bottom-right",
  pos: [-16, 16],
  rect_size: [220, 40],
  pivot: [1, 0],
});

pop.write("ui/PopupGroup.ui");
console.log("✓ SkillTreePopup enlarged");

// verify gaps
const b = UIBuilder.load("ui/PopupGroup.ui");
function dump(p) {
  const t = b.getComponent(p, "MOD.Core.UITransformComponent");
  if (!t) return console.log(p, "MISSING");
  console.log(p, "ap", JSON.stringify(t.anchoredPosition), "sz", JSON.stringify(t.RectSize));
}
[
  "SkillTreePopup",
  "SkillTreePopup/Bg",
  "SkillTreePopup/Bg/Title",
  "SkillTreePopup/Bg/SPText",
  "SkillTreePopup/Bg/BtnClose",
  "SkillTreePopup/Bg/Node_1_1",
  "SkillTreePopup/Bg/Node_3_3",
  "SkillTreePopup/Bg/Hint",
  "SkillTreePopup/Bg/EquipBar",
  "SkillTreePopup/Bg/EquipBar/BtnLevelUp",
].forEach(dump);

// computed gaps (Bg center coords, halfH=380)
const node3Bottom = -100 - 54; // -154
const equipTop = -380 + 84 + 66; // -230
const hintY = -210;
console.log("Node3 bottom", node3Bottom, "Hint", hintY, "EquipBar top", equipTop);
console.log("gap Node3→Hint", node3Bottom - (hintY + 12));
console.log("gap Hint→Equip", (hintY - 12) - equipTop);
console.log("gap Node3→Equip", node3Bottom - equipTop);
// horizontal node gap
const nRight = -210 + 86; // left node right edge
const mLeft = 0 - 86;
console.log("horiz gap between nodes", mLeft - nRight);
