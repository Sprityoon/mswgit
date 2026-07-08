# Preset library — start every drawing from measured ground

A preset is the distilled technique of strong pixel art for one asset type × density: concrete palette ramps (hex), proportion and canvas numbers, technique parameters (outline treatment, AA budget, cluster idioms), and small `.pxg` fragments showing the idioms. Starting from a preset is what keeps quality consistent across assets and sessions — improvised palettes and proportions drift.

**The re-hue rule** — presets provide *structure*, the source provides *identity*: keep each ramp's **value spacing and saturation curve**, but replace its hue with the subject's colors from the Conversion Brief. A 5-step ramp stays a 5-step ramp; red cloth becomes green cloth by rotating hue, not by inventing new value steps.

## Selection table

| Slots (type × style × density) | Preset |
|---|---|
| Character/NPC × cartoon × chunky | [character-cartoon-64.md](character-cartoon-64.md) |
| Character/NPC × cartoon × hi-res | [character-hires-160.md](character-hires-160.md) |
| Monster (small/mob) × cartoon × chunky | [monster-cartoon-48.md](monster-cartoon-48.md) |
| Monster (large/boss) × cartoon × hi-res | [monster-hires-200.md](monster-hires-200.md) |
| Icon/item × retro (any density) | [icon-retro.md](icon-retro.md) |
| Tile / background prop (any style) | [tile-and-background.md](tile-and-background.md) |

Nearest-match rule: an in-between request (e.g. hi-res icon, chunky boss) starts from the nearest preset and adjusts its numbers using the size/density tables in SKILL.md — note the adjustment in the locked spec line.

## Preset anatomy

Each preset file contains: **Use for** (when it applies) / **Canvas & composition numbers** / **Palette ramps** (concrete hex, to be re-hued) / **Technique parameters** / **Idiom fragments** (small .pxg or grid excerpts) / **Checklist** (what the self-critique loop should verify for this asset type).

## Authoring new presets from inspiration material

When the user provides inspiration sprites (a folder, project assets, images they like), distill a new preset instead of relying on the seeds:

1. `python scripts/pixeltool.py analyze <img>` on each — collect logical size, detected upscale (density!), palette clusters, ramps, outline stats (pure-black share ≈ retro; colored dark ≈ selout/cartoon).
2. `python scripts/pixeltool.py grid <img> --detect-scale` on the 1–2 best exemplars — read the .pxg to study cluster shapes, AA placement, and staircase rhythm directly in text.
3. Aggregate: median logical size, ramp depth (steps per surface), outline treatment, AA frequency, dither presence, proportion measurements (head/body from the grid).
4. Write a new preset file in this folder following the anatomy above; add it to the selection table. Parameters only — never copy third-party sprite images into the skill.
5. Prefer the new preset over seeds for that project from then on.

Seed presets below were authored from general pixel-art knowledge; a preset measured from the user's actual target look always beats them.
