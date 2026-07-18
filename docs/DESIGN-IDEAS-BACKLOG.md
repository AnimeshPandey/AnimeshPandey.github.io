# Design ideas backlog — 50-idea ledger

**Origin:** a single "give me 50 more design ideas" ask, answered by re-reading both codebases' data layers (`manifest.json`, `hub-facets.json`, `library-entries.json`, `guide-lines.json`, `mvp-references.json`, `changelog.json`, `theme.css`, portfolio's `profile-facts.js`/`eggs-data.js`/`vitals-readout.js`, `docs/CASEBOOK-ROADMAP.md`) through the lens of every installed design/review skill, hunting for real, unexploited data fields the way the "No. 0NN" and coverage-year-span ideas were found before.

**This document tracks what happened to each of the 50** — shipped, already-done-on-audit, genuinely still open, or explicitly rejected — so the backlog doesn't silently go stale the way `CASEBOOK-ROADMAP.md` itself partly had (see its July 2026 staleness note, corrected as a direct result of this pass).

**Status key:** ✅ Shipped this pass · 🔍 Audited — already done, no code needed · ⏳ Still open (real backlog) · 🚫 Recommended against · 📝 Note only, no action

---

## A. Flagship / signature-level

| # | Idea | Status | Notes |
|---|------|--------|-------|
| 1 | Fix Casebook's stale reading time | ✅ Shipped | New `caseReadingStats` global data (computed from each live case's default-tone prose), consumed by both hub card and cover so they can't drift. Regression guard: `tests/static/assert-reading-time-honesty.mjs`. |
| 2 | "Eat your own dog food" audit | 🔍 Audited | Touch targets, focus-visible, and `prefers-reduced-motion` are all genuinely respected site-wide (confirmed via earlier a11y passes + this pass's spot-check). **One real gap found:** the reading-library filter's "skeleton" (`hub-filters.js`'s `.hub-grid--filtering`) is actually a 40%-opacity dim, not a content-shaped skeleton — directly at odds with what the site's own `skeleton-vs-spinner-choice` case teaches. Folded into idea #19 below. |
| 3 | Real "Wave 2 is next" teaser | ⏳ Open | Real data exists (`manifest.json`'s `wave` field: 198 not-yet-live cases across waves 2–4). Not built this pass — good next slice. |
| 4 | Publish theme contrast-audit as content | ⏳ Open | `theme.css`'s inline contrast-ratio comments are real and ready to surface; needs its own page/panel, deferred as a distinct content feature. |
| 5 | Cross-link portfolio skill tags to Casebook track counts | ⏳ Open | Cross-repo feature (portfolio → Casebook), deferred. |
| 6 | Long-press sparkline reuse for case-count growth | ⏳ Open | Real data source exists (`changelog.json`'s dated `case` entries); reuses `eggs-data.js`'s existing interaction. Deferred — a real feature build, not a quick fix. |

## B. Portfolio homepage & articles

| # | Idea | Status | Notes |
|---|------|--------|-------|
| 7 | Real build/deploy stamp in footer | ✅ Shipped | Homepage footer now shows `Build <7-char SHA> · deployed <UTC timestamp>`, linking to the real GitHub commit. New `__AP_BUILD_TIME__` token stamped alongside the existing `__AP_BUILD_ID__` in both `tests/scripts/build-deploy.mjs` (local) and `.github/workflows/static-pages.yml` (CI) — both paths had to change, since CI does its own independent `sed` stamping pass. |
| 8 | Make the recruiter "score" rubric visible | 🔍 Audited | `recruiter-data.js`'s `edu.score` already renders as `<unit> <value> / <scale>` (e.g. "CPI 7.9 / 10") — a transparent, self-explanatory academic fact, not an opaque single number. The idea's premise (a mysterious score needing a breakdown) doesn't match what's actually shown. No action needed. |
| 9 | Static test asserting reading-time honesty (portfolio) | ✅ Shipped | `tests/static/assert-portfolio-reading-time-honesty.mjs`. Found a real, adjacent finding while building it: 2 of the site's 3 long-form articles (`fundamentals-of-functional-javascript`, `how-well-do-you-know-this`) still show hand-typed "N min read" — their full prose lives externally on Medium/Dev.to, so there's no local text to compute from. Not a bug the same way idea #1 was (nothing to measure locally), but it's a real, disclosed exception — allowlisted explicitly in both the new test and `assert-no-hardcoded-metrics.mjs` (idea #48) rather than silently ignored. |
| 10 | Vitals readout "sample size" caveat | ⏳ Open | Small addition (a `title` tooltip), deferred. |
| 11 | Article bylines: git-blame "code last verified" date | ⏳ Open | Only meaningfully applies to the one article with local runnable code samples; deferred. |
| 12 | Homepage hero: orchestrated load sequence tied to LCP | 🚫 Recommended against | Subjective aesthetic risk without a strong justification; restraint favored per the plan's own framing. Not attempted. |
| 13 | `i18n.js` coverage indicator | 🔍 Audited | All three locales (`en`/`es`/`hi`) already sit at ~99% key parity (334–335 keys each) via fully automatic `navigator.language` detection — there is no partial-coverage problem to disclose, and no manual switcher exists for a coverage indicator to attach to. The idea's premise doesn't match the current implementation shape. No action needed. |
| 14 | Egg-data staleness audit | ⏳ Open | Not audited this pass — still a real, cheap follow-up. |

## C. Casebook hub + track hubs

| # | Idea | Status | Notes |
|---|------|--------|-------|
| 15 | Track hub pages with real completion fraction | ⏳ Open | Confirmed genuinely not built (`cases/src/tracks/` doesn't exist). Large feature, deferred. |
| 16 | Hub card hover lift | 🔍 Audited | Already shipped — `.case-card:hover` has real `translateY(-2px)` + shadow. `docs/CASEBOOK-ROADMAP.md` §9 corrected. |
| 17 | Chapter progress dots sized to real chapter count | 🔍 Audited | Already shipped, and better than originally scoped: `chapter-progress.js` builds its dots from whichever real `.case-chapter[data-chapter]` elements are actually present on the page (capped at 5), not a hardcoded 5-dot set. Roadmap corrected. |
| 18 | "New" badge using real publish dates | 🔍 Audited | Already shipped — client-side from real `data-published-at` against `Date.now()` (deliberately not the build-time-only `isRecent` filter, per the code's own comment, so it can't go stale between deploys). The `isRecent` Eleventy filter still exists in `.eleventy.js` but is now dead code — flagged for a future cleanup, not urgent. Roadmap corrected. |
| 19 | Content-shaped skeleton for library filtering | ⏳ Open (confirmed real gap) | Current implementation only dims cards to 40% opacity during filtering — not the content-shaped skeleton (image slot / title lines / chip row) the site's own case study argues for. Roadmap corrected to describe the actual gap accurately. Good next slice — same finding as idea #2's dog-food audit. |
| 20 | Zero-results state tied to Casey's `zero_results` copy | 🔍 Audited | Already shipped — `casey-hub.js` listens for the real `casey-hub-filter` event and calls `CaseyGuide.suggest('hub-zero')` when a track filter yields zero live results, surfacing the real authored copy from `guide-lines.json`. No action needed. |
| 21 | Track chip counts, live-only | 🔍 Audited | Already shipped — `annotateTrackOptions()` computes counts purely from `[data-status="live"]` elements; no overpromising against all-manifest (including not-yet-built) entries. No action needed. |

## D. Individual case pages

| # | Idea | Status | Notes |
|---|------|--------|-------|
| 22 | Tier-aware reference count callout | ⏳ Open | Real data exists (`mvp-references.json`), deferred as a feature build. |
| 23 | Demo-type tag on case cover | ⏳ Open | Real field exists (`manifest.json`'s `demoType`), small addition, deferred. |
| 24 | Flagship badge, audited for accuracy | 🔍 Audited — **real finding, flagged, not auto-fixed** | The badge *is* consistently driven by the real `flagship` field (no hardcoding) — but the underlying data itself makes the badge meaningless: all 31 live cases are flagged `flagship: true` (`manifest.json`'s own `stats.flagship: 31` — exactly the total live count). A badge shown on 100% of cards signals nothing. This is an editorial/content decision (which case is genuinely *the* signature one), not something to silently overwrite — needs a human call on which case(s), if any, should keep the flag. |
| 25 | Principle cross-reference chip | ⏳ Open | Real field exists (`manifest.json`'s `principle`), deferred as a feature build. |
| 26 | Surface internal "priority" field to readers | 🚫 Recommended against | Per the original plan: this is a production-planning artifact, not a reader-relevant fact. No action, by design. |
| 27 | Real git-based "case last updated" stamp | ⏳ Open | Deferred, medium effort (build-time git log per case). |
| 28 | Confetti/celebrate tied to a real streak | 🔍 Audited | Already shipped — `casey-guide.js`'s `_recentStreak()` counts real `completedAt` timestamps within the last 7 days from local progress state; `return_streak` copy is genuinely conditional on `streak >= 3`, not a flat "nice job." No action needed. |
| 29 | Audience-level reading-time delta per tone | ⏳ Open | Natural extension of idea #1's now-existing `caseReadingStats` infra (would need to compute per-tone, not just default-tone). Deferred. |

## E. Reading library

| # | Idea | Status | Notes |
|---|------|--------|-------|
| 30 | Real language-mix indicator | ⏳ Open | Deferred. |
| 31 | Per-year coverage sparkline | ⏳ Open | Deferred. |
| 32 | `clusterId` as a real "similar articles" grouping | ⏳ Open | Deferred. |
| 33 | Category chip counts audited against filtered result | ⏳ Open | Not audited this pass. |
| 34 | Duplicate-slug data-quality sweep | ✅ Shipped | Swept all 779 `library-entries.json` rows: the one known duplicate from PR #20 (`financial-times-improving-the-cache-performance-of-the-polyf`) remains the *only* one — no new truncated-slug collisions. New permanent guard: `tests/static/assert-library-slug-uniqueness.mjs`. |
| 35 | `mapsToSlug` cross-reference reminder | 📝 Note only | Dormant code from PR #19 will activate automatically once any `library-entries.json` row gets a real `mapsToSlug` populated. Nothing to build — just a reminder this exists and isn't permanently dead. |

## F. Company pages

| # | Idea | Status | Notes |
|---|------|--------|-------|
| 36 | "Most-covered companies" real ranking | ⏳ Open | Deferred. |
| 37 | Coverage-span outliers as a real aggregate fact | ⏳ Open | Deferred. |
| 38 | Company logo/favicon, sourced not designed | 🚫 Recommended against (as scoped) | Fetching real favicons at build time introduces a new external-network build dependency and failure mode, conflicting with the "no new systems" constraint carried over from issue #7. Skip unless explicitly directed otherwise. |
| 39 | Empty-state parity check | ⏳ Open | Not audited this pass. |

## G. System-wide: motion, accessibility, microcopy

| # | Idea | Status | Notes |
|---|------|--------|-------|
| 40 | Reduced-motion real disclosure | ⏳ Open | Deferred. |
| 41 | Shared motion-duration/easing audit | ⏳ Open | Not fully audited this pass. |
| 42 | Skip-link presence audit | 🔍 Audited | Confirmed present on all three shells: root homepage (`index.html`), portfolio articles (`site/src/_includes/layouts/article.njk`), and Casebook (`cases/src/_includes/layouts/casebook-layout.njk`, "Skip to story"). No action needed. |
| 43 | Empty/error states audited against voice rules | ⏳ Open | Not audited this pass. |
| 44 | Touch-target mechanical sweep (44×44px) | ⏳ Open | Earlier a11y passes (tasks #2, #14, #15) covered general accessibility; an explicit bounding-box sweep specifically against the 44px rule hasn't been run as its own check. Good `accesslint`/Playwright follow-up. |
| 45 | Active-voice pass on CTAs | ⏳ Open | Not audited this pass. |
| 46 | Document the "·" separator convention | ✅ Shipped | Written into `docs/DESIGN-PRINCIPLES.md`. |
| 47 | Codify "real number, not decoration" in writing | ✅ Shipped | `docs/DESIGN-PRINCIPLES.md` — the rule, why it matters here specifically, real examples already in the codebase, and the guardrails that enforce it. |

## H. Process / tooling guardrails

| # | Idea | Status | Notes |
|---|------|--------|-------|
| 48 | Grep-based static test flagging hardcoded "min read"/count strings | ✅ Shipped | `tests/static/assert-no-hardcoded-metrics.mjs` — scans template source (not built output) for a literal digit next to "min read" or "No. `<n>`" outside a Nunjucks expression. Verified it actually catches a planted fake hit before wiring it in. 5 known, disclosed exceptions allowlisted (the 2 external-prose teaser articles from idea #9). |
| 49 | Shared Playwright contrast-check helper | ⏳ Open | No new contrast check was needed this pass, so no immediate driver; still worth doing before the next contrast-adjacent verification script. |
| 50 | Running "shipped ideas" ledger | ✅ Shipped | This document. Cross-linked from `docs/CASEBOOK-ROADMAP.md`'s staleness note. |

---

## Summary

- **10 shipped this pass:** #1, #7, #9, #34, #46, #47, #48, #50 (docs/tests), plus the roadmap corrections themselves.
- **10 audited and already done** (found already shipped by an earlier commit, no new code needed): #8, #13, #16, #17, #18, #20, #21, #28, #42, and #2's touch-target/focus-visible/motion-safe portion.
- **1 audited with a real, flagged finding requiring a human editorial decision** (not auto-fixed): #24 (flagship badge on 100% of live cases).
- **3 explicitly recommended against**, matching the original plan's own scope discipline: #12, #26, #38.
- **1 note-only, no action needed:** #35.
- **~25 remain genuinely open** — real, scoped backlog items, several with real data sources already identified in the plan text above (§A.3–6, §D.22/23/25/27/29, §E.30–33/39, §F.36/37/39, §G.40/41/43–45/49). None were abandoned; they're listed here specifically so they don't quietly disappear. Recommended next slice, in roughly the same confidence-to-effort order as the original plan: **#19** (skeleton — the one confirmed real gap from the dog-food audit), **#3** (Wave 2 teaser — real data, no new page), **#24**'s editorial decision (needs the repo owner, not more code).
