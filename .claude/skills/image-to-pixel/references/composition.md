# Composition recipes — making the layout exactly what was asked

The user's #1 requirement for this skill: **the composition must match what they asked for, unambiguously.** The source image's composition is irrelevant once the target view is chosen — these recipes define where the subject sits on the canvas, which way it faces, and how the pose reads.

## Global rules (all asset types)

- **Transparent background** unless the asset IS a background/tile or the user asked for one.
- **One facing direction, drawn consistently.** Game engines flip sprites at runtime (negative scale / flip flag), so never draw a "both sides" sprite. Default facing: **left**; follow the user or the project's existing sprites if a convention is visible.
- **Fill the canvas intentionally** — the subject occupies its recipe's target share of the canvas; after rendering, check that content isn't stuck in one corner (a classic size-mismatch bug).
- **Upper-left key light** — all shading ramps follow it, whatever the photo's lighting did.

## Character / monster sprite (side-view games: platformer, side-scroller, beat 'em up)

- **View**: side or ¾ side. Full body.
- **Baseline**: feet/ground contact on a common line **2–4 px above the bottom edge** — sprites stand on platforms/tiles, so a floating or clipped baseline is immediately visible in-game.
- **Horizontal**: silhouette centered; leave headroom of ~5–10% canvas at top.
- **Pose (idle)**: relaxed stance, slight forward lean, arms visible against the body silhouette (avoid arms fully occluded by the torso — the silhouette goes mute). Cartoon style: 2–3 head chibi re-proportioning regardless of source proportions.
- **Pose (action, on request)**: exaggerate the readable line of action; keep both feet inside the canvas.

## Character / monster sprite (top-down games)

- **View**: top-down ¾ overhead (head large, feet small, body foreshortened) — pure bird's-eye reads poorly for characters.
- **Facing**: down (toward viewer) by default — it's the view players see most.
- **Placement**: subject centered on both axes; shadow oval optional under the body.

## NPC portrait / bust

- **View**: ¾ front, head + shoulders, eyes in the upper third.
- Face detail budget is the priority — pick sizes/grids that give cartoon face features room (48×48 logical grid+).

## Item / UI icon

- **Layout**: centered, subject fills **70–80%** of canvas, even padding, slight bottom-weight (1–2px lower than exact center) for visual stability.
- **Angle**: the object's most recognizable angle — swords diagonal (hilt lower-left, tip upper-right), potions upright, food ¾ top.
- **Readability first**: must read at 100% in an inventory slot; a bold silhouette beats interior detail. Retro style default.

## Tile (floor / wall / platform)

- **Layout**: edge-to-edge, no outline on canvas edges, no transparent margin.
- **Seamless check**: the left column must continue into the right column, top into bottom. After rendering, verify by imagining the tile repeated 3×3 — obvious repeating "hot spots" (one bright pixel cluster) break the illusion; distribute detail evenly.
- The source image here is usually a *texture reference* (grass, brick): extract hue + texture rhythm, not layout.

## Background prop (tree, sign, building)

- **View**: match the game's camera (side-view games → straight-on side; top-down → ¾ overhead).
- **Baseline**: ground contact at the bottom edge (props sit on the ground like characters).
- Larger canvases only on explicit request (SKILL.md size table).

## View-conversion table (source view → target view)

| Source → Target | Approach |
|---|---|
| Side photo → side sprite | Closest case. Redraw silhouette proportions loosely from the source; still style-shift and re-pose to idle |
| Front photo → side sprite | **Full re-imagination.** Take anchors (colors, ear/hair shape, accessories) and draw the subject from the side as you know such subjects look. Never trace |
| Any photo → top-down | Full re-imagination into ¾ overhead; anchors become top-visible features (hair color/shape, shoulder colors) |
| Bust/crop → full body | Invent the lower body consistent with visible clothing and the style's proportion rules |
| Full scene → single asset | Isolate the subject; drop the scene (unless the request IS the scene as a background) |
| Object photo (angled) → icon | Re-angle to the icon-standard angle above; correct perspective distortion |

## The composition contract (state it, then verify it mechanically)

Before drawing, state the chosen recipe as **one line with numeric targets** — not adjectives:

`구도: 측면 전신, 왼쪽 향함 | baseline-gap 2..4, height-occ 0.82..0.92, center-x ±2`

The numbers are verified with the bundled checker at every render:

```bash
python scripts/pixeltool.py check out.pxg --baseline 2..4 --height-occ 0.82..0.92 --center-x 2
# icons add:  --margin-min 1 (16-grid) / 2 (32-grid)
# tiles use:  --opaque-edges
```

A FAIL is a hard stop — fix the grid before any further pass. "Looks about right" is how composition drifts; the checker doesn't rubber-stamp.

## Facing cues — what the checker can't measure, verify visually

View/facing errors (drawing the source's front view when a side view was locked) are the composition failures a bounding box can't catch. At the **silhouette pass**, verify the target view by its concrete cues:

| Locked view | Cues that MUST hold on the render |
|---|---|
| Side | Exactly one eye; nose/muzzle breaks the front silhouette edge; single shoulder line; legs overlap or stand in file (no mirrored A-pose legs) |
| ¾ front | Both eyes, far eye 1–2px narrower; nose off-center toward the near side; far arm/leg partially hidden behind the body |
| Front | Left-right symmetric within ±1px; both ears/shoulders mirrored |
| Top-down ¾ | Head mass larger than body; feet nearly hidden; facial features compressed into the lower half of the head |
| Icon | No ground/horizon; recipe angle held (sword diagonal, potion upright); padding even on all sides |

If any cue fails, the view is wrong — redo the silhouette pass. Shading a wrong view deeper into the sprite is the most expensive mistake this skill can make.
