---
name: image-to-pixel
description: "Convert a user-provided source image (photo, drawing, screenshot, logo, AI art) into pixel-game-ready art — a concept-driven REDRAW, not naive pixelation/downscaling. Engine-agnostic: works for any pixel/retro game project and any AI coding agent. Use whenever the user attaches or points to an image and wants it turned into a game asset: character / NPC / monster sprite, item icon, tile, background prop, or UI icon. Also applies when the source is given as a platform asset identifier (asset ID / RUID) the agent can resolve to an image via platform tools. Supports both chunky low-res (upscaled dots) and high-resolution 1:1 pixel densities (100–300px+ sprites, modern 2D-game look), drawing from a bundled preset library (palettes, proportions, technique parameters) in a text-grid medium with a mandatory self-critique loop. Triggers: '이 이미지를 픽셀로', '이 사진으로 캐릭터/스프라이트 만들어줘', '이 그림을 게임에 넣게 변환해줘', '이 로고를 아이콘으로', 'convert this image to pixel art', 'turn this photo into a sprite', 'pixelize this image', 'make a game sprite from this picture', image attachment + game asset request."
---

# Image-to-Pixel

Convert a **source image the user provides** into a pixel-art game asset, in the style, composition, and size the user asks for. The deliverable is a PNG plus its `.pxg` source — engine integration is out of scope, so the result works for any game project.

**The one rule that defines this skill: never pixelate — reinterpret.** Mechanically downscaling or posterizing a photo produces a muddy, unreadable blob that clashes with every hand-made sprite around it. Treat the source image as a *reference for identity* (what makes the subject recognizable) and **redraw the subject from scratch** on a pixel grid. The source tells you *what* to draw; the user's concept tells you *how*.

**How quality is produced** — three mechanisms, all mandatory:

1. **Presets, not improvisation** ([presets/index.md](presets/index.md)) — every drawing starts from a preset: concrete palette ramps, proportion numbers, and technique parameters distilled from strong pixel art, per asset type × density.
2. **Text-grid medium** ([references/pxg-format.md](references/pxg-format.md)) — draw in `.pxg`, where one character = one pixel and the sprite is visible in the text while you draw. Never draw in SVG/vector shapes: shape-thinking produces "vector art snapped to a grid", which is exactly the alien, low-quality look this skill exists to avoid.
3. **Self-critique loop** — render, view, critique against the brief, edit, re-render; minimum 2 rounds before the user sees anything.

**Agent portability.** Assumed capabilities, phrased generically: *view an image*, *ask the user* (structured question UI if available, else numbered list in chat), *run a shell command* (Python 3 for the bundled `scripts/pixeltool.py`, stdlib only — no installs; if no Python exists, port its trivial render loop to any available runtime).

---

## When to apply

| Situation | Action |
|-----------|--------|
| User attached / referenced an image AND wants it as game art (sprite, icon, tile, …) | **This skill** |
| User wants pixel art but has NO source image | Out of scope as a conversion — but the presets + style references still govern from-scratch drawing (or hand off to a dedicated painter skill if the project has one) |
| User wants to re-style an image for non-game use (avatar, emote, wallpaper) | This skill still applies; only the composition recipe changes |

---

## Workflow

| Step | What | Reference |
|:-:|---|---|
| 1 | **Locate & view the source image** | below |
| 2 | **Analyze** → write a Conversion Brief | [references/analysis.md](references/analysis.md) |
| 3 | **Elicit missing specs** from the user (one question round) | [references/elicitation.md](references/elicitation.md) |
| 4 | **Pick the preset + plan composition** | [presets/index.md](presets/index.md), [references/composition.md](references/composition.md) |
| 5 | **Draw in .pxg** per preset + style rules | [references/pxg-format.md](references/pxg-format.md), [references/style-retro.md](references/style-retro.md) / [references/style-cartoon.md](references/style-cartoon.md) |
| 6 | **Render → self-critique loop → show the user → iterate** | [references/pxg-format.md](references/pxg-format.md) §self-critique |
| 7 | **Deliver** the PNG + .pxg where the user wants them | below |

### Step 1 — Locate & view the source image

- Image pasted into chat → it is already visible; use it directly.
- File path given → open/view it with the agent's image-reading capability.
- **Platform resource identifier given instead of a file** (an asset ID / RUID / asset-store URL from a game platform) → resolve it to an image first using that platform's available tools: a thumbnail or metadata API, downloading the returned URL, or rendering the asset in the platform's editor and screenshotting it. Save the result as a local image and use it as the source. A thumbnail-quality source is fine — this skill redraws from identity anchors; it doesn't trace pixels. If no available tool can resolve the identifier, say so instead of guessing what the asset looks like.
- Multiple images → confirm which is the *subject* and whether others are *style references* (see elicitation).
- No image found anywhere → this is not a conversion task; say so instead of guessing.

### Step 2 — Analyze

Read [references/analysis.md](references/analysis.md) and write a **Conversion Brief** in the conversation *before* asking questions or drawing. The brief pins down: subject, 3–5 identity anchors, source palette → target ramps, source composition vs target composition, and what must be re-imagined. It gives elicitation image-informed context, and it is the checklist the self-critique loop verifies against. `analyze`-ing the source with pixeltool (`python scripts/pixeltool.py analyze source.png`) gives objective palette data to quantize from.

### Step 3 — Elicit

Read [references/elicitation.md](references/elicitation.md). The spec has five slots — **asset type, style/concept, composition/view, size & pixel density, identity anchors**. Fill every slot you can from the user's request and the brief; ask about the rest in **one** question round (≤4 questions), recommended default first. Composition especially must be *the user's* choice — a wrong view means a full redraw. If the user says "just decide" / "알아서 해줘" or is unavailable, proceed with the recommended defaults and state them explicitly before drawing.

### Step 4 — Pick the preset + plan composition

Map the locked slots to a preset via [presets/index.md](presets/index.md) — the preset supplies palette ramps, proportions, and technique parameters, which the brief's target ramps then *re-hue* to the subject's colors (structure from the preset, identity from the source). If inspiration images are available (user-provided or project sprites), run `pixeltool analyze` on them and prefer their measured palette/ramp data over the preset's defaults — and consider authoring a new preset (see index.md §authoring).

Then read [references/composition.md](references/composition.md), pick the recipe for asset type + view, and state it as a **numeric composition contract** before drawing (`구도: 측면 전신, 왼쪽 향함 | baseline-gap 2..4, height-occ 0.82..0.92, center-x ±2`). The numbers are enforced with `pixeltool check` at the silhouette-pass gate and at every render; the view itself is verified against composition.md's facing-cues table.

**Size & density defaults** (when the user doesn't specify):

| Use | Chunky output (retro grid / cartoon grid) | Hi-res 1:1 grid = output (cartoon only) |
|---|---|---|
| Icon / button | 48–64 px (16 / 24–32) | 64–128 px |
| Character / item / NPC / monster | 96–128 px (16–32 / 48–64) | 128–300 px |
| Tile / floor / block | 64–128 px (16–32 / 32–64) | 128–256 px |
| Background / large object | 256 px+ (32–64 / 128) | 512 px+ (only on request) |

Match the density of the project's existing sprites when visible — one chunky sprite in a hi-res game (or vice versa) sticks out more than any color mismatch.

### Step 5 — Draw in .pxg

Read [references/pxg-format.md](references/pxg-format.md) and draw in **passes**: silhouette → surfaces → shading → outline/detail, rendering between passes. Style rules come from [references/style-retro.md](references/style-retro.md) or [references/style-cartoon.md](references/style-cartoon.md); concrete numbers come from the preset. Grid strategy: hand-write ≤48 grids; generate the first pass programmatically for 96+ / hi-res grids, then refine by hand (pxg-format.md §grid size strategy).

### Step 6 — Render, self-critique, show, iterate

```bash
python scripts/pixeltool.py render sprite.pxg -o out.png --preview 4
python scripts/pixeltool.py check sprite.pxg --baseline 2..4 --height-occ 0.82..0.92 --center-x 2   # the contract numbers
```

Run the **self-critique loop** from pxg-format.md: view the preview, check the 7-point list (squint test, composition contract via `check` + facing cues, anchors, banding, mush, orphans, style compliance), edit the .pxg, re-render. **Minimum 2 rounds; never show the user a first render.** Work in a temp/working directory until approved.

Then show the result and invite corrections. On feedback, update only the affected region/pass — don't re-run elicitation for a tweak.

**Optional accelerator**: if the agent has an image-generation tool, the intermediate-generation path in [references/imagegen-path.md](references/imagegen-path.md) can produce the first-pass .pxg (especially valuable at hi-res); the cleanup and critique loop stay identical.

### Step 7 — Deliver

Save the approved PNG **and its .pxg source** (the editable master — future edits start from it) to the path the user names, or ask where if the project has an obvious asset convention. If the project has its own asset-registration pipeline (engine importer, upload skill), hand off there — registering assets is outside this skill.

---

## Report format

```
Output: <png path> (+ <pxg path>)
Preset: <preset id> / Style: <retro | cartoon> / Size: <W×H> (grid <G×G>, density <chunky ×N | hi-res 1:1>) / View: <composition>
Source: <one-line description of the original image>
Kept: <identity anchors that survived>
Reinterpreted: <what was changed from the source and why>
Critique rounds: <N>
```

---

## Common pitfalls

- **Drawing in SVG/vector shapes "just this once"** → shape-thinking is the root cause of the alien look. The .pxg medium is not optional.
- **Skipping the preset and improvising a palette** → inconsistent results between assets. Start from the preset; re-hue to the subject.
- **Sampling colors straight from a photo** → lighting-contaminated mud. Quantize + style-shift into ramps (analysis.md).
- **Tracing the source composition when the user asked for a different view** → re-pose from identity anchors (composition.md); never trace.
- **Composition verified only at the end** → the gate lives at the silhouette pass: contract numbers via `pixeltool check` + facing cues, before any surface/shading work. A composition FAIL discovered after shading means the gate was skipped.
- **Showing the user the first render** → the loop exists because first renders are always fixable. Two rounds minimum.
- **Delivering the @Nx preview as the asset** → the deliverable is the 1:1 render (chunky output = logical grid × its intended scale, produced by rendering at that scale — still not the critique preview).
- **Skipping elicitation because the request "seems obvious"** / **asking about slots already answered** → one round, only for empty slots.
- **Keeping the source's background** → transparent by default; backgrounds only for background/tile assets or on request.
- **Density mismatch with neighboring assets** → check existing project sprites before defaulting.
- **Hand-enumerating a 200×200 grid character by character** → generate the first pass programmatically, refine by hand (pxg-format.md).
- **Patching the same defect twice** → the error is one pass earlier (wrong silhouette can't be fixed with shading); redo that pass.
