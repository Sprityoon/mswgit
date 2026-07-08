# Optional path: image-generation assisted first pass

**Only when the agent has an image-generation tool available.** This path replaces the *first-pass drawing* (steps 5's silhouette/surface passes) with a generated intermediate; everything else — brief, elicitation, preset, cleanup, self-critique loop — stays identical. Without an image tool, skip this file entirely; the manual .pxg path is the default and fully sufficient.

Why it helps: at hi-res (150px+), a generated intermediate supplies organic cluster shapes and material texture that are slow to invent pixel by pixel. At chunky grids (≤64) it usually does NOT help — generation artifacts dominate at small sizes and hand-drawing from the preset is both faster and cleaner.

## Pipeline

1. **Generate the intermediate** from the Conversion Brief — the prompt must encode the *locked spec*, not the source image's look:
   - subject + identity anchors (colors, features, accessories)
   - exact view/pose from the composition line ("full body side view facing left, idle stance")
   - style keywords from the preset ("cute cartoon game sprite, clean shapes, flat cel shading, plain solid background")
   - Ask for 2–4× the target size (e.g. 512 for a 160 target). Plain uniform background, single subject, full subject in frame.
2. **Quantize + downscale to .pxg**:
   ```bash
   python scripts/pixeltool.py pixelize gen.png --size 160 --colors 28 -o draft.pxg
   ```
   (`pixelize` = median-cut palette + dominant-color-per-cell downscale — deliberately not an averaging resize.)
3. **Repalette**: replace the quantized colors with the preset's ramp structure re-hued to the brief (edit the .pxg palette lines — the grid stays, the palette snaps to deliberate ramps). Merge near-duplicate keys.
4. **Cleanup passes** (this is where it becomes pixel art instead of a shrunken picture):
   - delete the background keys → transparent
   - orphan hunt; re-establish the outline (selout per style/preset — generated intermediates never have proper outlines)
   - rebuild the face/anchor details by hand (always mushy after downscale)
   - normalize staircases on the silhouette
5. **Self-critique loop as normal** — same 7-point checklist, same minimum 2 rounds.

## Honesty rules

- The generated image is an *intermediate*, not the deliverable — never ship it or its raw `pixelize` output. If cleanup is skipped, the result is exactly the "naive pixelation" this skill forbids.
- If generation can't match the composition line after 2 attempts (wrong view/pose), fall back to the manual path — do not adapt the spec to what the generator produced.
- The source image still rules identity: check anchors against the *source*, not against the generated intermediate.
