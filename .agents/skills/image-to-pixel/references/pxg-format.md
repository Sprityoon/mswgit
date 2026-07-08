# The .pxg drawing medium — draw in text, see what you draw

`.pxg` is a palette-keyed text grid: **one character = one pixel**. It is this skill's only drawing medium. The point is not the file format — it's that the sprite is *visible in the text itself* while you draw. You see the silhouette, the shading clusters, the staircase rhythm, and every stray pixel directly in your own output, which is exactly the feedback loop that shape-based code (SVG rects, canvas fills) destroys.

## Format

```
PXG 1
size 8 8
// comment lines start with //
. transparent
O #1A3A5C
b #4A90D9
h #7FB5E8
grid
..OOOO..
.ObhhbO.
ObhbbbbO
ObbbbbbO
ObbbbbbO
ObbbbbbO
.ObbbbO.
..OOOO..
```

- Header: `PXG 1`, then `size W H`, then one palette line per color: `<single char> <#RRGGBB | #RRGGBBAA | transparent>`. `.` is transparent by convention.
- `grid`, then exactly H rows of exactly W characters (spaces between cells are allowed but unnecessary).
- Keys: any printable character except whitespace, `#`, `/`. ~90 usable keys.
- Alpha supported via `#RRGGBBAA` (e.g. a 50% ground shadow: `s #20181080`).

**Choose keys that read visually**: `.` empty, `O` outline, light-to-dark within a surface as `a b c d` or meaningful letters (`s`kin, `h`air). A grid you can read at a glance is a grid you can fix at a glance.

## Rendering — `scripts/pixeltool.py` (Python 3 stdlib, no installs)

```bash
python scripts/pixeltool.py render sprite.pxg -o out.png --preview 4
```

- Writes `out.png` at 1:1 grid scale **plus** `out@4x.png` — view the preview for critique; deliver the 1:1 file (or ask the engine to scale — never deliver the preview as the asset unless chunky output at that scale was the spec).
- `--crop X Y W H` renders a region only — essential for inspecting a face or hand on a large grid.
- Other subcommands: `grid` (PNG → .pxg, `--detect-scale` collapses an integer upscale), `analyze` (palette/ramps/outline report for studying exemplars), `pixelize` (hi-res image → quantized .pxg, see imagegen-path.md).
- No Python? The format is trivial — port the ~30-line render loop to any runtime available. Do not fall back to drawing in SVG.

## Drawing workflow

Draw in **passes**, each pass a full rewrite of the grid (cheap in text):

1. **Scaffold + silhouette pass** — first lay guides with a reserved guide key (`_ #FF00FF80`): the baseline row, center column, and head-top row from the composition contract, drawn across the empty canvas. Then draw the silhouette in one fill color against them — feet ON the baseline guide, mass balanced on the center guide.

   **Composition gate (hard stop)**: render, run `pixeltool check` with the contract numbers (composition.md), and verify the facing cues table. Only when both pass, delete the `_` guides and continue. Composition locks here — every later pass inherits it, and fixing view or framing after shading means redoing everything, which is exactly why it otherwise gets "left as is".
2. **Surface pass** — split the silhouette into flat base colors per surface (skin/hair/cloth…), per the preset's palette.
3. **Shading pass** — add ramp steps per surface, following the preset's cluster idioms (bands at chunky density, organic clusters at hi-res). Light upper-left.
4. **Outline & detail pass** — selout the silhouette (style-cartoon) or hard outline (style-retro), then face/anchor details, then selective AA pixels where the style allows.

## Grid size strategy

| Logical grid | How to produce the .pxg |
|---|---|
| ≤ 48×48 | Write the grid entirely by hand, row by row |
| 48–96 | Hand-write, or generate a first-pass grid with a short throwaway script (region fills), then refine by hand — the hand refinement is where the quality lives |
| 96+ (hi-res 1:1) | Always generate the first pass programmatically (scanline fills + shading + auto-selout emitting .pxg text), then iterate with **hand edits on regions**, using `render --crop` to inspect the areas you're editing |

## Editing techniques (text-native)

- **Row surgery**: fix one row by rewriting that line — no coordinate math.
- **Column check**: misaligned verticals (a leg, a sword edge) show up as jagged character columns; read down the file.
- **Staircase rhythm**: a hand-drawn curve steps 1 cell at a consistent rate (`2,2,1,1` cells per step, shrinking toward the pole). Irregular steps read as wobble — count the characters.
- **Orphan hunt**: any single character surrounded by a different key is a stray pixel unless it's a deliberate accent (eye highlight, AA pixel, flyaway strand).
- **Cluster shaping**: shading boundaries should trace the form. In text this means the boundary between `b` and `c` keys drifts 1–2 cells per row along the surface curve — straight vertical boundaries read as stripes.

## The self-critique loop (mandatory, minimum 2 rounds)

After every render, **view the preview image** and critique against the Conversion Brief before showing the user:

1. **Squint test** — does the silhouette read as the subject at a glance?
2. **Composition contract** — re-run `pixeltool check` with the contract numbers (late edits shift the bbox), and confirm the facing cues still hold?
3. **Anchors** — every identity anchor present and recognizable?
4. **Banding** — shading in parallel stripes instead of form-following clusters?
5. **Mush** — adjacent ramp steps too close in value to distinguish? (fix the palette, not the pixels)
6. **Orphans & outline gaps** — stray pixels; outline holes where background leaks in?
7. **Style compliance** — retro: zero AA; cartoon: selout not black, AA only on silhouette.

Fix findings by editing the .pxg, re-render, re-view. **Do not show the user a first render.** Stop when a round produces no edits (typically 2–4 rounds). If the same defect survives two fix attempts, the problem is one pass earlier — redo that pass instead of patching pixels.
