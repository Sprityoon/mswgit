// T48⑧ 재검수 — 노드 NameText 지오메트리 + 텍스트 속성 (12노드 전수)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const b = UIBuilder.load("ui/PopupGroup.ui");
for (let r = 1; r <= 3; r++) {
  for (let c = 1; c <= 3; c++) {
    const p = `SkillTreePopup/Bg/Node_${r}_${c}/NameText`;
    const t = b.getComponent(p, "MOD.Core.UITransformComponent");
    const x = b.getComponent(p, "MOD.Core.TextComponent");
    if (!t) { console.log(`${p}: MISSING`); continue; }
    console.log(
      `Node_${r}_${c}: anchors=(${t.AnchorsMin.x},${t.AnchorsMin.y}) pivot=(${t.Pivot.x},${t.Pivot.y}) ap=(${t.anchoredPosition.x},${t.anchoredPosition.y}) rect=(${t.RectSize.x},${t.RectSize.y})` +
      (x ? ` | align=${x.Alignment} font=${x.FontSize} bestfit=${x.BestFit} min=${x.MinSize} max=${x.MaxSize} overflow=${x.Overflow} sizefit=${x.SizeFit}` : " | no TextComponent")
    );
  }
}
