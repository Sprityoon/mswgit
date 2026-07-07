# Composition recipes — making the layout exactly what was asked

The user's #1 requirement for this skill: **the composition must match what they asked for, unambiguously.** The source image's composition is irrelevant once the target view is chosen — these recipes define where the subject sits on the canvas, which way it faces, and how the pose reads.

## Global rules (all asset types)

- **Transparent background** unless the asset IS a background/tile or the user asked for one.
- **One facing direction, drawn consistently.** MSW flips sprites at runtime (negative scale / FlipX), so never draw a "both sides" sprite. Default facing: **left** (MapleStory monster convention); follow the user if they specify.
- **Fill the canvas intentionally** — subject occupies its recipe's target share of the canvas; check the render for the top-left-corner bug (painter pitfall).
- **Upper-left key light** — all shading ramps follow it, whatever the photo's lighting did.

## Character / monster sprite (side-view maps: MapleTile, SideViewRectTile)

- **View**: side or ¾ side. Full body.
- **Baseline**: feet/ground contact on a common line **2–4 px above the bottom edge** — sprites sit on footholds/tiles, so a floating or clipped baseline is immediately visible in-game.
- **Horizontal**: silhouette centered; leave headroom of ~5–10% canvas at top.
- **Pose (idle)**: relaxed stance, slight forward lean, arms visible against the body silhouette (avoid arms fully occluded by torso — the silhouette goes mute). Maple style: 2.5–3 head chibi re-proportioning regardless of source proportions.
- **Pose (action, on request)**: exaggerate the readable line of action; keep both feet inside the canvas.

## Character / monster sprite (top-down maps: RectTile)

- **View**: top-down ¾ overhead (head large, feet small, body foreshortened) — pure bird's-eye reads poorly for characters.
- **Facing**: down (toward viewer) by default — it's the view players see most.
- **Baseline**: subject centered both axes; shadow oval optional under the body.

## NPC portrait / bust

- **View**: ¾ front, head + shoulders, eyes in the upper third.
- Face detail budget is the priority — pick sizes/grids that give maple face features room (48×48 logical grid+).

## Item / UI icon

- **Layout**: centered, subject fills **70–80%** of canvas, even padding, slight bottom-weight (1–2px lower than exact center) for visual stability.
- **Angle**: the object's most recognizable angle — swords diagonal (hilt lower-left, tip upper-right), potions upright, food ¾ top.
- **Readability first**: must read at 100% in an inventory slot; bold silhouette beats interior detail. Chunky style default.

## Tile (floor / wall / platform)

- **Layout**: edge-to-edge, no outline on canvas edges, no transparent margin.
- **Seamless check**: left column must continue into the right column, top into bottom. After rendering, verify by imagining the tile repeated 3×3 — obvious repeating "hot spots" (one bright pixel cluster) break the illusion; distribute detail evenly.
- Source image here is usually a *texture reference* (grass, brick): extract hue + texture rhythm, not layout.

## Background prop (tree, sign, building)

- **View**: match the map's camera (side-view maps → straight-on side; top-down → ¾ overhead).
- **Baseline**: ground contact at bottom edge (props sit on the ground like characters).
- Larger canvases allowed per size-guide only on explicit request.

## View-conversion table (source view → target view)

| Source → Target | Approach |
|---|---|
| Side photo → side sprite | Closest case. Redraw silhouette proportions loosely from source; still style-shift and re-pose to idle |
| Front photo → side sprite | **Full re-imagination.** Take anchors (colors, ear/hair shape, accessories) and draw the subject from the side as you know such subjects look. Never trace |
| Any photo → top-down | Full re-imagination into ¾ overhead; anchors become top-visible features (hair color/shape, shoulder colors) |
| Bust/crop → full body | Invent lower body consistent with visible clothing and proportion rules of the style |
| Full scene → single asset | Isolate the subject; drop the scene (unless the request IS the scene as a background) |
| Object photo (angled) → icon | Re-angle to the icon-standard angle above; correct perspective distortion |

State the chosen recipe + facing + baseline in one line before writing drawing code, e.g.:
`구도: 측면 전신, 왼쪽 향함, 발 기준선 y=61/64, 캔버스 점유 ~85%`.
This line is what the step-6 self-check compares the render against.
