# Content draft-generator

A tool for the content-quality gap `scripts/social/README.md` documents under
"Known limitations": `concept` and `fe-depth` Casey hints are boilerplate
across most live cases (`concept`/staff is identical in all 31), guarded at
cross-post time by `KNOWN_BOILERPLATE_HINTS` in `scripts/social/lib/
content.mjs` rather than fixed at the source.

This is the source fix — or rather, a **first-draft generator** for it.
Casey hints are short, voiced, specific lines; getting them right is a
writing task, and this site's stated brand value is no AI slop. So this
tool never publishes anything on its own. It drafts, a human reads every
line, and a separate explicit step applies only what's approved.

```
draft-boilerplate-fixes.mjs  →  review-drafts.mjs  →  apply-draft.mjs
      (calls Claude API)          (no API call)         (no API call)
   writes drafts/<slug>.json    writes drafts/REVIEW.md   patches the real casey.json
```

## Why this can be good, not just fast

`concept`/`fe-depth` hints are boilerplate, but the chapters themselves
aren't — `index.njk`'s actual per-tone chapter prose for every live case is
case-specific and well-written (0 duplicates, same as `hook`/`demo`). The
generator's real job is narrower than "invent content from a title": it
reads that real prose per tone plus the case's own real hook/demo hints,
and drafts a short Casey line that's actually grounded in what the chapter
already says — not a generic gloss on the case's topic.

## Setup

```bash
export ANTHROPIC_API_KEY=...   # console.anthropic.com/settings/keys
```

Or drop it in `scripts/social/.env` (shared with the social scripts, same
gitignored file, same "CI should use real secrets, not this file" caveat).

## Usage

```bash
# See exactly what would be sent, no API call, no cost:
DRY_RUN=1 node scripts/content/draft-boilerplate-fixes.mjs --slug=hydration-two-trees

# Draft one case for real:
node scripts/content/draft-boilerplate-fixes.mjs --slug=hydration-two-trees

# Draft every live case with boilerplate slots (skips cases already drafted
# unless --force):
node scripts/content/draft-boilerplate-fixes.mjs --all

# Turn every drafts/<slug>.json into one readable report:
node scripts/content/review-drafts.mjs
# → drafts/REVIEW.md — old vs. new, grouped by case

# Read drafts/REVIEW.md. For each case you're happy with:
node scripts/content/apply-draft.mjs --slug=hydration-two-trees
# patches src/cases/hydration-two-trees/casey.json in place; --dry-run to preview first
```

`draft-boilerplate-fixes.mjs` only ever writes under `scripts/content/
drafts/` — it never touches a real `casey.json`. `apply-draft.mjs` is the
one command in this pipeline that does, and only for a slug you name
explicitly, one at a time.

## What "boilerplate" means here

Reuses `KNOWN_BOILERPLATE_HINTS` from `scripts/social/lib/content.mjs`
directly (not a copy) — see `scripts/content/lib/boilerplate.mjs`. A slot
needs a draft if it's empty or matches one of those known strings exactly.
This means the generator's idea of "needs fixing" can never drift from the
guard that decides what's safe to cross-post.

## Cost and caching

The system prompt (style rules, banned-boilerplate list, few-shot
examples) is identical on every request and marked `cache_control:
{type: "ephemeral"}`, so a `--all` run across ~30 cases pays the full
system-prompt cost once and reads it from cache on the rest. Per-case
output is small (up to 6 short hint strings) — `max_tokens: 4096` is
generous headroom, not a real ceiling you'll hit.

## Known limitations

- **No cost estimate printed before a real `--all` run.** `post-to-x.mjs`
  logs an estimated cost before posting; this doesn't. Worth adding once
  real usage gives a sense of typical spend per case.
- **`review-drafts.mjs` regenerates `REVIEW.md` from scratch every run** —
  if you've partially applied a batch, re-running it after new drafts still
  lists the already-applied cases (their draft file is left in place after
  `apply-draft.mjs` as a record). Not incorrect, just not filtered by
  applied-vs-pending.
- **Chapter-prose extraction is regex-based, not a real HTML/Nunjucks
  parser** (`lib/case-source.mjs`). Verified clean against all 31 live
  cases' actual `index.njk` markup, including nested `<div>`s inside a
  tone block — but a chapter section with unusual markup could silently
  extract nothing rather than erroring. The generator still drafts in that
  case, just with less grounding (falls back to title/principle/hook/demo
  only).
- **9 live cases have no `fe-depth` content at the junior tone at all** —
  that chapter was only written for mid/staff (e.g.
  `micro-frontend-boundary-drift`, a Module Federation case). If that
  slot's hint is boilerplate, the draft for it is grounded in less than
  usual (title/principle/hook/demo, no chapter prose) — read those ones a
  little more skeptically in `REVIEW.md`. This is real content variation,
  not an extraction bug (confirmed by reading the source `index.njk`
  directly).

## Drafting full chapter prose for not-yet-written cases

`draft-case-prose.mjs` extends the same draft/review/apply pattern one
level up: instead of fixing boilerplate hints on a *live* case, it drafts
the core narrative chapters (`hook`, `concept`, `story-1`, `fe-depth`,
`takeaway`) for an *idea-status* case that's already been through
`scaffold-case.mjs promote`.

```
draft-case-prose.mjs  →  review-case-prose.mjs  →  apply-case-prose.mjs
   (calls Claude API)       (no API call)              (no API call)
writes drafts/<slug>-prose.json  writes drafts/PROSE_REVIEW.md  patches the real index.njk
```

```bash
# Case must already be scaffolded first:
node scripts/scaffold-case.mjs promote <slug>

DRY_RUN=1 node scripts/content/draft-case-prose.mjs --slug=<slug>
node scripts/content/draft-case-prose.mjs --slug=<slug>
node scripts/content/review-case-prose.mjs          # → drafts/PROSE_REVIEW.md
node scripts/content/apply-case-prose.mjs --slug=<slug>   # --dry-run to preview first
```

### Scope — deliberately narrower than "write the whole case"

This drafts the five narrative chapters only. It does **not** draft
`ui-strip` copy, demo button/aria labels, noscript text, references, or
the interactive demo itself — those stay real engineering/authoring work,
same as the two pilot cases built by hand earlier in this project.
`scaffold-case.mjs check <slug>` still correctly flags the remaining
`casey.json` concept/fe-depth hints as needing content after
`apply-case-prose.mjs` runs — that's `draft-boilerplate-fixes.mjs`'s job,
not this one, and that script currently only targets `status: "live"`
cases, so it can't be pointed at an idea-status case yet even after real
chapter prose exists to ground it. Extending it to also accept idea-status
slugs (now that this tool can put real prose in place for it to read) is
a natural follow-up, not done here to keep this change reviewable as one
unit.

### Grounding, without existing prose to read

Unlike the hint generator, there's no real chapter prose to ground a
first draft in — the whole point is that none exists yet. The prompt
instead uses one already-good live case's `hook`/`concept` prose (see
`EXAMPLE_SLUG` in `draft-case-prose.mjs`) as a few-shot example for
voice/length/register, plus the manifest entry's title/track/principle as
the actual content signal. This means first-draft quality here is
structurally lower-confidence than the hint generator's — read `PROSE_REVIEW.md`
skeptically, not as a rubber stamp.

### A real bug this caught before it shipped

`patchToneBody`'s first version was tested against the `takeaway` chapter
the same way as every other chapter (wrapping paragraphs in `<p>` tags).
A live case's actual `takeaway` markup uses bare text directly inside each
`.tone-*` div (`<div class="tone-junior">Some sentence.</div>`, no `<p>`)
— `apply-case-prose.mjs` special-cases `takeaway` to match. Found by
actually applying a synthetic draft and diffing the result against a real
case's markup, not by reading the scaffold template alone.

## Voice-script content (`casey.json`'s `voice.sections`)

A separate content surface from `hints` (above) and from the chapter
prose in `index.njk`: `voice.sections` is the text `casey-voice.js` reads
aloud through the "Listen with Casey" button. It has its own boilerplate
problem and its own detector, because a string generic enough to flag as
boilerplate in one field isn't necessarily generic in the other — see
`lib/voice-boilerplate.mjs`'s header comment for why this isn't just
folded into `KNOWN_BOILERPLATE_HINTS`.

```bash
node scripts/content/check-voice-boilerplate.mjs          # all live cases
node scripts/content/check-voice-boilerplate.mjs --json   # machine-readable
```

Unlike the two draft/review/apply pipelines above, there's currently no
`draft-voice-fixes.mjs` — the 2026-07-25 fix for all 31 live cases (174 of
372 slots were empty or boilerplate) was authored directly rather than
through a generator script, since the content is short (1-3 sentences per
slot) and benefits from being read in the context of the case's full
chapter prose rather than assembled mechanically. If a large batch of
voice-script fixes is needed again, `draft-boilerplate-fixes.mjs` is the
closest existing template to extend, swapping the target field and
grounding material.

After editing `voice.sections` text, regenerate the corresponding audio —
see the "Casey voice" section in `../../README.md` and
`generate-voice-audio.mjs`'s header comment.
