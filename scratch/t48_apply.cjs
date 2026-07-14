// T48 — HUD 버튼 이동 + EquipBar 재배치 + Node_4 제거 + Hint 이동
// Change 좌표는 handoff §3 T48 확정값 그대로 (임의 변경 금지).
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

// ── 1) HUD: BtnSkillTree → (-74,-196) ────────────────────────────────
const hud = UIBuilder.load("ui/HUDGroup.ui");
hud.patch("BtnSkillTree", {
  // top-right anchor + pivot 유지 (기존 (1,1))
  pos: [-74, -196],
  rect_size: [128, 56],
  pivot: [1, 1],
});
hud.write("ui/HUDGroup.ui");
console.log("✓ HUD BtnSkillTree → (-74,-196)");

// ── 2~4) PopupGroup: MaxRows 관련 노드 제거 + EquipBar + Hint ───────
const pop = UIBuilder.load("ui/PopupGroup.ui");

// ② Node_4_* 서브트리 제거
for (const n of ["Node_4_1", "Node_4_2", "Node_4_3"]) {
  const path = `SkillTreePopup/Bg/${n}`;
  if (pop.find(path)) {
    pop.remove(path);
    console.log(`✓ removed ${path}`);
  } else {
    console.log(`? ${path} already absent`);
  }
}

// ③ EquipBar 본체: 520×120, pos (0,68), bottom-center anchor 유지
pop.patch("SkillTreePopup/Bg/EquipBar", {
  pos: [0, 68],
  rect_size: [520, 120],
  pivot: [0.5, 0.5],
});

// DetailText: top-left (12,-8) 496×28 + Overflow=2
pop.patch("SkillTreePopup/Bg/EquipBar/DetailText", {
  pos: [12, -8],
  rect_size: [496, 28],
  pivot: [0, 1],
});
pop.patchComponent("SkillTreePopup/Bg/EquipBar/DetailText", "MOD.Core.TextComponent", {
  Overflow: 2, // Ellipsis
});

// QWER bottom-left 좌측 정렬 pitch 64
const qwer = [
  ["BtnQ", 12],
  ["BtnW", 76],
  ["BtnE", 140],
  ["BtnR", 204],
];
for (const [name, x] of qwer) {
  pop.patch(`SkillTreePopup/Bg/EquipBar/${name}`, {
    anchor: "bottom-left",
    pos: [x, 12],
    rect_size: [56, 36],
    pivot: [0, 0],
  });
}

// BtnLevelUp: bottom-right (-12,12) 200×36
pop.patch("SkillTreePopup/Bg/EquipBar/BtnLevelUp", {
  anchor: "bottom-right",
  pos: [-12, 12],
  rect_size: [200, 36],
  pivot: [1, 0],
});

// ④ Hint → (0,-160)
pop.patch("SkillTreePopup/Bg/Hint", {
  pos: [0, -160],
  rect_size: [520, 22],
  pivot: [0.5, 0.5],
});

pop.write("ui/PopupGroup.ui");
console.log("✓ PopupGroup EquipBar/Hint/Node_4 patches written");

// ── 검증 덤프 ──────────────────────────────────────────────────────
function dump(b, paths, label) {
  console.log(`\n===== ${label} =====`);
  for (const p of paths) {
    const t = b.getComponent(p, "MOD.Core.UITransformComponent");
    if (!t) {
      console.log(p, "MISSING");
      continue;
    }
    console.log(
      p,
      "ap=" + JSON.stringify(t.anchoredPosition),
      "size=" + JSON.stringify(t.RectSize),
      "aMin=" + JSON.stringify(t.AnchorsMin),
      "aMax=" + JSON.stringify(t.AnchorsMax),
      "piv=" + JSON.stringify(t.Pivot)
    );
  }
}

const hud2 = UIBuilder.load("ui/HUDGroup.ui");
dump(hud2, ["BtnSkillTree", "BtnCollection"], "HUD after");

const pop2 = UIBuilder.load("ui/PopupGroup.ui");
dump(
  pop2,
  [
    "SkillTreePopup/Bg/EquipBar",
    "SkillTreePopup/Bg/EquipBar/DetailText",
    "SkillTreePopup/Bg/EquipBar/BtnQ",
    "SkillTreePopup/Bg/EquipBar/BtnW",
    "SkillTreePopup/Bg/EquipBar/BtnE",
    "SkillTreePopup/Bg/EquipBar/BtnR",
    "SkillTreePopup/Bg/EquipBar/BtnLevelUp",
    "SkillTreePopup/Bg/Hint",
    "SkillTreePopup/Bg/Node_3_1",
    "SkillTreePopup/Bg/Node_4_1",
    "SkillTreePopup/Bg/Node_4_2",
    "SkillTreePopup/Bg/Node_4_3",
  ],
  "Popup after"
);

const detTxt = pop2.getComponent(
  "SkillTreePopup/Bg/EquipBar/DetailText",
  "MOD.Core.TextComponent"
);
console.log("DetailText.Overflow =", detTxt && detTxt.Overflow);
