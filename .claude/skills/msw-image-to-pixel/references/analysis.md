# Source image analysis → Conversion Brief

The goal of analysis is to extract **what makes the subject recognizable** so it can be redrawn in a completely different style, size, and composition without losing identity. You are not building a pixel map of the image — you are building a *description* precise enough to draw from.

## The Conversion Brief (required output)

Write this in the transcript before eliciting or drawing. Use this exact template:

```
## Conversion Brief
- Subject: <one sentence — what the image shows>
- Identity anchors (must survive): <3–5 bullets>
- Source palette → target ramps: <dominant hues → quantized, style-shifted ramps>
- Source composition: <view, pose, framing of the original>
- Target composition: <requested view/layout — or "TBD → elicit">
- Reinterpretation notes: <what gets re-posed / simplified / invented>
- Spec: <asset type> / <style> / <logical grid> / <output size>  (mark unknowns "TBD → elicit")
```

Unfilled slots marked `TBD → elicit` become the questions in the elicitation step.

## Identity anchors

Ask yourself: *if a friend of the subject saw the sprite, what 3–5 things would make them say "oh, that's them"?* Typical anchors:

- **Shape**: silhouette-defining features — long ears, round body, spiky hair, a big hat
- **Color**: the one or two colors people associate with the subject — the orange scarf, the teal logo
- **Marks**: patterns, logos, scars, blaze on a dog's face, heterochromia
- **Accessories**: glasses, collar, weapon, headphones

Rank them. At small grids you will only fit the top 2–3 (see detail budget below); the ranking decides what gets cut.

Photos: separate subject from background first. The background is noise unless the user asked for a scene — anchors come from the subject only.

## Palette: quantize and style-shift, never sample

Raw photo colors are desaturated by lighting and contain thousands of shades; a sprite needs 2–6 deliberate ramps. Two moves:

1. **Quantize** — name the 3–5 dominant hues of the subject ("warm brown fur, cream chest, red collar"), ignoring lighting variation. Each hue becomes one ramp.
2. **Style-shift** — move each hue toward the target style's palette:
   - `maple` → warm, slightly desaturated pastel (see painter `style-maple-cartoon.md` palette section). Build 4–6 level ramps + selout per surface.
   - `chunky` → minimal, punchy, 2–4 levels per surface, black/white outline allowed.

Write the resulting hex ramps into the brief. When drawing, use ONLY these ramps.

## Composition delta — where reinterpretation happens

Compare source composition to target composition and state the gap explicitly:

| Delta | What it means for drawing |
|---|---|
| Same view (photo is side-on, sprite is side-view) | Silhouette can loosely guide the outline; still redraw, don't trace |
| View change (front photo → side sprite, photo → top-down) | **Re-imagine the subject from the new angle using anchors only.** Nothing in the source can be traced; you know the ear shape, colors, and proportions — draw the subject as if you'd seen it from the target angle |
| Framing change (bust photo → full-body sprite) | Invent the unseen parts consistently with the visible ones (clothing continues, legs match body proportion) |
| Pose change (lying cat → idle standing sprite) | Keep anatomy + anchors, adopt the standard pose from composition.md |
| Style gap (realistic photo → chibi maple) | Re-proportion (2.5–3 heads tall for maple characters), enlarge the head and eyes, simplify limbs |

State each applicable delta in "Reinterpretation notes". If a delta is large (view change on a complex subject), say so during elicitation — the user may prefer a view that stays closer to the source.

## Detail budget per logical grid

Detail that fits shrinks fast with the grid. Decide what survives *before* drawing, not while drawing:

| Logical grid | Budget |
|---|---|
| 16×16 | Silhouette + 1–2 anchors as color blocks. No facial features beyond dot eyes |
| 32×32 | Silhouette + 3 anchors + simple face (dot eyes, 1px mouth) |
| 48×48 | Most anchors + maple face features (eyes with highlight, blush) |
| 64×64+ | Full anchor list + shading ramps + accessories with interior detail |

If the user's requested size can't fit their must-keep anchors, raise it during elicitation ("이 디테일을 유지하려면 128×128 이상을 추천합니다").

## Anti-patterns

- **Color-picking pixels from the photo** → lighting-contaminated mud. Quantize + style-shift instead.
- **Describing the image in terms of pixels** ("the pixel at 40,30 is brown") → you are drawing a subject, not copying a bitmap.
- **Keeping photographic lighting** (soft shadows, bounce light) → replace with the style's light model: upper-left key light, stepped ramps.
- **Anchoring on the background** ("standing in a park") → the park is not the subject. Transparent background is the default.
- **Treating text in the source (logos) as optional** → text/lettering is usually THE identity anchor of a logo; budget pixels for a readable simplified mark, or confirm with the user that it can be dropped.
