// stretch 앵커(AnchorsMin != AnchorsMax) 사용 엔티티 전수 조사 — 두 UI 파일
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

for (const f of ["ui/HUDGroup.ui", "ui/PopupGroup.ui"]) {
  const b = UIBuilder.load(f);
  console.log(`\n===== ${f} — stretch entities =====`);
  for (const e of b.listEntities()) {
    const t = b.getComponent(e.path.replace(/^\/ui\/[^/]+\//, ""), "MOD.Core.UITransformComponent")
      || b.getComponent(e.path, "MOD.Core.UITransformComponent");
    if (!t) continue;
    const stretchX = t.AnchorsMin.x !== t.AnchorsMax.x;
    const stretchY = t.AnchorsMin.y !== t.AnchorsMax.y;
    if (stretchX || stretchY) {
      console.log(
        `${e.path}  anchors=(${t.AnchorsMin.x},${t.AnchorsMin.y})~(${t.AnchorsMax.x},${t.AnchorsMax.y})  offMin=(${t.OffsetMin.x},${t.OffsetMin.y}) offMax=(${t.OffsetMax.x},${t.OffsetMax.y})  rectSize=(${t.RectSize.x},${t.RectSize.y})`
      );
    }
  }
}
