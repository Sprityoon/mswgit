# Preset: icon-retro — item / UI icons (16 & 32 grid)

**Use for**: inventory items, UI buttons, pickups, emotes. Retro style, chunky density. Grid 16×16 (output 48–64) or 32×32 (output 64–128).

## Canvas & composition numbers

- Subject fills **70–80%**, centered with 1–2px bottom-weight; padding never < 1px (16) / 2px (32).
- One reading angle per object type: sword/tools diagonal ↗ (hilt lower-left), potions/bottles upright, coins/rings face-on with 1px edge, food ¾ top, books face-on tilted 1–2px.
- The 1× render must read in an inventory slot — critique at 1× first, THEN the preview.

## Palette rules

- ≤ 4 colors per surface, ≤ 12 total (16-grid: aim for 6–8).
- Outline: hard near-black `#101018` (or white `#F0F0F8` on dark UI) — retro icons want the sticker look; selout is for the cartoon style.
- Zero AA, zero dithering. Every edge a hard step.

## Ramps (re-hue to the subject)

| Material | Dark | Base | Light | Extra |
|---|---|---|---|---|
| Gold/metal | `#7A4A10` | `#C8861E` | `#F2B93C` | spark `#FFE08A` |
| Steel | `#3A4454` | `#7A8AA0` | `#B8C4D4` | spark `#F0F4FA` |
| Potion liquid (red) | `#6E1420` | `#B02438` | `#E85060` | glass rim `#C8E8F4` |
| Wood | `#4A2E1A` | `#7A5230` | `#A87848` | — |
| Gem (green) | `#0E5C34` | `#1E9A56` | `#48D488` | spark `#C8FAD8` |

Specular discipline: metal/gems get exactly **one** 1–2px spark cluster, upper-left. Two sparks = noise.

## Complete example — 16×16 sword icon

```
PXG 1
size 16 16
. transparent
O #101018
s #3A4454
m #7A8AA0
l #B8C4D4
w #F0F4FA
g #7A4A10
b #C8861E
y #F2B93C
grid
................
............OO..
...........OllO.
..........OllmO.
.........OllmsO.
........OllmsO..
.......OllmsO...
..OO..OllmsO....
.OyyOOllmsO.....
.OybOlmsO.......
..OybOsO........
...OybOO........
...OOybbO.......
..OgO.ObbO......
..OO...OOO......
................
```

Verify: `python scripts/pixeltool.py check sword.pxg --margin-min 1 --width-occ 0.7..0.9` — all icons must pass `--margin-min` before delivery.

Blade = 3-step steel ramp read along the edge; `w` spark omitted here — add one 2px spark at the blade tip for an enchanted variant. Guard and pommel in gold ramp; the diagonal keeps a strict 1-cell staircase.

## Checklist

- Reads at 1× in a 1-slot mockup (drop it on a 20% gray square and look)?
- Outline unbroken around the full silhouette?
- ≤ 12 colors, one spark max?
- Diagonal edges keep a consistent staircase (no 2-then-1-then-3 wobble)?
