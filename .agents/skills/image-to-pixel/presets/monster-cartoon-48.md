# Preset: monster-cartoon-48 — chunky mob (slime-tier)

**Use for**: small field monsters, mascots, cute creatures at chunky density. Grid 48×48, output 2× (96 px).

## Canvas & composition numbers

- Grid **48×48**; baseline y=44–45 (mobs sit lower than characters — squat silhouette).
- Occupancy: 75–85% width, 60–75% height. **Width ≥ 1.2× height** for blob-type mobs — the squash is the cuteness.
- Face LOW on the body (eyes at ~55–65% height) and large: eyes 5–7px for a 48 grid.
- 2px clearance above for a bounce/squash animation frame later.

## Palette ramps (re-hue to the subject)

Body (6 levels incl. rim — the reference green):

| Role | Hex |
|---|---|
| Selout | `#2F5A2A` |
| Deep shadow | `#3F7A3A` |
| Shadow | `#5BA853` |
| **Base** | `#7BC96B` |
| Highlight | `#A5DC95` |
| Top highlight | `#D4F0C2` |
| Rim light (1px, dark side) | `#EAFADE` |

- Accent (horns/spots/shell — one contrast hue): `#4A2A66 / #6A3E8E / #9058C0 / #B98AE0`, selout `#331C48`.
- Ground shadow: 1 row-pair oval, `#1A122080` (50% alpha), width ≈ 60% of body.

## Technique parameters

- Selout everywhere; AA ≤1px per silhouette step; no dithering.
- Dome shading: concentric arcs hugging the top-left — highlight cluster offset toward the light, NOT centered. Gel/slime types get a 2–4px secondary window highlight near the top.
- Eyes: dark `#2D1A26` with 1–2px white; mouth tiny "v"/"w" or 1px line; optional 1px eyebrow tilt for personality (angry mob = inner tilt down).

## Idiom fragment — 14×9 dome shading (`O` selout, `d` deep, `s` shadow, `b` base, `h` highlight, `t` top, `r` rim)

```
....OOOOOO....
..OOhtthhbOO..
.OhtthhbbbsO..
OhtthbbbbssdO.
OhhhbbbbbssdOr
ObbbbbbbsssdOr
ObbbbbsssdddOr
.OssssdddddO.r
..OOOOOOOOO...
```

Note the highlight mass sits upper-left, bands drift with the dome curve, rim light hugs the lower-right silhouette.

## Checklist

- Squash ratio held (wider than tall for blob types)?
- Face low + large — reads cute at 1×?
- Highlight cluster offset to the light corner, not centered?
- Rim light on the shadow side only (1px, broken not solid)?
- Silhouette interesting at a glance (a bump, drip, horn — not a plain ellipse)?
