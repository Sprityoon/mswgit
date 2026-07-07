# Elicitation — asking the user the right questions

This skill was explicitly designed to **ask instead of guess**. A wrong guess on asset type or view costs a full redraw; one round of questions costs seconds. But over-asking is also a failure — asking about things the user already said, or things with obvious defaults, trains the user to ignore the questions.

## The five spec slots

| # | Slot | Decides | Default (if user says "알아서") | Ask when |
|:-:|---|---|---|---|
| 1 | **Asset type** — character/monster sprite, NPC, item icon, tile, background prop, UI icon | Composition recipe, size default, style default | Judged from subject (creature → sprite, object → icon) | The request doesn't name a use ("이거 픽셀로 바꿔줘" alone) |
| 2 | **Style / concept** — `chunky` (retro 8-bit) vs `maple` (cartoon), plus mood keywords | Which painter style reference governs the redraw | Painter defaults: icon/tile → chunky, character/creature → maple | Source is a photo or detailed art and the user gave no style/mood words |
| 3 | **Composition / view** — front, side, ¾, top-down; full-body / bust; idle / action pose | The entire drawing plan; also the most expensive slot to get wrong | Side-view idle for sprites on MapleTile maps; centered for icons | Almost always for characters/monsters — the user must own this choice |
| 4 | **Size** | Output canvas + logical grid (painter size-guide) | Size-guide defaults (icon 64, character 128, tile 128) | Only if anchors don't fit the default (analysis.md detail budget) or asset is a tile/background |
| 5 | **Identity anchors** | What must survive from the source | Top 3–5 from analysis | Only if ambiguous — e.g. a logo with text (keep lettering?), multiple subjects in one image (which one?) |

Fill slots in this order: explicit user words → Conversion Brief inference → question. Only genuinely empty or ambiguous slots become questions.

## How to ask

**One `AskUserQuestion` call, up to 4 questions**, in the user's language. For each question:

- Put the recommended option **first**, labeled `(추천)`, and say *why* it's recommended in the description — grounded in the analysis: "원본이 측면 사진이라 측면 스프라이트가 가장 자연스럽습니다".
- Options must be concrete and mutually exclusive; 2–4 per question ("기타"는 자동 제공되므로 만들지 말 것).
- Use the description field to state consequences: "탑다운을 고르면 원본 구도에서 완전히 재해석됩니다".
- If slot 5 needs confirmation, fold it into an option description or a dedicated question: "유지할 특징: 주황 목도리, 뾰족머리, 안경 — 맞나요?"

### Example (character request, photo source, no style/view given)

```
Q1 [스타일] 어떤 픽셀 스타일로 그릴까요?
  - 메이플 카툰 (추천) — 캐릭터/몬스터에 적합한 SD 비율 + 부드러운 외곽선. 원본이 인물/생물이라 추천
  - 청키 레트로 — NES풍 8비트. 아이콘·타일 느낌이 필요할 때
Q2 [구도] 어떤 시점/구도로 그릴까요?
  - 측면 전신 대기 자세 (추천) — 사이드뷰 맵(MapleTile)에서 바로 쓰는 표준 구도
  - ¾ 정면 전신 — 원본 사진 구도와 가장 비슷하게 유지
  - 상반신 초상 — NPC 대화창/프로필용
Q3 [용도] 이 캐릭터를 어디에 쓸 예정인가요?
  - 맵에 배치할 스프라이트 (추천) — 128×128, 발이 바닥 기준선에 닿는 구도
  - 아이템/UI 아이콘 — 64×64, 중앙 배치 + 여백
```

## When to skip elicitation entirely

- Every slot is filled by the request ("이 사진을 메이플 스타일 측면 전신 128px 캐릭터 스프라이트로") → restate the locked spec in one line and draw.
- The user said "알아서 해줘" / is unavailable (autonomous run) → take the defaults column, **state them explicitly** before drawing so the user can course-correct on preview.
- Iteration feedback ("목도리를 더 크게") → change only that; never re-ask settled slots.

## Special cases

- **Multiple images attached** → first question is which is the *subject* and whether the others are *style references* ("이 그림체처럼") — a style reference overrides slot 2's default.
- **Logo/text in source** → always confirm whether lettering must survive (analysis.md anti-patterns); simplified 3–5px letterforms are possible at 64+ grids but dominate the pixel budget.
- **Large view-change delta on a complex subject** (front-only photo of an ornate character → side view) → warn in the option description that unseen parts will be invented; offer the source-preserving view as an alternative.
- **Requested size can't fit the anchors** → don't silently upsize; make size a question with the recommended larger option first.
