# Casey art-generation handoff (SVG + Lottie)

This is a deliberately-deferred-work handoff, not a spec to implement blindly. A prior
session scoped out doing real SVG/Lottie art production and instead wrote this doc so
whoever picks it up next starts from the actual current state (verified by reading the
code, not assumed) plus researched, licensed tool options — rather than rediscovering
what already exists in this repo.

> **2026-07-25 update:** the 48 raster PNGs described below were fully regenerated in
> PR #78 (`fix/casey-full-regen`) — real, verified pose art, not a preview/anchor set,
> with new automated topology checks (`assert-casey-extremities.mjs`,
> `assert-casey-fur.mjs`, `assert-casey-no-checker.mjs`, `assert-casey-floor-matte.mjs`)
> guarding against the specific defect classes found earlier this session (matte
> rectangles, enclosed alpha holes, stray dots, extremity mottling). A full visual sweep
> after that merge (all 48 poses at both grid and full-resolution size, plus real UI
> context — hub, coach panel, preferences panel, mobile dock, milestone celebration,
> search empty-state) found the regeneration clean: no artifacts, no console errors, all
> four automated checks passing. **Everything below about the PNG *source* being usable
> input for vectorization (Decision A) is now stronger, not weaker** — the source art is
> materially better than what this doc was originally written against.
>
> One real content-quality finding from that sweep, unrelated to the technical defects
> the regeneration fixed: **`staff/support.png` doesn't convey the "support" concept as
> distinctly as its junior/mid counterparts.** `junior/support.png` shows clasped paws
> with a visibly concerned expression; `mid/support.png` shows the character holding a
> heart. `staff/support.png` reads as close to a generic sitting/idle pose — no clear
> supportive gesture or prop. This is a content/art-direction gap (a future regeneration
> or touch-up pass should give staff-tier `support` its own distinguishing gesture,
> consistent with the other two tiers), not a technical defect the automated checks
> above would catch — they check topology (alpha holes, matte rectangles, extremities),
> not "does this pose read as distinct from `idle`."

## Current state (verified, not assumed)

**Raster PNGs are the only asset runtime actually uses.** All three call sites that
build a pose URL (`casey-companion.js`, `casey-companion-prefs.js`) hardcode
`assetExt = 'png'`. The 48 poses (16 poses × 3 tiers) were produced externally via an
AI-generation pipeline documented in the sibling `ideas` repo
(`ideas/projects/case-studies/assets/casey/reference/CASEY-AI-GENERATION.md` — not in
this repo, see `STYLE-GUIDE.md`'s reference links) and installed via
`scripts/install-casey-pngs.sh`. This session re-matted transparency issues on 45+ of
those PNGs with `rembg` + `isnet-anime` (background removal, not art generation) — see
git history around that work if you need the exact command line.

**SVG already has partial, unused coverage.** `scripts/generate-casey-svgs.mjs` is a
349-line script that *procedurally draws* (not vectorizes — hand-coded ellipses/paths
per tier, no AI or tracing involved) the 8 "Core (coach FSM)" poses — `idle`, `blink`,
`perk`, `point`, `think`, `celebrate`, `sleep`, `wave` — for all 3 tiers, and the output
is already committed at `src/assets/casey/{junior,mid,staff}/*.svg` (24 files). The
README already correctly labels this "Legacy SVG regen (fallback)" — it is not dead by
accident, it's dead by design: nothing calls it at runtime today. The other 8 poses
("Guide" — `welcome`, `present`, `proud`, `support`, `read` — and "Micro" —
`curious`, `nod`, `focus`) have **no** SVG counterpart at all, procedural or otherwise.

**Lottie has a generator but no committed output and no player.**
`scripts/casey-images.py`'s `lottie` subcommand (invoked by
`install-casey-pngs.sh`) builds what its own docstring calls a "minimal Lottie 5.7 —
vertical breathe on image layer": a Lottie JSON that wraps the existing idle PNG as a
single image layer with a simple transform keyframe animation, written to
`src/assets/casey/lottie/{tier}/`. That directory does not currently exist in the repo —
the generator has apparently never been run-and-committed, or its output was cleaned up.
More importantly, **no Lottie player library (`lottie-web`, `dotlottie-web`, or
similar) is referenced anywhere in `src/assets/js/`** — even if the JSON existed,
nothing in the runtime would render it. `casey-companion.js`'s
`shouldShowCaseyBehavior(kind)` already gates a `'lottie'` kind alongside
`'confetti'`/`'rotate'` under `prefers-reduced-motion` and the "quiet" intensity
setting — this is forward-scaffolding for a feature that was never wired up, not a
sign that Lottie is partially live.

**All real motion today is CSS.** `casey-breathe`, `casey-bounce-once`, and
`casey-tier-fade` (`src/assets/css/casebook-components.css`) are `@keyframes` applied
directly to the `<img>` pose element — opacity/transform only, correctly gated behind
`@media (prefers-reduced-motion: reduce)`. This works, costs nothing, and is not
obviously worse than what either SVG or Lottie would replace it with — see the
recommendation for Lottie below before assuming it needs replacing.

## Why this was deferred (not a technical blocker)

The session that wrote this doc had no image-generation tool available, and the
`rembg`/`isnet-anime` tooling already in use can only clean up *existing* raster art
(background removal, alpha-hole fixing) — it cannot create new poses or trace vector
paths. Given a fixed amount of time and a large backlog (Casey feature builds, case
content, a dropdown/panel audit), the product call was to skip art production and
document the landscape instead. This is a scoping decision, not a "couldn't figure out
how" situation — the tool research below is real and actionable.

## Decision A — finish SVG coverage?

Two paths, not one "vectorize everything" default:

1. **Extend the existing procedural script.** `generate-casey-svgs.mjs` already has a
   working parametric style (tier proportions, palette constants) for 8 poses — adding
   the remaining 8 in the same style is the cheapest option, keeps every pose visually
   self-consistent (all-procedural, no mixed art styles), needs no external tool, and
   the tier-proportion table already in `STYLE-GUIDE.md` gives you the spec to draw to.
   Downside: procedural poses are simplified geometric shapes, not a trace of the
   painterly AI-generated PNG art direction — check side-by-side at runtime size (the
   `STYLE-GUIDE.md` "E8 quick check" list exists because small-size fidelity has broken
   before) before assuming they read as "the same character."

2. **Vectorize the real AI-generated PNGs.** Higher fidelity to the actual shipped art
   direction, but a heavier pipeline. Recommended tool: **[vtracer](https://github.com/visioncortex/vtracer)**
   (Rust, dual MIT/Apache-2.0, install via `cargo install vtracer` or the `vtracer` PyPI
   wheel — fully local, no account/API key) over potrace, because Casey's PNGs are
   flat-color cel-shaded art with several distinct fills (fur, outline, blush, collar,
   tag) — potrace only accepts binarized black/white input, so a multi-color character
   needs manual per-channel separation first. vtracer's built-in color clustering
   (`--colormode color --hierarchical stacked`) handles that automatically and is
   built for batch/scriptable use, which matters for 48 source files. Inkscape's
   **Path → Trace Bitmap** (potrace-based, also fully open source/local) is a
   reasonable fallback if a GUI pass with manual color-region cleanup is preferred over
   a CLI batch run. Either way, expect a cleanup pass afterward — run output through
   SVGO, hand-simplify path node count, and snap stroke widths back to the
   `STYLE-GUIDE.md` outline-weight constant so vectorized and procedural poses don't
   look inconsistent if both ever ship together.

Either path also needs, before shipping: flipping the 3 hardcoded `assetExt = 'png'`
sites in `casey-companion.js` to conditionally serve `'svg'`, and a real visual diff
(old raster vs. new vector) at the actual rendered sizes used across hub/coach/library
placements, not just the 100×100 viewBox.

## Decision B — is real Lottie worth building?

Be skeptical before spending time here. Casey's current motion vocabulary (idle
breathe, one-shot success bounce, tier-switch fade) is fully served by CSS keyframes
already, at zero runtime cost, with reduced-motion handling already correct. Lottie
earns its complexity only if the goal is genuine vector-path animation — e.g., an arm
that actually draws a wave motion frame-by-frame as paths, or real confetti particle
paths on `celebrate` — not for swapping which static image is displayed, which is what
the current pose-swap system already does well.

**License reality check, since open-source/free was an explicit ask:** "free" and
"open source" diverge sharply in the Lottie ecosystem. LottieFiles' "Lottie Creator,"
Lottielab, and EasyLottie are browser-based **free-tier SaaS products, not open
source** — fine to use as free tools, not what you'd reach for if the goal is
specifically an open-source toolchain. The genuinely open-source half of the Lottie
ecosystem is the *player/runtime* side — `lottie-web` and `dotlottie-web`
(Airbnb/LottieFiles-maintained, MIT-licensed) — not authoring. A real open-source,
desktop, non-After-Effects Lottie *authoring* tool essentially doesn't exist yet;
After Effects + the Bodymovin plugin remains the professional path, which is exactly
why this was deferred rather than attempted with a workaround.

**Recommendation:** don't chase Lottie authoring tooling for Casey's current, small,
fixed motion set. If richer motion is genuinely wanted later, prefer hand-authored
SVG/CSS animation (CSS `@keyframes` or SMIL driving the vectorized SVG's own path/
transform attributes, once Decision A ships) over adding a Lottie player dependency for
a mascot whose motion vocabulary doesn't currently need it. Save real Lottie for if a
licensed animator delivers actual After-Effects-authored assets — the `casey-images.py
lottie` generator already proves the JSON-wrapping-a-raster-layer shape works
structurally, so it's ready to receive real shape-layer content if that day comes.

## Decision C (highest caution) — AI-regenerate poses instead of vectorizing them

Technically possible in 2026 via ComfyUI + an open-weight diffusion model +
IP-Adapter (identity/face lock) + ControlNet/OpenPose (pose control) — this
combination is the current state of the art for "same character, new pose," per
2026 sources. If attempted:

- Use an **Apache-2.0, genuinely open-weight, commercially-clear** model —
  **Qwen-Image** or **FLUX.2 [klein]**. Avoid **FLUX.1 [dev]**, which is
  non-commercial-use-only despite being widely called "open" in older tutorials.
- Typical reported consistency with IP-Adapter + ControlNet dual-engine workflows is
  **80–95% per generation, not 100%** — this is not a drop-in batch solve for 48+
  poses. It requires local GPU compute (a real ComfyUI + these models setup is not a
  lightweight ask) and a human review/touch-up pass on every generated pose.
- **Do not run a single unsupervised generation pass and commit the output.** The
  original 48-pose set already went through what `STYLE-GUIDE.md` describes as an
  AI-anchor-plus-compositor pipeline with human review built in
  (`style-anchor/preview-ai/` → `install-casey-pngs.sh`) — any regeneration attempt
  should budget the same review step against the `STYLE-GUIDE.md` "E8 quick check"
  list (catchlight visible at 80px, consistent outline weight, correct fur color,
  readable collar tag) before anything ships. Character drift across a large pose set
  is the normal failure mode here, not an edge case.

## Non-goals for whoever picks this up

- Don't treat "SVG exists" (Decision A, path 1) as done just because files are present
  — they're unused at runtime and only cover half the pose set.
- Don't wire up the `'lottie'` intensity-gate kind to anything without first producing
  a real Lottie asset — the gate predates any actual Lottie content and isn't proof a
  feature is half-built.
- Don't reach for a proprietary SaaS "free tier" (Lottie Creator, Lottielab, etc.) and
  call it the open-source solution — it isn't; call it out explicitly if you choose it
  anyway for convenience.
- Don't batch-regenerate the full 48-pose set via a single AI pass with no review step.
