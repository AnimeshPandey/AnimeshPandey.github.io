# Design principles

**Last updated:** July 2026

This document exists so the site's core design discipline lives in one place instead of scattered across code comments. Read this before adding a stat, a badge, a count, or a timestamp anywhere on the portfolio or Casebook.

---

## The rule: real number, not decoration

**Every number, date, badge, or count shown to a visitor must be genuinely computed or measured — never hand-typed, guessed, or left to silently drift out of sync with the thing it claims to describe.**

This is not a style preference. It's a correctness bar, the same way "no console errors" or "no broken links" is a correctness bar. A fabricated number is a small, specific kind of bug: it tells a visitor something false while looking exactly as confident as a true one.

### Why this matters here specifically

Both products exist to demonstrate frontend engineering judgment to an audience — recruiters, hiring managers, other engineers — who will notice a "21 min read" that's actually an 8-minute skim, or a "★ Flagship" badge on every single card. That audience is unusually well-positioned to catch this exact failure mode, which makes it higher-stakes here than on a typical marketing site.

### Real examples already in the codebase

- **Reading time** (`site/.eleventy.js`'s `wordStats` filter, `cases/.eleventy.js`'s `caseReadingStats`): computed at build time from the actual rendered prose (Casebook: only the default tone's chapters, since three tones render into the DOM simultaneously), never a flat hand-typed guess. One computed source feeds both the hub card and the article/case cover, so the two can't independently drift.
- **Web Vitals readout** (`vitals-readout.js`): reads the real Performance API for the current session. If the browser doesn't support a metric, it shows "—", not a fabricated placeholder number.
- **Card-catalog numbers** (`reading-card.njk`, case cover's "No. 0NN" stamp): derived from the entry's real position in an ordered, filtered list — not a static index that drifts when entries are reordered or added.
- **"New" badge** (Casebook hub cards): computed client-side from the real `publishedAt` date against `Date.now()`, specifically so it can't go stale between deploys the way a build-time-only check would.
- **Return streak** (`casey-guide.js`): counted from real `completedAt` timestamps in local progress state over the last 7 days — not a generic "nice job" with no real count behind it.
- **Coverage-year span** (company detail pages): real min/max publish year across that company's actual library entries, not a curated or invented range.

### The failure mode this prevents

The reading-time bug (design-backlog idea #1) is the canonical example: `manifest.json`'s `readMin` field was hand-typed once per case, generalized to a flat default, and never touched again as cases changed — so it slowly drifted from what the prose actually took to read. The fix wasn't "pick a better number," it was "stop hand-typing it and compute it from the thing it claims to measure." Apply that same question to any new stat before writing it: *is this computed from its own source of truth, or did a human type a number that will eventually be wrong?*

### A related, narrower discipline: don't fabricate differentiation either

A flagship/highlight badge that's applied to every item defeats its own purpose just as much as a fabricated number does — it *looks* like a real signal (this one is special) while actually conveying nothing (everything is special). If a boolean flag or badge is meant to distinguish, verify it actually distinguishes a meaningful subset before shipping it, the same way you'd verify a number is really computed.

---

## Guardrails that enforce this automatically

- `tests/static/assert-reading-time-honesty.mjs` / `assert-portfolio-reading-time-honesty.mjs` — re-check the *built* output so a future edit can't silently swap a computed reading time back for a hand-typed one.
- `tests/static/assert-no-hardcoded-metrics.mjs` — greps template *source* for a literal digit sitting next to "min read" or "No. `<n>`" outside a Nunjucks expression — the generic shape of this entire bug class. New hits fail the build unless explicitly allowlisted with a stated reason (e.g. a teaser page whose full prose lives externally and genuinely can't be measured locally).

When adding a new real-data feature, prefer adding a matching guard in `tests/static/` over trusting code review alone — see `docs/DESIGN-IDEAS-BACKLOG.md` for the running list of what still needs one.

---

## Shared conventions worth reusing

- **`·` as the separator idiom** — used consistently for meta lines (case cover's `{{ readableDate }}`, company detail's `{{ years }} coverage`, the homepage footer's build stamp). Default to reusing this rather than inventing a new separator per component.
- **Motion**: hover/press feedback should feel like the same signature across both products — Casebook's `.case-card:hover` lift (`translateY(-2px)` + soft shadow) and the portfolio's card-tilt interaction should stay in the same duration/easing family rather than drifting per-component.
