# Style: Cartoon (soft illustrated pixel)

One of the two style options. Choose cartoon for **characters, NPCs, monsters, mascots, and any sprite that should feel cute / illustrated / storybook-like**. For icons, tiles, and simple props where a crisp retro look works better, prefer [style-retro.md](style-retro.md).

Cartoon is **higher-resolution pixel art** with **rich stepped shading**, **colored outlines (selout)**, and **selective anti-aliasing** on silhouette edges. The result reads as "painted cartoon" rather than "retro 8-bit", while still being discrete pixels on a grid.

The style runs at two **pixel densities**: **standard** (logical grid upscaled ~2× to the output — pixels gently visible) and **high-resolution** (grid = output at 1:1 — pixels barely visible, the look of modern high-fidelity 2D games such as MapleStory-style sprites at 100–300 px). Standard rules below apply to both; the [High-resolution mode](#high-resolution-mode-11-density) section describes what changes at 1:1.

## Core principles

- **Larger logical grid** — typically 48×48 to 128×128 at standard density (vs 16×16 for retro), leaving room for facial features, shading bands, and outline pixels. Below a 48 grid there isn't room for this style — fall back to retro.
- **Rich stepped shading** — 4–6 levels per surface, still stepped (no gradient APIs), just more steps than retro.
- **Selout (colored outlines)** — outlines are NEVER pure black; each surface's outline is a darker, slightly desaturated version of its own fill.
- **Selective anti-aliasing** — single intermediate-color pixels soften staircase steps, **on the silhouette only**, never on internal shading.
- **Saturated-pastel palette** — warm, slightly desaturated colors; think children's-book illustration, not neon arcade. Avoid pure primaries.
- **Grid alignment still mandatory** — no fractional coordinates, no curve APIs, no gradients.

## Shading ramp per surface (4–6 levels)

| Level | Role | Recipe from base |
|:-:|---|---|
| 0 | Deep shadow | base − 40% lightness, +5% saturation |
| 1 | Mid shadow | base − 20% lightness |
| 2 | **Base** | the primary fill |
| 3 | Mid highlight | base + 15% lightness |
| 4 | Top highlight | base + 30% lightness, hue nudged toward yellow |
| 5 | Rim light (optional) | base + 40% lightness, 1px line on the dark side |

Example — green body with base `#7BC96B`: `#3F7A3A` / `#5BA853` / `#7BC96B` / `#A5DC95` / `#D4F0C2` (+ rim `#EAFADE`). Apply levels in shrinking bands 2–4 px wide, following the form. Key light upper-left.

## Selout (colored outline)

Outline color = base color with **lightness −40~50%**, saturation similar or slightly lower.

| Surface base | Selout |
|---|---|
| Skin `#F4C8A8` | `#8B5A3C` |
| Leaf green `#7BC96B` | `#2F5A2A` |
| Cloth red `#E85A4F` | `#7A2A20` |
| Water blue `#5AA8E8` | `#1E4A7A` |
| Metal yellow `#F4D060` | `#8A6A20` |

Where two outlined surfaces meet, use the darker of the two selouts — or omit the line and rely on color contrast.

## Selective anti-aliasing

On diagonal/curved silhouette edges, place **one intermediate-color pixel** at the inside corner of each staircase step:

```
. . . O O O .         . . . O O O .
. . O X X X .         . . a X X X .    a = AA pixel,
. O X X X X .   →     . a X X X X .    color ≈ halfway between
O X X X X X .         a X X X X X .    outline O and fill X
```

Rules: silhouette only (sprite ↔ transparent boundary); never on internal shading; max 1 AA pixel per step — stacking them turns the sprite mushy.

## Dithering (sparingly)

For large soft surfaces (sky, water, a big shield), a **2×2 checkerboard** may blend two *adjacent* ramp levels. Only on flat fields ≥ 8×8 px; never on faces or detail areas; never across more than one ramp step.

## Character proportions (SD / chibi)

Cartoon characters are **2–3 heads tall**:

| Total height | Head | Torso | Legs |
|---|---|---|---|
| 64 px | 26 | 18 | 20 |
| 96 px | 32 | 28 | 36 |
| 128 px | 42 | 38 | 48 |

### Face features

- **Eyes**: large and round, 3–5 px wide, upper third of the face, ~1 eye-width apart, 1px white highlight in each pupil.
- **Nose**: 1px dot or omitted.
- **Mouth**: 2–3 px wide simple line, or a tiny "v"/"u".
- **Cheek blush**: 1–2 px soft pink (`#F4A8B8`) below the eyes — optional, very on-tone.
- **Head outline**: full selout in a warm dark brown — never black.

### Hair / fur

Solid base block + 1 highlight band on top + 1 shadow band underneath; a few 1-px flyaway strands on the silhouette sell the hand-drawn look.

## Forbidden (still applies)

- Curve/gradient/blur primitives in any first-pass generator script — roundness comes from hand-placed steps + selective AA; smooth transitions from stepped bands + optional dithering.
- **Pure black outlines** — always selout.
- Interior AA / stacked AA.

## Round shapes by hand

Start from the retro midpoint circle, then add 1 AA pixel at each corner step. A 12×12 example (O = selout, X = fill):

```
. . . O O O O O O . . .
. . O X X X X X X O . .
. O X X X X X X X X O .
O X X X X X X X X X X O
O X X X X X X X X X X O
O X X X X X X X X X X O
O X X X X X X X X X X O
O X X X X X X X X X X O
O X X X X X X X X X X O
. O X X X X X X X X O .
. . O X X X X X X O . .
. . . O O O O O O . . .
```

Sprinkle one mix-color pixel at each `.` cell diagonally touching both `O` and `X` — that single tweak turns a chunky circle into a soft cartoon button.

## High-resolution mode (1:1 density)

For sprites that should look like modern high-fidelity 2D games — 100–300 px characters/monsters where individual pixels are barely visible (MapleStory-style art is the canonical example). Logical grid = output size; nothing is upscaled.

**What changes vs standard density:**

- **Ramps deepen to 6–8 levels** per major surface. Bands become **organic clusters** that follow the form (clumps of fur, folds of cloth, plates of armor) instead of straight 2–4px stripes — at this density, straight bands read as banding artifacts.
- **Selout thickens with size**: 1 px up to ~128, 2 px on larger silhouettes — and the outline itself is **ramped** (darkest at the shadow side, lighter toward the light side) so the sprite doesn't look stickered on.
- **AA loosens, deliberately**: 2–3 AA pixels per silhouette step are fine, and sparing interior AA between high-contrast surfaces (hair over face, weapon over body) is allowed. It must still be hand-controlled placement — never renderer smoothing.
- **Faces gain full detail**: multi-color irises with 1–2 highlights, eyebrow/eyelash lines, shaped mouths, hair in distinct locks each carrying its own mini-ramp.
- **Proportions open up**: chibi 2–3 heads stays the default for cute requests, but 4–5 head proportions are available when the user wants a taller/serious look — confirm during elicitation.
- **Material contrast matters**: at this size viewers expect fur ≠ cloth ≠ metal. Vary ramp step spacing (metal = few steps + hard specular; fur = many close steps + edge flicks; cloth = mid steps + fold shadows).

**What does NOT change**: the bans. No renderer gradients, no blur, no curve APIs, no fractional coordinates. Smoothness comes from more, finer, hand-decided pixels — procedural loops *computing* per-pixel colors (noise-seeded cluster shading, dither fields) are encouraged; letting the renderer interpolate is not.

**Method**: at these grids, always use the thumbnail → upscale → detail method (small structure grid by hand → programmatic ×4 upscale to .pxg → hand detail passes; see [pxg-format.md](pxg-format.md) §grid size strategy and the hi-res presets). Budget guide: a 200 px character is ~8–15 distinct surfaces × 6–8 ramp levels — plan the surface list in the Conversion Brief before drawing.

**Working grid table (hi-res)**:

| Output size | Grid | Typical use |
|---|---|---|
| 96–128 | same (1:1) | small character, detailed icon |
| 128–200 | same (1:1) | standard character / NPC |
| 200–300 | same (1:1) | large monster, boss |
| 512+ | same (1:1) | background piece (on request only) |

## Reusable accents

| Accent | Purpose | Recipe |
|---|---|---|
| Cheek blush | Cuteness | 1–2 px soft pink under the eyes |
| Eye highlight | Liveliness | 1 px white, upper-left of each pupil |
| Rim light | Form definition | 1 px lightest-ramp on the dark-side silhouette |
| Specular | Glossy metal/gems | 2–3 px cluster of lightest-ramp |
| Ground shadow | Grounded look (only when placed on ground) | 4–6 px dark oval at ~50% alpha under the feet |
