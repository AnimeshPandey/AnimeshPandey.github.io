# Case authoring guide

The single reference for turning one `manifest.json` entry (`status: "idea"`) into a
fully-built Casebook case. `README.md`'s "Adding a new case" section is the quick
version; this is the complete one — every field, every gotcha found by actually
shipping cases this way, and the reasoning behind each rule so you can extend it
sanely later instead of re-discovering the same bugs.

Written against `raf-throttle-scroll`, `mutation-observer-vs-polling`, and
`structured-output-json` — three cases built end-to-end with this exact process —
plus everything learned fixing content gaps across the 31 live cases. If a claim
here stops matching those files, trust the files and fix this doc.

## Before you start

- `node scripts/scaffold-case.mjs promote <slug>` scaffolds the 3 files below from
  the manifest entry (which must already exist with `status: "idea"`). It never
  generates hint or chapter content — every string it writes is a `TODO` marker.
  Content is a writing task, not a templating task; that split is deliberate (see
  `scripts/scaffold-case.mjs`'s own header comment).
- `node scripts/scaffold-case.mjs check <slug>` validates one case: JSON validity,
  manifest↔front-matter parity, boilerplate-hint detection, and the
  `permalink: false` safety invariant. Run it after every content pass, not just
  once at the end.
- A case being fully authored does **not** make it live. `status` stays `"idea"`
  and `permalink` stays `false` until a human runs `confirm-publish.py` in the
  sibling `ideas` repo. Never flip either field yourself to "unblock" a task — see
  CLAUDE.md's "Publishing gate" section. Full content on an idea-status case is
  the goal of this doc; going live is a separate, human-gated decision.

## Anatomy of a case

Three files under `src/cases/<slug>/`, plus the manifest entry that must already
exist and stays the source of truth for structural facts (track, tier, demoType,
etc — never duplicate those into prose, they render from the manifest via
`caseReadingStats`/`mvpReferences`/front-matter lookups):

| File | Purpose |
|---|---|
| `index.njk` | Front-matter + the chapters themselves (prose, demo markup, ui-strip) |
| `casey.json` | Casey's hints (margin notes), voice script (spoken audio), and per-chapter actions |
| `<slug>.11tydata.js` | Boilerplate — reads `casey.json` into `caseyData` for the layout. Copy verbatim, never hand-edit. |

Front-matter fields on `index.njk` (`raf-throttle-scroll`'s is a complete real
example):

```yaml
layout: layouts/case-layout.njk
permalink: false # DO NOT change by hand — flip only via confirm-publish.py at real publish time
title: "rAF Throttle for Scroll Handlers"
description: "…"        # one sentence, used in <meta description> and card blurbs
slug: raf-throttle-scroll
track: animation-motion   # must match the manifest entry's track exactly
readMin: 10                # must match the manifest entry — two independent copies of
                            # this number have drifted before (see case-references.njk's
                            # header comment); if you're not sure, read it FROM the
                            # manifest rather than retyping it
flagship: false
demoType: code-only        # must match manifest — see "The demo" below
principle: Performance
schemaType: Article
relatedCases: []
ogImage: https://anmshpndy.com/brand/cases/<slug>-og.png
```

## The 3-tier tone system

Every prose chapter (`hook`, `concept`, `story-1` or `story`, `fe-depth`,
`takeaway`) carries three parallel `<div class="tone-junior/mid/staff">` blocks.
The reader picks a level with the segmented control
(`partials/case-tone-switcher.njk`); `casebook-tone.js` shows/hides the matching
divs and updates the reading-time display from that tone's *actual* word count
(`caseReadingStats[slug].byTone` in `.eleventy.js` — computed per tone, not
estimated from the default tone).

This means **the three tones must be different writing, not the same paragraph
at three lengths.** What changes tone-to-tone:

- **Junior**: assumes no prior context. Defines the mechanism in plain terms,
  motivates *why it's surprising*. 2-3 short paragraphs.
- **Mid**: assumes the reader has hit something adjacent before. States the
  mechanism directly, spends words on the specific numbers/behavior rather than
  re-explaining fundamentals. Often shorter than junior.
- **Staff**: assumes the reader could have written the fix themselves. Goes to
  the edge case, the "differs from X because Y" distinction, or the follow-on
  concern (cleanup, a related footgun, how to verify it in DevTools). This is
  where real technical depth lives — don't let it collapse into "mid but with
  bigger words."

`takeaway` is a special case: its markup is **bare text inside the tone div, no
`<p>` wrapping** (`<div class="tone-junior">Some sentence.</div>`), unlike every
other chapter. This was found the hard way — `apply-case-prose.mjs`'s first
version wrapped every chapter's paragraphs in `<p>` uniformly, which broke a
live-case diff against `takeaway`. If you hand-author a case, match the real
markup in an existing live case's `takeaway` chapter, don't infer it from the
other chapters' pattern.

**Quality bar**: this site's stated brand value is no AI slop. A tone block that
could be pasted into any other case unchanged has failed — it needs the case's
actual mechanism, actual numbers, actual named APIs. This is the same standard
`scripts/content/README.md`'s draft/review/apply pipeline holds itself to, and
the same one `KNOWN_BOILERPLATE_HINTS` / `voice-boilerplate.mjs` exist to catch
automatically for Casey's hints and voice script (see below) — chapter prose has
no automated detector, so read your own draft skeptically before committing it.

## Casey: two separate content surfaces

`casey.json` carries **two independent, differently-purposed pieces of text per
chapter** — don't conflate them, they read very differently:

### `hints` — margin notes

Short, tone-matched lines shown beside the chapter as Casey's commentary. Ground
every hint in that chapter's *actual* prose for that tone — a hint that just
restates the chapter title is the boilerplate failure mode
`KNOWN_BOILERPLATE_HINTS` (`scripts/social/lib/content.mjs`) exists to catch.
`concept`/`fe-depth` hints were the worst offenders across the original 31 live
cases (`concept`/staff was identical text in all 31) — don't reproduce that;
every hint should be unrecognizable if you swapped it into a different case.

### `voice.sections` — the spoken script

Read aloud by the "Listen with Casey" button (`casey-voice.js`). **This is a
separate content surface from `hints`, with its own boilerplate detector**
(`scripts/content/lib/voice-boilerplate.mjs`) — a string generic enough to flag
in one field isn't necessarily generic in the other, so don't assume fixing
`hints` also fixes `voice`. Write it as something a person would actually *say*,
not read: shorter sentences, no inline code-formatted `` `identifiers` `` (nothing
renders backticks aloud), and match the tone's register the same way `hints`
does. Run `node scripts/content/check-voice-boilerplate.mjs --slug=<slug>` after
writing it.

`voice.sections` only needs real content for chapters the voice button actually
covers — check an existing live case's `casey.json` for the current chapter set
(`hook`, `concept`, `demo`, `takeaway` in the three cases built this pass) rather
than assuming every prose chapter needs a voice entry.

**Audio generation is a separate, human-run step**, not part of authoring content.
`voice.sections` text is the source; `scripts/content/generate-voice-audio.mjs`
(header comment has full setup) turns it into
`src/assets/casey/voice/<slug>/<chapter>-<tone>.mp3` via a local Piper TTS install
— not wired into CI, only run for `status: "live"` cases by design. An idea-status
case can and should have fully-written `voice.sections` text; it does not need
generated audio until it's ready to go live (the voice button falls back to the
browser's own `speechSynthesis` when no MP3 exists, so nothing is broken in the
meantime).

### `actions` — per-chapter quick links

Small button sets per chapter, tone-varied only in *label wording* (same targets
across tones). Two established patterns, both real examples from
`raf-throttle-scroll`:

- On `demo`: buttons that trigger demo state directly via a CSS-selector
  `target` (`[data-demo-state=broken]` / `[data-demo-state=fixed]`) — only add
  these if the demo actually exposes those `data-demo-state` buttons (toggle/
  animation demoTypes do via `wireToggleDemo`; a code-only demo has nothing to
  target, so it gets no `demo`-chapter actions).
- On `hook` and `takeaway`: navigation shortcuts (`href` to `/cases/`,
  `/cases/library/`, or `{ "target": "[data-chapter=demo]" }` to jump within the
  page).

Don't invent a fourth pattern without checking whether the JS that consumes
`actions` (`casey-companion.js` or similar — grep `data-casey-action` /
`caseyData.*actions` before adding a new shape) actually knows how to render it.

## The demo

`demoType` in the manifest — and mirrored in front-matter — is one of three
values, and **all three need a real `src/assets/js/demos/<slug>.js` file that
exports `initDemo()`**, with no exceptions:

```js
// demo-loader.js (unconditional, every case):
import(`./demos/${slug}.js`)
  .then(m => {
    if (typeof m.initDemo === 'function') {
      if (interactive) interactive.removeAttribute('hidden');  // ← only runs on successful import
      m.initDemo(root, root.dataset);
    }
  })
  .catch(err => console.warn('[Casebook] Demo failed to load:', slug, err));
```

**This is the gap that bit us authoring the first 3 idea-status cases**: a
`demoType: code-only` case has no broken/fixed toggle, so it's tempting to think
it needs no JS module — the comparison is just a static `<pre><code>` block
already sitting in `index.njk`. It still does. `demo-loader.js` only calls
`interactive.removeAttribute('hidden')` *inside* the successful-import `.then()`
— if the dynamic import 404s because the file doesn't exist, the whole
`.case-demo__interactive` div stays `hidden` forever, regardless of what static
markup is inside it. We found this by actually screenshotting a built page and
seeing an empty demo box under a populated header, not by reading the code and
assuming it would work.

The fix for `code-only` is a minimal no-op module — copy this pattern exactly
(real file, `demos/raf-throttle-scroll.js`):

```js
/**
 * demos/<slug>.js
 * Export: initDemo(root, { demoType })
 * demoType "code-only": the broken/fixed comparison is static markup in the
 * case's index.njk (a <pre><code> block), not an interactive toggle — this
 * module only needs to exist so demo-loader.js's dynamic import succeeds and
 * reveals the (already-complete) static content.
 */
export function initDemo() {
  // No interactive state for a code-only demo — the comparison is static.
}
```

For the other two `demoType`s, both actually use the same helper —
`animation` (21 cases) is not a distinct rendering path from `toggle` (178
cases), it's a `toggle` demo whose `renderBroken`/`renderFixed` callbacks happen
to do richer live DOM/timer work (see `event-loop-one-thread.js` for a real
example: a "run heavy task" button that either busy-waits the main thread or
chunks it with `setTimeout`, demonstrating input responsiveness live):

```js
// src/assets/js/demos/<slug>.js
import { wireToggleDemo, PRM } from './_demo-utils.js';

export function initDemo(root, dataset) {
  wireToggleDemo(root, {
    renderBroken: (vp) => { vp.innerHTML = '…'; /* the buggy behavior, live */ },
    renderFixed:  (vp) => { vp.innerHTML = '…'; /* the fixed behavior, live */ },
  });
}
```

`wireToggleDemo` (in `_demo-utils.js`) wires the broken/fixed buttons' `aria-pressed`
state, updates the state label, and dispatches `case-demo-fixed` when the reader
flips from broken to fixed — don't hand-roll this wiring per demo. `PRM` (a
`prefers-reduced-motion` boolean) and helpers like `simulateAsync`/`makeSkeleton`
are also shared from that file — check it before writing a new demo from scratch.

**The best demos find a real bug, not a contrived one.** The strongest cases (the
three built this pass, and most of the 31 live ones) demo an actual observable
difference — a counter that visibly runs 100x more in the broken state, an input
that visibly freezes — not just two code blocks side by side with no live
behavior. If a topic genuinely has no live-observable difference (pure API
comparison, `structured-output-json`'s case), `code-only` with a well-annotated
static comparison is the honest choice — don't force a fake interactive demo
onto a topic that doesn't have one.

## The ui-strip

One short chapter, one line, immediately after the concept/story chapters:

```njk
<section class="case-chapter" data-chapter="ui-strip">
  <h2>Pattern at a glance</h2>
  <div class="case-ui-strip">
    <p class="case-ui-strip__label">Scroll handler runs 100+ times/sec (broken) vs. once per animation frame via the tick-flag pattern (fixed)</p>
  </div>
</section>
```

Not tone-varied — one sentence that states the broken-vs-fixed contrast (or the
core mechanism, for a code-only case) in a single scannable line. This is the
line a reader skimming the hub card sees; write it standalone, not as a
continuation of the hook chapter's prose.

## References

Don't hand-write per-tone link lists into `index.njk` — that's exactly the
duplication bug class this project has hit before (readMin, flagship, principle
all drifted between two hand-kept copies at various points). Add an entry to
`src/_data/mvp-references.json` keyed by slug instead:

```json
{
  "<slug>": {
    "junior": ["<a href=\"https://…\" rel=\"noopener noreferrer\">Site — Title</a>"],
    "mid":    ["…"],
    "staff":  ["…"]
  }
}
```

`partials/case-references.njk` renders this automatically (per-tone count +
list) if the slug has an entry, and renders nothing if it doesn't — an
idea-status case without real references yet just quietly has no References
chapter, which is fine; add real, human-verified links before the case is
considered done. **Never fabricate a URL.** As of this doc, `mvp-references.json`
only covers the 31 live cases — the 3 idea-status cases built this pass shipped
without one; adding real references is a real gap to close before any of these
go live, tracked as its own follow-up, not blocking idea-status content.

## Learning path / chapter order

The manifest's `chapters` array is the contract Eleventy renders in order
(a case's real chapter list, from `raf-throttle-scroll`'s manifest entry):

```
hook → concept → story → ui-strip → demo → fe-depth → references → takeaway → next
```

- **hook** — the surprising/broken behavior, motivates why this matters
- **concept** — the mechanism/pattern that fixes it
- **story** (`story-1` in markup) — a concrete scenario grounding the concept in
  a real team/situation, not abstract
- **ui-strip** — the one-line scannable summary (see above)
- **demo** — hands-on (see "The demo" above)
- **fe-depth** — the follow-on concern: edge cases, cleanup, adjacent footguns,
  how a staff engineer would verify/extend this
- **references** — auto-rendered from `mvp-references.json` (see above)
- **takeaway** — the one-sentence-per-tone summary, bare-text markup (see tone
  section above)
- **next** — do not hand-author a "next case" TODO link; this renders from
  `relatedCases`/global next-case logic. An earlier pass over the 3 idea-status
  cases removed manually-added "next case" TODO actions for exactly this reason
  — don't reintroduce them.

This order is the pedagogical shape: surprise → mechanism → grounding → summary
→ hands-on → depth → sources → takeaway. Don't reorder chapters per-case; the
hub/progress UI and reading-time computation assume this sequence.

## Front-matter / manifest parity

`scaffold-case.mjs check <slug>` catches drift automatically — run it, don't
eyeball it. The fields that must match exactly between the manifest entry and
`index.njk`'s front-matter: `title`, `track`, `readMin`, `flagship`, `demoType`,
`principle`. If you change one, change both, then re-run `check`.

## Quality checklist before calling a case done

1. `node scripts/scaffold-case.mjs check <slug>` passes (JSON validity, parity,
   boilerplate detection, `permalink: false` invariant)
2. All three tones present and *genuinely different writing* for every prose
   chapter (hook, concept, story, fe-depth, takeaway) — not the same paragraph
   resized
3. `casey.json` hints grounded in that case's real content, not swappable with
   another case's hints
4. `casey.json` voice.sections written to be spoken, boilerplate-checked
   (`check-voice-boilerplate.mjs --slug=<slug>`)
5. `src/assets/js/demos/<slug>.js` exists and exports `initDemo()` — **even for
   `demoType: code-only`** — verified by actually building and visually checking
   the demo box isn't empty, not by reading the code
6. `ui-strip` has its one-line summary
7. `takeaway` markup is bare-text-in-div, not `<p>`-wrapped
8. No manually-added "next case" action (renders automatically)
9. Build clean: `npm run build` (or the full `tests/scripts/build-deploy.mjs`
   for a true merged-artifact check) with no console errors, then load the page
   and actually look at it — screenshot every chapter, both themes if relevant.
   Type-checking and unit tests verify code correctness, not content/visual
   correctness; only a real look at the rendered page catches an empty demo box
   or a broken tone block.
10. References added to `mvp-references.json` before the case is truly
    "release-ready" (not required to leave it in idea-status while other
    content is finished, but track it — don't forget it silently)

## Tooling pipeline reference

For batch content generation across many cases rather than one-at-a-time hand
authoring, see `scripts/content/README.md` for the two draft/review/apply
pipelines (`draft-boilerplate-fixes.mjs` for `hints`, `draft-case-prose.mjs` for
full chapter prose) — both call the Claude API, draft to a local file, require a
human review pass (`REVIEW.md` / `PROSE_REVIEW.md`), and only patch a real
`casey.json`/`index.njk` on an explicit per-slug apply step. Neither pipeline
currently covers `ui-strip` copy, demo code/labels, references, or the demo
module itself — those stay hand-authored engineering + writing work regardless
of which pipeline generated the chapter prose.
