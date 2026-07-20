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
