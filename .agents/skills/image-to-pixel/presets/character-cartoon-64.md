# Preset: character-cartoon-64 — chunky cartoon character / NPC

**Use for**: humanoid characters and NPCs at chunky density, cartoon style. Grid 48–64, output 2× (96–128 px).

## Canvas & composition numbers

- Grid **64×64** (small NPC: 48×48), render `--preview 4` for critique, deliver at final scale.
- Baseline: feet rows at y=59–60, selout closes at y=61, 2px empty below.
- Occupancy: 80–90% height; headroom 3–5 rows for hair/hat spikes.
- Proportion (2.5-head chibi): head ≈ 26 rows (incl. hair), torso ≈ 18, legs ≈ 20. Head width ≈ 24–28 cols — wider than the torso (≈ 16–20).
- Side view faces **left**; single eye visible; muzzle/nose line at the head's left edge.

## Palette ramps (re-hue to the subject)

| Surface | Selout | Shade | Base | Light | Extra |
|---|---|---|---|---|---|
| Skin | `#8B5A3C` | `#D89A72` | `#F6C8A0` | `#FFE2C8` | blush `#F4A8B8` |
| Hair (brown) | `#4A3018` | `#6E4A2F` | `#8A5E3B` | `#A97C50` | hi `#C79A6B` |
| Hair (black-blue) | `#14141E` | `#2A2A3E` | `#3D3D5C` | `#565678` | hi `#7A7AA0` |
| Hair (blonde) | `#8A6224` | `#C9973F` | `#E8BC6A` | `#F7DFA0` | — |
| Cloth A (red) | `#571310` | `#8A231E` | `#C8362E` | `#E0625A` | — |
| Cloth B (blue) | `#1C3050` | `#2E4E7E` | `#4A78B4` | `#7BA5D6` | — |
| Leather/shoes | `#241811` | `#3A2A20` | `#55402F` | `#75593F` | — |

3–4 working levels per surface at this grid; the ramp rows above are the pool, not a quota.

## Technique parameters

- Outline: full selout, 1px, per-surface color; darker selout wins at surface junctions.
- AA: ≤1 px per silhouette step, silhouette only. No dithering at this grid.
- Light upper-left; shading bands 2–3 px, following form (drift the band boundary 1 cell every 1–2 rows on curves).
- Face: eye 4–5 px wide × 4 px tall, upper third; 1px white highlight upper-left in the iris; mouth 2–3 px; blush 2×1 under the eye.

## Idiom fragments

Eye (5×4; `O` lash/outline, `w` white highlight, `i` iris base, `d` iris shade):

```
OOOO.
OwiiO
OiddO
.OOO.
```

Head-top staircase with AA (`O` selout, `a` AA mix of selout+hair base, `h` hair):

```
....aOOOOa....
..aOhhhhhhOa..
.Ohhhhhhhhhh0.
```

Hair lock over forehead (`b` hair base, `s` hair shade — the shade line traces the lock's curve, not a straight row):

```
bbbbsbb
bbbsbbb
bbsbbbb
```

## Checklist (add to the self-critique loop)

- Head reads bigger than torso (chibi ratio held)?
- Eye placed in the upper third, highlight present?
- Feet on the baseline row, both legs distinguishable (1px gap or value difference)?
- Arms visible against the torso silhouette?
- No pure black anywhere — all outlines selout?
