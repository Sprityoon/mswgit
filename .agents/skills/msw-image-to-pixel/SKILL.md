---
name: msw-image-to-pixel
description: "Convert a user-provided source image (photo, drawing, screenshot, logo, AI art) into pixel-game-ready art for MSW — a concept-driven REDRAW, not naive pixelation/downscaling. Use whenever the user attaches or points to an image file and wants it turned into a game asset: character / NPC / monster sprite, item icon, tile, background prop, or UI icon. Includes a built-in elicitation step that asks the user for concept, style, composition/view, and size BEFORE drawing. Triggers: '이 이미지를 픽셀로', '이 사진으로 캐릭터/스프라이트 만들어줘', '이 그림을 게임에 넣게 변환해줘', '이 로고를 아이콘으로', 'convert this image to pixel art', 'turn this photo into a sprite', 'pixelize this image', image attachment + game asset request. If there is NO source image, use msw-painter instead. If the user just wants an existing resource, use msw-search first."
---

# MSW Image-to-Pixel

Convert a **source image the user provides** into a pixel-art game asset that fits this MSW project, then (optionally) register it as a sprite resource to obtain an RUID.

**The one rule that defines this skill: never pixelate — reinterpret.** Mechanically downscaling or posterizing a photo produces a muddy, unreadable blob that clashes with every other sprite in the game. Instead, treat the source image as a *reference for identity* (what makes the subject recognizable) and **redraw the subject from scratch** on a pixel grid, in the style, composition, and size the user asked for. The source tells you *what* to draw; the user's concept tells you *how*.

This skill layers on top of `msw-painter`: painter owns the style rules, the PNG renderer, and the upload pipeline; this skill owns everything that happens *before* drawing (analysis, elicitation, composition planning) and the fidelity check *after* rendering.

---

## When to invoke

| Situation | Action |
|-----------|--------|
| User attached / referenced an image AND wants it in the game (sprite, icon, tile, …) | **This skill** |
| User wants a sprite but has NO source image | `msw-painter` |
| User wants "a slime sprite" that any existing resource could satisfy | `msw-search` first |
| User wants to re-style an image for non-game use (wallpaper, profile pic) | This skill still applies, but skip the upload step |

---

## Workflow

| Step | What | Reference |
|:-:|---|---|
| 1 | **Locate & Read the source image** | below |
| 2 | **Analyze** → write a Conversion Brief | [references/analysis.md](references/analysis.md) |
| 3 | **Elicit missing specs** from the user (one `AskUserQuestion` call) | [references/elicitation.md](references/elicitation.md) |
| 4 | **Plan composition** for the target asset type & view | [references/composition.md](references/composition.md) |
| 5 | **Redraw** per painter style rules (chunky / maple) | `../msw-painter/references/style-*.md`, `size-guide.md` |
| 6 | **Render → self-check → show the user → iterate** | below |
| 7 | **Upload** (only when the asset is approved / requested) | `../msw-painter/SKILL.md` §5 two-step pattern |

### Step 1 — Locate & Read the source image

- Image pasted into chat → it is already visible in context; use it directly.
- File path given → `Read` it (Read renders images visually).
- Multiple images → confirm which one is the source (or whether they are style reference vs subject reference — see elicitation).
- No image found anywhere → this skill does not apply; hand off to `msw-painter`.

### Step 2 — Analyze

Read [references/analysis.md](references/analysis.md) and produce a **Conversion Brief** in the transcript *before* asking questions or drawing. The brief pins down: subject, 3–5 identity anchors, source palette → target ramps, source composition vs target composition, and what must be re-imagined. Writing it first matters for two reasons: it gives the elicitation step image-informed context ("the source is a front-facing photo, so a side-view sprite means re-imagining the pose"), and it becomes the checklist the self-check in step 6 verifies against.

### Step 3 — Elicit

Read [references/elicitation.md](references/elicitation.md). The spec has five slots — **asset type, style/concept, composition/view, size, identity anchors**. Fill every slot you can from the user's request and the brief; ask about the rest in **one** `AskUserQuestion` call (≤4 questions), with a recommended default as the first option of each. The user explicitly designed this skill to ask rather than guess — composition especially must be *the user's* choice, because a wrong view means a full redraw. If the user says "알아서 해줘" or is unavailable, proceed with the recommended defaults and state them explicitly in the final report.

### Step 4 — Plan composition

Read [references/composition.md](references/composition.md) and pick the recipe for the chosen asset type + view. This is where "구도가 요구하는 대로 명확해야 한다" is enforced: feet-on-baseline for characters, centered-with-padding for icons, edge-to-edge seamless for tiles, and explicit view conversion (front photo → side-view sprite = re-pose from anchors, never trace).

### Step 5 — Redraw

Follow the chosen style's rules **exactly as written in msw-painter**:

- `chunky` → `../msw-painter/references/style-chunky-pixel.md`
- `maple` → `../msw-painter/references/style-maple-cartoon.md`
- Working grid & output size → `../msw-painter/references/size-guide.md`

All painter bans still apply (no curve APIs, no gradients, no blur, no fractional coordinates; chunky = zero AA, maple = selout + silhouette-only AA). Colors come from the **target ramps in the Conversion Brief** — quantized and style-shifted, never sampled raw from the photo.

### Step 6 — Render, self-check, show, iterate

Render with painter's renderer (one-time `npm ci` in `.claude/skills/msw-painter/scripts` if puppeteer is missing):

```bash
node .claude/skills/msw-painter/scripts/render.cjs --type <svg|canvas|html> --in <code-file> --out <out.png> --width <W> --height <H>
```

Write working files (drawing code, PNG) to the session scratchpad directory, not the project tree.

Then **Read the output PNG** and check it against the Conversion Brief before showing the user:

1. Composition matches the requested view/layout (not the source's)?
2. All identity anchors visible and recognizable?
3. Silhouette readable at 100% scale (squint test)?
4. Style rules honored (chunky: sharp edges, no AA / maple: selout, no black outline)?
5. Background transparent, canvas fully used (no content stuck in the top-left corner)?

Show the PNG to the user and invite corrections. On feedback, update only the affected part of the brief and redraw — don't re-run the full elicitation for a tweak.

### Step 7 — Upload (optional)

Only after the user approves the art (or asked for an RUID upfront), follow the **two-step upload pattern in `../msw-painter/SKILL.md` §5** verbatim — including its presigned-URL security rules (env-var PUT, never echo the URL). Deliverable is the sprite RUID.

---

## Report format

```
RUID: <RUID, or "미업로드 (미리보기만)">
Style: <chunky | maple> / Size: <W×H> / View: <composition>
Source: <one-line description of the original image>
Kept: <identity anchors that survived>
Reinterpreted: <what was changed from the source and why>
```

Entity placement, scripting, and UI wiring are out of scope — hand off to the relevant skill.

---

## Common pitfalls

- **Sampling colors straight from a photo** → muddy, desaturated sprite that matches nothing in-game. Always quantize into style ramps (analysis.md).
- **Tracing the source composition when the user asked for a different view** → the #1 failure mode. A front-facing photo cannot be traced into a side-view sprite; re-pose from identity anchors (composition.md).
- **Skipping elicitation because the request "seems obvious"** → wrong asset type or view = full redraw. One question round is cheaper.
- **Asking about slots the user already answered** → noise. Fill from the request first; ask only about genuinely empty slots.
- **Reproducing photographic lighting/gradients** → banned APIs and wrong aesthetic. Depth comes from stepped ramps (+ dithering in maple only).
- **Keeping the source's background** → default is transparent; backgrounds only when the asset type is a background/tile or the user asks.
- **Trying to keep every detail at a small grid** → detail budget shrinks with grid size; anchors survive, everything else simplifies (analysis.md §detail budget).
- **Uploading before the user has seen the render** → preview → approve → upload. The upload is the *last* step.
- All of `msw-painter`'s pitfalls (blank canvas, top-left-corner bug, `npm ci`, presigned-URL handling) apply unchanged.
