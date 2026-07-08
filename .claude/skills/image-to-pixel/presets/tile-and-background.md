# Preset: tile-and-background — tiles, platforms, background props

**Use for**: floor/platform tiles (side-view games), ground tiles (top-down), and background props. Source images here are usually *texture references* — extract hue and texture rhythm, not layout.

## A. Side-view platform tile (grass-top reference, 32×32)

Zones top to bottom:

| Zone | Rows | Colors |
|---|---|---|
| Grass rim (lit) | 0–1 | `#A5DC60` |
| Grass body | 2–8 | `#6BA83C` base, blade notches poking 1–2px up into transparent/rim |
| Grass→dirt transition | 9 | `#4A7028`, ragged (drift ±1 row) |
| Dirt body | 10–27 | `#8A5E3B` base + cluster stones `#75492C` / `#9C7048` |
| Bottom vignette | 28–31 | `#5C3A22` darkening downward |

- Edge blades: 3–5 grass notches along the top, asymmetric spacing (e.g. cols 3, 9, 18, 26 — never even).
- No outline on any canvas edge (tiles butt together).

## B. Top-down ground tile (32×32)

- Value range **narrow**: keep all colors within ±12 lightness of base — ground must not compete with characters standing on it.
- Grass: base `#5E9A48`, scatter 2–4px clusters `#527F3E` (shadow) and `#78B25C` (light), 4–8 clusters total.
- No directional light on ground tiles (top-down ground is lit flat); depth cues come from overlaid props, not the tile.

## C. Seamlessness (both tile types)

- Left column must continue the right column, top row the bottom row: when editing the .pxg, read column 1 and column 32 side by side.
- No cluster may touch two opposite edges in the same row/column band — it creates a visible repeating stripe.
- Clusters ≥ 3px apart; distribute by thirds (each third of the tile gets roughly equal cluster mass).
- Verify: render, then tile 3×3 mentally (or paste the PNG in a 3×3 grid via a quick script) and hunt for hot spots — one bright cluster repeating every 32px is the classic failure.

## D. Background prop (tree / sign / building)

- Same drawing rules as sprites BUT pushed back atmospherically: **desaturate 30–40%, shift hue 10–20° toward the sky color, halve the value contrast** relative to foreground ramps.
- Outline: soft dark (surface hue at −30% lightness), or none for the farthest layer — selout-crisp edges pull props into the foreground.
- Per parallax layer, repeat the push (far layer ≈ 2× the shift of the near layer).
- Foreground-prop exception: props characters stand next to (a signpost, a crate) use full foreground ramps + normal outline — they belong to the character layer, not the background.

## Checklist

- Tile: seams invisible in a 3×3 repeat? No even spacing / no hot spots?
- Tile: ground value range narrow enough that a character sprite pops on top of it?
- Prop: reads *behind* a character sprite placed in front (do the overlay test)?
- No outline on tile canvas edges?
