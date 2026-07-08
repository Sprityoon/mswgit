# Preset: monster-hires-200 — high-resolution large monster / boss (1:1)

**Use for**: large monsters and bosses at hi-res density. Grid = output, 180–300 px (numbers below for 200).

## Canvas & composition numbers

- Grid **200×200** (wide creatures: 240×180). Baseline y≈190; big monsters may overflow headroom intentionally (a boss should feel like it barely fits).
- Occupancy 85–95%. **Line of action first**: pick one dominant curve (lunging forward, coiled, towering) and hang the whole silhouette on it — a boss with no line of action is a stuffed toy.
- ¾ side view default; head offset from center; asymmetry is good (one raised claw, tilted horns).

## Method (mandatory)

Same as character-hires: **thumbnail → upscale → detail**. Structure grid **50×50**, silhouette + line of action approved there, ×4 upscale, then detail passes per surface region with `--crop` inspection.

## Surface plan (write into the brief)

8–15 surfaces, e.g. for a dragon-type: head / jaw / horns / neck / body-mass / belly-plates / near-foreleg / far-foreleg / claws / tail / wing-arm / wing-membrane / spines. **Far-side limbs use the dark half of their ramp only** — that one rule creates depth for free.

## Palette ramps (re-hue to the subject)

- Body scales (7 levels): `#0F3A38 → #14524E → #1E6E68 → #2E8A82 → #48A89E → #6EC4BA → #9EDED6`
- Bone/horn/claw (5): `#5C4A38 → #8A7050 → #B89A70 → #DCC49C → #F2E6D0`
- Membrane/soft tissue (5): `#4A1E30 → #6E2E48 → #92405E → #B0507A → #C87498`
- Belly plates (4): `#6E5A40 → #98805C → #C2A87E → #E0CCA4`
- Outline: ramped selout, **2px** on silhouette stretches > 24px, 1px elsewhere; darkest `#081E1C` under the jaw/belly, lighter `#1E6E68` along the lit spine.

## Technique parameters

- **Material contrast is the read**: scales = repeated 3–6px arc clusters following the spine curve (draw scale rows programmatically, then break uniformity by hand — perfect tiling reads fake); bone = long smooth ramps + hard 2px specular; membrane = translucent look via low-contrast ramp + visible "finger" bones in shadow color.
- Clusters over bands everywhere; fold/muscle wedges 4–10px.
- AA 2–3px per silhouette step; interior AA at horn-over-scale, claw-over-ground junctions.
- Dithering: only membrane interiors / large body masses ≥ 14×14.
- Eyes small relative to head (menace = small bright eye in large dark socket): 4–8px, one hot highlight `#FFF2C8`.

## Checklist

- Line of action visible in the pure silhouette (render silhouette-only pass and squint)?
- Far limbs darker across their whole ramp?
- Scale/fur texture broken up — no perfectly repeating region > ~30px?
- Materials distinguishable in grayscale (squint: bone ≠ scale ≠ membrane)?
- Boss reads at 25% zoom (the in-game camera distance)?
