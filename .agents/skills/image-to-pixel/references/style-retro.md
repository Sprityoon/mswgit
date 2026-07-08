# Style: Retro (8/16-bit)

One of the two style options. Choose retro for **icons, buttons, tiles, blocks, simple props, and any sprite that should read as classic 8/16-bit console art**. For characters and creatures that should feel soft or illustrated, prefer [style-cartoon.md](style-cartoon.md).

Retro emphasizes **large, clearly visible dots** with a minimal palette. Each pixel is a deliberate design element.

## Core principles

- **Zero anti-aliasing** — sharp pixel edges everywhere. No intermediate-color "soft" pixels, not even hand-placed ones. (If you want soft edges, that's the cartoon style.)
- **Restricted palette** — as few colors as possible. Depth comes from stepped solid shading, 2–4 levels per surface, never gradients.
- **Grid alignment** — every element snaps to the logical pixel grid. No fractional coordinates.
- **Small logical grid, upscaled output** — draw on 16×16 or 32×32 and scale up by a whole number (see the size table in SKILL.md). Big pixels ARE the aesthetic.
- **Black or white 1px outline** is acceptable and idiomatic.

## Shading recipe

- Base color + 1–2 darker steps + 1–2 lighter steps per surface (2–4 levels total).
- Key light at the upper-left → shadows lower-right, highlights upper-left.
- Make shadow colors by lowering lightness (and slightly the saturation) of the base; paint them in consistent 1–2px bands.

Example — a blue slime with base `#4A90D9`:
- Shadow `#2E5C8A` / Base `#4A90D9` / Highlight `#7FB5E8` / Outline `#1A3A5C` or white

## Implementation

Draw in the `.pxg` text grid ([pxg-format.md](pxg-format.md)) — one character per pixel, so the sprite is visible in the text while you draw:

```
PXG 1
size 8 8
. transparent
O #1A3A5C
b #4A90D9
h #7FB5E8
grid
..OOOO..
.ObhhbO.
ObhbbbbO
ObbbbbbO
ObbbbbbO
ObbbbbbO
.ObbbbO.
..OOOO..
```

Render with `python scripts/pixeltool.py render sprite.pxg --preview 4`. Concrete palettes and canvas numbers come from the matching preset ([presets/index.md](../presets/index.md)).

## Forbidden

- Anti-aliasing of any kind, including manual intermediate-color edge pixels.
- Curve/gradient/blur primitives in any first-pass generator script — every cell is a discrete palette color, placed deliberately; round shapes are stepped dot by dot.
- Dithering — that's a cartoon-style tool; retro surfaces stay flat.

## Round shapes by hand

Place dots along a midpoint-circle pattern. An 8×8 circle:

```
. . # # # # . .
. # . . . . # .
# . . . . . . #
# . . . . . . #
# . . . . . . #
# . . . . . . #
. # . . . . # .
. . # # # # . .
```

Each `#` is one 1×1 rect. Diagonals move at most 1 cell per row — consistent step rhythm is what makes hand-placed curves look intentional.
