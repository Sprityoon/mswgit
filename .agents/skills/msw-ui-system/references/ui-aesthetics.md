# UI Aesthetics — Making MSW UI Look Designed, Not Just Functional

The other references in this skill make UI *correct* (anchors resolve, components bind, nothing overlaps). This document makes UI *look good*. Read it **before choosing any color, background, font size, or padding**, and run the self-review rubric (§7) **before delivering any UI** — a UI that passes lint and preview but fails the rubric is not done.

Why this document exists: without explicit aesthetic direction, generated UI converges on one look — a flat dark rectangle, centered white text, default gray buttons. Players read that as "placeholder", not "game". MSW is a game platform; UI is part of the game's art. The goal of every rule here is to make a screen a player would believe shipped with a finished game.

---

## 0. The failure mode: Gray Box Syndrome

You have Gray Box Syndrome when most of these are true:

- Every surface is a single flat hex-color rect (`#2C2C2C`, `#1A1A1A`, `#000000@0.7`) with no frame, texture, or border
- The title is just a bigger white string floating over the same flat background
- All buttons look identical regardless of role (confirm = cancel = close)
- Everything is centered; text sits at uniform sizes (24/28) with no visual hierarchy
- Zero icons, zero dividers, zero decorative elements

Each item alone is sometimes fine (a chat log can be a translucent flat rect). All of them together is a wireframe. The recipes in `layout-recipes.md` are **structural wireframes on purpose** — they show geometry and component wiring. They are the *skeleton*; this document is the *skin*. Never ship a recipe's colors verbatim.

---

## 1. Pick a visual identity BEFORE building (not after)

Deciding colors while placing entities produces incoherent UI — each panel gets whatever hex value came to mind. Instead, spend one step up front locking a small identity, then build everything from it.

**Step 1 — Determine the style source** (same decision as `templates/templates.md` §Style-Source Decision):

1. User named a mood/reference → honor it.
2. Project already has styled UI → extract its identity (read 2–3 existing panels via `UIBuilder.read`, note frame RUIDs, accent color, title treatment) and match it.
3. Neither → pick one of the 4 template style bundles and use its `ruid-map.md` as the identity.

**Step 2 — Write down a token block** in your working notes and reuse it for every entity in the task:

```
IDENTITY
  frame       : <9-slice panel RUID or composite plan (§2)>
  header      : <title-bar RUID / accent-bar color>
  surface     : <panel base>        e.g. #2B2620  (never pure #000)
  surface-2   : <inner plate, one step lighter/darker> e.g. #3A332B
  border      : <thin line color>   e.g. #57493A
  accent      : <ONE accent>        e.g. #F0A830  (gold) — buttons, highlights, key numbers
  text-hi     : #F5EFE6   (titles, values)   — never pure #FFF
  text-body   : #C9C0B2   (body)
  text-dim    : #857D6F   (captions, locked)
  danger/ok   : #D9534F / #5CB85C   (only if the UI needs them)

RHYTHM
  unit        : 8px   — every margin/padding/gap is a multiple
  panel pad   : 24–32 from panel edge to content
  section gap : 16–24 between rows/sections
  type scale  : title 36–40 bold / section 26–28 / body 22–24 / caption 18–20
```

The specific values are examples — derive real ones from the chosen style. What is **not** negotiable: one accent color, no pure black/white, a single spacing unit, and a ≥3-tier type scale. A palette bigger than ~6 colors (excluding icon art) reads as noise.

---

## 2. Backgrounds & panel anatomy — the highest-leverage decision

The panel background is 70% of whether a UI looks finished. Selection order for any popup/window/HUD panel background:

1. **Style bundle frame RUID** (the style's `ruid-map.md`, "panel background" rows) — a 9-slice frame with drawn corners/borders instantly looks intentional. Set `ImageType: Sliced (1)` (see `component-api.md` — buttons/dialogs/panels should almost always be Sliced).
2. **`msw-search`** for a themed frame sprite (keywords: frame, panel, window, border, wood/metal/paper + UI) when the bundle has nothing matching the game's mood.
3. **`msw-painter`** — draw a custom 9-slice frame when the game has a strong theme no platform asset matches.
4. **Flat-color composite** — last resort, and only following the recipe below. A *single* flat rect is not an option for a primary panel.

**Flat-color composite recipe** (how to make color-only look designed when no RUID fits):

```
Panel
├─ Bg        stretch, surface, alpha 0.95–1.0        ← body (translucency ≤0.6 reads unfinished for windows)
├─ BgInner   stretch inset 6–8px, surface-2          ← layered depth: two surfaces one step apart
├─ TopBar    top-stretch, h 56–72, header color      ← header zone visually distinct from body
│   └─ or: AccentLine (h 3–4, accent) under the title instead of a full bar
└─ Border    4 thin edge strips OR a 1-step-lighter Bg behind at +2px  ← silhouette
```

Two surfaces + a distinct header zone + a visible edge — that minimal trio is what separates "designed" from "gray box".

**Panel anatomy** — every popup/window has three zones, whatever the style:

- **Header** (top, 56–88px): title (left-aligned or centered — pick per style and keep it), close button top-right, its own background treatment (bar RUID, accent underline, or darker strip).
- **Content** (middle): padded ≥24 from every panel edge; sections separated by dividers (1–2px `border`-color line) or `section gap` whitespace — pick one mechanism and use it consistently.
- **Footer** (bottom, only if there are actions): primary/secondary buttons, right-aligned or centered, 16–24 gap between them.

**Dimmer**: `#000` at alpha **0.55–0.65** with `raycast: true`. Below 0.5 the popup doesn't separate from the game; above 0.75 it feels like an error screen.

---

## 3. Color rules

- **One accent.** The accent marks "what matters": primary button, selected tab, key numbers (gold amount, damage). If everything is accented, nothing is.
- **Role-consistent buttons.** Confirm/primary uses accent or the style's confirm RUID; cancel/secondary uses a neutral; destructive uses danger. The same role must look the same in every popup of the project.
- **No pure `#000000` / `#FFFFFF`.** Shift toward the identity's temperature (warm brown-blacks for wood/cozy themes, blue-blacks for sci-fi). Pure values look like unstyled defaults.
- **Contrast**: body text vs its surface should be clearly readable at 22px (when unsure, lighten `text-body` or darken the surface); `text-dim` is for genuinely secondary info only.
- **States change more than one channel**: locked/disabled = dim color **+** `[잠김]`-style prefix or lock icon **+** non-accent background; selected = accent border or highlight RUID, not just a slightly different gray.

## 4. Typography hierarchy

A player should get the screen's structure from squinting — that comes from size + weight + color moving *together*:

- Title: top of the type scale, bold, `text-hi`.
- Section labels: mid scale, bold or accent-colored — visibly distinct from body.
- Body/list rows: body scale, `text-body`, **left-aligned** (`alignment: 3` middle-left) — centered multi-row lists are hard to scan; center only titles, buttons, and single-line notices.
- Numbers the player cares about (currency, counts, timers): `text-hi` or accent, one step larger or bold — the label stays quiet (`text-body`), the value pops. (Recipe 1's Score label/value pair shows the pattern.)

## 5. Spacing & alignment rhythm

- Every offset a multiple of the unit; when two paddings are "almost the same" (20 vs 24), make them the same.
- One left margin per panel: labels, rows, and section heads all start at the same x. Mixed indents read as sloppiness faster than any color mistake.
- Buttons in a row: identical size, gap 16–24, aligned as a group (the `pos = ±(margin + size/2)` formula from SKILL.md).
- Breathing room beats density: if a panel feels crowded, grow the panel or cut content — do not shrink paddings below the token.

## 6. Decoration minimums (and a ceiling)

Minimums — a delivered UI should have **all** of these:

- A framed or composite background on every primary panel (§2 — never a bare flat rect)
- A visually distinct header zone on every popup
- At least one accent-colored element marking the primary action or key info
- Icons where the platform gives them cheaply: currency icon next to gold amounts, lock icon on locked rows, close-X sprite instead of the letter "X" (style `ruid-map.md` → `msw-search` → `msw-painter`, same order as §2)
- Selected/hover/disabled visual states on interactive lists and tabs

Ceiling — at most ~2 decorative flourishes (corner ornament, pattern bar, glow) per screen, all from the same style family. Consistency with less decoration beats a collage of pretty-but-mismatched parts. When in doubt, remove.

---

## 7. Aesthetic self-review rubric — mandatory before delivery

After `write()` + lint + `preview_ui_layout.cjs`, audit the *actual built file* (read it back via `UIBuilder.read` / `.listEntities()` — audit what exists, not what you intended). Verdict each item PASS/FAIL:

| # | Check | How to verify from the built .ui |
|---|-------|----------------------------------|
| 1 | **No naked panels** — every primary panel bg has a frame RUID (Sliced) or the §2 composite (2 surfaces + header + edge) | List panel-role sprites: any with `ImageRUID = ""` **and** no sibling layering → FAIL |
| 2 | **Header zone** — every popup's title area is visually distinct (bar/underline/strip) | Popup roots without any header-zone entity → FAIL |
| 3 | **Palette discipline** — ≤6 UI colors, exactly one accent, no `#000000`/`#FFFFFF` fills | Collect all sprite/text colors; count distinct, check purity |
| 4 | **Type hierarchy** — ≥3 size tiers; title bold; lists left-aligned | Collect font sizes/alignments across text entities |
| 5 | **Rhythm** — paddings/gaps are unit multiples; content ≥24 from panel edges; equal gaps between button rows | Compare anchoredPositions/RectSizes against the token block |
| 6 | **Role & state distinction** — primary vs secondary buttons differ; locked/disabled rows differ by more than one channel | Compare button RUIDs/colors across roles and states |
| 7 | **Project consistency** — same accent, frame family, and title treatment as existing project UI | Diff identity tokens against 1–2 existing panels |
| 8 | **Accent economy** — accent appears on the primary action / key info and nowhere it doesn't mean something | Count accent-colored entities |

**Any FAIL → fix and re-audit before telling the user the UI is done.** Report the rubric result (one line per item is enough) in your completion summary so the user sees what standard was applied. If the user explicitly asked for a bare-bones/debug UI, note that and skip — this rubric is for player-facing UI.

---

## 8. Worked example — the same popup, wireframe vs designed

Recipe 2 (confirm popup) as generated vs after applying this document with style-1-black RUIDs:

| Element | Wireframe (recipe verbatim) | Designed |
|---|---|---|
| Backdrop | `#000` @ 0.6 | `#000` @ 0.6 (fine as-is) |
| Panel | one flat `#2C2C2C` rect | frame RUID `b94f57f5db1646998b726cee0aaefaac` (Sliced) — or composite: `#2B2620` + inner `#3A332B` inset 8 + top bar |
| Title | white 48 centered on flat bg | `text-hi` 40 bold on title-bar RUID `c2c6e3d00c4340ce97f91a50b7d89fb8`, close-X sprite `3fa84442296e4a59bcc5ed6e7ba632f6` top-right |
| Message | `#DDDDDD` 28 centered | `text-body` 24, width ≤ panel−64, line-height comfortable |
| Buttons | two identical default buttons | OK = confirm RUID `ebf5e286d16447ff8f01a44f009723e8`, Cancel = cancel RUID `ace4c89669454cc49e2750b5a1e0513a`, both 180×60, gap 20, bottom pad 32 |

Same entity tree, same bindings, ~10 extra builder lines — entirely different perceived quality. That delta is this document's job.
