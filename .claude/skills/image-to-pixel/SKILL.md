---
name: image-to-pixel
description: "Convert a user-provided source image (photo, drawing, screenshot, logo, AI art) into pixel-game-ready art — a concept-driven REDRAW, not naive pixelation/downscaling. Engine-agnostic: works for any pixel/retro game project and any AI coding agent. Use whenever the user attaches or points to an image and wants it turned into a game asset: character / NPC / monster sprite, item icon, tile, background prop, or UI icon. Includes a built-in elicitation step that asks the user for concept, style, composition/view, and size BEFORE drawing. Triggers: '이 이미지를 픽셀로', '이 사진으로 캐릭터/스프라이트 만들어줘', '이 그림을 게임에 넣게 변환해줘', '이 로고를 아이콘으로', 'convert this image to pixel art', 'turn this photo into a sprite', 'pixelize this image', 'make a game sprite from this picture', image attachment + game asset request."
---

# Image-to-Pixel

Convert a **source image the user provides** into a pixel-art game asset, in the style, composition, and size the user asks for. The deliverable is a PNG (plus the drawing code that produced it) — engine integration is out of scope, so the result works for any game project.

**The one rule that defines this skill: never pixelate — reinterpret.** Mechanically downscaling or posterizing a photo produces a muddy, unreadable blob that clashes with every hand-made sprite around it. Instead, treat the source image as a *reference for identity* (what makes the subject recognizable) and **redraw the subject from scratch** on a pixel grid. The source tells you *what* to draw; the user's concept tells you *how*.

**Agent portability.** This skill assumes only three capabilities, phrased generically throughout: *view an image* (file read / attachment), *ask the user* (use the agent's structured multiple-choice question UI if it has one, otherwise a compact numbered list in chat), and *run a shell command* (to rasterize SVG to PNG — with fallbacks if no rasterizer exists). No agent-specific or engine-specific tools are required.

---

## When to apply

| Situation | Action |
|-----------|--------|
| User attached / referenced an image AND wants it as game art (sprite, icon, tile, …) | **This skill** |
| User wants pixel art but has NO source image | Out of scope as a conversion — but the bundled style references still govern from-scratch drawing (or hand off to a dedicated painter skill if the project has one) |
| User wants to re-style an image for non-game use (avatar, emote, wallpaper) | This skill still applies; only the composition recipe changes |

---

## Workflow

| Step | What | Reference |
|:-:|---|---|
| 1 | **Locate & view the source image** | below |
| 2 | **Analyze** → write a Conversion Brief | [references/analysis.md](references/analysis.md) |
| 3 | **Elicit missing specs** from the user (one question round) | [references/elicitation.md](references/elicitation.md) |
| 4 | **Plan composition** for the target asset type & view | [references/composition.md](references/composition.md) |
| 5 | **Redraw** per the chosen style's rules | [references/style-retro.md](references/style-retro.md) / [references/style-cartoon.md](references/style-cartoon.md) |
| 6 | **Render → self-check → show the user → iterate** | below |
| 7 | **Deliver** the PNG (and code) where the user wants it | below |

### Step 1 — Locate & view the source image

- Image pasted into chat → it is already visible; use it directly.
- File path given → open/view it with the agent's image-reading capability.
- Multiple images → confirm which is the *subject* and whether others are *style references* (see elicitation).
- No image found anywhere → this is not a conversion task; say so instead of guessing.

### Step 2 — Analyze

Read [references/analysis.md](references/analysis.md) and write a **Conversion Brief** in the conversation *before* asking questions or drawing. The brief pins down: subject, 3–5 identity anchors, source palette → target ramps, source composition vs target composition, and what must be re-imagined. Writing it first matters twice over: it gives the elicitation step image-informed context ("the source is a front-facing photo, so a side-view sprite means re-imagining the pose"), and it becomes the checklist the self-check in step 6 verifies against.

### Step 3 — Elicit

Read [references/elicitation.md](references/elicitation.md). The spec has five slots — **asset type, style/concept, composition/view, size, identity anchors**. Fill every slot you can from the user's request and the brief; ask about the rest in **one** question round (≤4 questions), with a recommended default presented first. This skill was explicitly designed to ask rather than guess — composition especially must be *the user's* choice, because a wrong view means a full redraw. If the user says "just decide" / "알아서 해줘" or is unavailable, proceed with the recommended defaults and state them explicitly before drawing.

### Step 4 — Plan composition

Read [references/composition.md](references/composition.md) and pick the recipe for the chosen asset type + view: feet-on-baseline for side-view characters, centered-with-padding for icons, edge-to-edge seamless for tiles, and explicit view conversion (front photo → side-view sprite = re-pose from anchors, never trace). State the chosen recipe in one line before writing drawing code — that line is what the self-check compares the render against.

### Step 5 — Redraw

Follow the chosen style reference **exactly**:

- `retro` (8/16-bit, icons/tiles/simple props) → [references/style-retro.md](references/style-retro.md)
- `cartoon` (soft, character/creature-friendly) → [references/style-cartoon.md](references/style-cartoon.md)

Both styles ban curve APIs, gradient APIs, blur/shadow filters, and fractional coordinates — every pixel is a deliberate placement on the logical grid. Colors come from the **target ramps in the Conversion Brief** — quantized and style-shifted, never sampled raw from the photo.

**Size defaults** (when the user doesn't specify):

| Use | Output size | Logical grid (retro) | Logical grid (cartoon) |
|---|---|---|---|
| Icon / button | 48–64 px | 16×16 | 24–32 |
| Character / item / NPC / monster | 96–128 px | 16–32 | 48–64 |
| Tile / floor / block | 64–128 px | 16–32 | 32–64 |
| Background / large object | 256 px+ (only on request) | 32–64 | 128 |

Cartoon style needs a logical grid of ~48+ (output 64 px+) to fit outlines, shading, and facial features; below that, use retro.

### Step 6 — Render, self-check, show, iterate

**Preferred medium: SVG** — it is plain text, every agent can write it, and many tools can rasterize it.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128"
     shape-rendering="crispEdges" style="image-rendering: pixelated;">
  <rect x="6" y="2" width="1" height="1" fill="#4A90D9"/>
  <!-- one 1×1 rect per logical pixel; runs may be merged into wider rects -->
</svg>
```

- `viewBox` = the logical grid; `width`/`height` attributes = the output pixel size (an **integer multiple** of the grid, or edges blur).
- `shape-rendering="crispEdges"` prevents anti-aliasing seams between rects.
- Alternative medium: HTML5 Canvas JS (helpful for procedural loops) if the environment has a JS runtime + headless browser to screenshot it.

**Rasterize with whatever the environment has** (first match wins):

```bash
resvg in.svg out.png                                  # resvg
rsvg-convert -w 128 -h 128 in.svg -o out.png          # librsvg
magick -background none in.svg out.png                # ImageMagick 7
inkscape in.svg -w 128 -h 128 -o out.png              # Inkscape
# or a headless browser (puppeteer / playwright) screenshotting the SVG
```

If no rasterizer is available, deliver the `.svg` itself and say so — the drawing is complete either way. Write working files to a temp/working directory, not the project's asset folders, until the user approves.

Then **view the output** and check it against the Conversion Brief before showing the user:

1. Composition matches the requested view/layout (not the source's)?
2. All identity anchors visible and recognizable?
3. Silhouette readable at 100% scale (squint test)?
4. Style rules honored (retro: sharp edges, zero AA / cartoon: colored outlines, no pure black)?
5. Background transparent (unless the asset is a tile/background), canvas fully and intentionally used?

Show the image to the user and invite corrections. On feedback, update only the affected part of the brief and redraw — don't re-run the full elicitation for a tweak.

### Step 7 — Deliver

Save the approved PNG (and the SVG/code alongside it) to the path the user names, or ask where it should go if the project has an obvious asset convention. If the project has its own asset-registration pipeline (a game-engine importer, an upload skill), hand off there — registering assets is outside this skill.

---

## Report format

```
Output: <file path(s)>
Style: <retro | cartoon> / Size: <W×H> (grid <G×G>) / View: <composition>
Source: <one-line description of the original image>
Kept: <identity anchors that survived>
Reinterpreted: <what was changed from the source and why>
```

---

## Common pitfalls

- **Sampling colors straight from a photo** → muddy, desaturated sprite that matches nothing in-game. Always quantize into style ramps (analysis.md).
- **Tracing the source composition when the user asked for a different view** → the #1 failure mode. A front-facing photo cannot be traced into a side-view sprite; re-pose from identity anchors (composition.md).
- **Skipping elicitation because the request "seems obvious"** → wrong asset type or view = full redraw. One question round is cheaper.
- **Asking about slots the user already answered** → noise. Fill from the request first; ask only about genuinely empty slots.
- **Reproducing photographic lighting/gradients** → banned APIs and the wrong aesthetic. Depth comes from stepped ramps (+ dithering, cartoon style only).
- **Keeping the source's background** → default is transparent; backgrounds only when the asset type is a background/tile or the user asks.
- **Trying to keep every detail at a small grid** → the detail budget shrinks with grid size; anchors survive, everything else simplifies (analysis.md).
- **Non-integer scale between logical grid and output size** → blurry or seamed pixels. Output = grid × whole number, always.
- **SVG rasterized at its intrinsic size when a different output was wanted** → set `width`/`height` attributes explicitly, and pass `-w`/`-h` to the rasterizer when it supports it.
- **Delivering before the user has seen the render** → preview → approve → deliver. Saving into the project is the *last* step.
