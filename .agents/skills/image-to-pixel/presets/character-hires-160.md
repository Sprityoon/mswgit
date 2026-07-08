# Preset: character-hires-160 — high-resolution character / NPC (1:1)

**Use for**: characters at hi-res density — the modern high-fidelity 2D-game look where individual pixels are barely visible. Grid = output, 128–200 px (this preset's numbers are for 160).

## Canvas & composition numbers

- Grid **160×160** at 1:1. Critique with `render` at 1× plus `--crop` regions (face, hands) at `--preview 4`.
- Baseline: feet at y≈152, outline closes y≈154, 5px empty below.
- Proportion: **3.5-head** default (head ≈ 52, torso ≈ 46, legs ≈ 58) — cute but not toddler. 2.5-head on explicit "chibi" request; 4.5-head for a serious/tall look (confirm in elicitation).
- Side or ¾ view facing left; at this size ¾ is often better — it shows the face properly.

## Method (mandatory at this size)

**Thumbnail → upscale → detail.** Never start at 160:

1. Draw a **40×40 structure grid** by hand (silhouette + flat surfaces only). Critique the silhouette here — it's 16× cheaper to fix.
2. Scale ×4 programmatically (each cell → 4×4 block) emitting a 160 .pxg.
3. Detail passes on the 160 grid, region by region (`--crop` to inspect): smooth the ×4 staircases to 1px steps, then shading clusters, then outline, then face/anchors.

## Surface plan (write into the brief before drawing)

A humanoid at 160 needs **10–14 explicit surfaces**, each with its own ramp: hair-front / hair-back / hair-locks(2–3) / face / eyes / torso-cloth / sleeves / hands / belt-or-accent / legs / shoes / accessory(1–2). Fewer ⇒ flat; more ⇒ noise.

## Palette ramps (re-hue to the subject)

7-level cloth ramp (blue reference — copy the value spacing):

`#16243C → #1F3454 → #2C4A74 → #3E639A → #5580BC → #7AA2D8 → #A8C8EC`

- Skin (6 levels): `#7A4630 → #A86A48 → #D89A72 → #F6C8A0 → #FFE2C8 → #FFF2E0`
- Hair gets **per-lock ramps**: same 6 hues, but each lock uses a 3-level slice offset by position (top locks use the light half, under-locks the dark half).
- **Outline is ramped, not flat**: 1px selout whose color follows the light — darkest at the bottom/shadow side (`#10182A` for the blue cloth), lighter toward the top (`#2C4A74`). 2px only on silhouette stretches longer than ~24px.

## Technique parameters

- Shading in **organic clusters**, not bands: fold shadows on cloth are wedge clusters 3–8px wide tracing the fold line; hair shading follows each lock; straight parallel bands at this size read as banding artifacts.
- AA: 2–3 px per silhouette step; sparing interior AA at high-contrast junctions (hair over face, weapon over body).
- Dithering: allowed only on large flat fields ≥ 12×12 (cape interior), 2×2 checker between adjacent levels.
- Face at 160: eye ≈ 10–14 px tall — iris gets 3 colors + 2 highlights; eyebrow its own 1–2px line; mouth shaped (not a flat line); nose 1–2px shadow tick.
- Material contrast: metal = 4 widely-spaced levels + hard 2–3px specular; cloth = 6 close levels + fold wedges; leather = 5 levels + 1px edge highlight.

## Checklist

- Silhouette approved at thumbnail stage before any detail?
- Any ×4 block staircases left un-smoothed (blocky 4px steps on curves)?
- Every surface in the plan has ≥3 distinguishable values (squint: does the form roll)?
- Clusters follow form — no straight-band shading anywhere?
- Face survives the crop test (`--crop` face region at 4×: eyes aligned, highlights in, brows readable)?
