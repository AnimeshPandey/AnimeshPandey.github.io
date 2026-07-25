# Casey regeneration playbook (operational)

**Audience:** agents and humans regenerating or extending Casey PNG assets.  
**Product-level prompts:** [`ideas/.../CASEY-GENERATION-PLAYBOOK.md`](../../../../../../ideas/projects/case-studies/assets/casey/CASEY-GENERATION-PLAYBOOK.md) · [`CASEY-PROMPT.md`](../../../../../../ideas/projects/case-studies/assets/casey/CASEY-PROMPT.md)  
**Palette:** [`style-anchor/PALETTE.md`](style-anchor/PALETTE.md) · **Art direction:** [`STYLE-GUIDE.md`](STYLE-GUIDE.md)  
**Pipeline rule:** [`.cursor/rules/casey-asset-pipeline.mdc`](../../../../.cursor/rules/casey-asset-pipeline.mdc)

Do **not** hand-edit PNG pixels. Always: AI export → `CASEY_SRC` → `scripts/install-casey-pngs.sh` → static asserts.

---

## 1. When to regenerate

| Trigger | Action |
|---------|--------|
| Mottled / static / glitch fur on paws, feet, tail, or neck | Full or targeted pose regen + extremities assert |
| New pose for coach / companion / hub | Add prompt + install lists + FSM/JSON wiring |
| New career tier | New anchor → all poses for that tier |
| Style refresh (palette / proportions) | Re-approve 3 anchors, then batch all poses |
| Matte / checker / floor regressions | Fix sources; do not weaken validators |

---

## 2. Inventory

### Style anchors

| File | Role |
|------|------|
| `style-anchor/casey-{junior,mid,staff}-front.png` | Locked identity references |
| `style-anchor/preview-ai/casey-{tier}-anchor-preview.png` | AI preview copies used by install fallbacks |

### Runtime poses (per tier: `junior` · `mid` · `staff`)

| Group | Poses | Primary consumers |
|-------|-------|-------------------|
| **Core** | `idle` `blink` `perk` `point` `think` `celebrate` `sleep` `wave` | Coach FSM (`casey-coach.js`, `casey-interactions.json`) |
| **Guide** | `welcome` `present` `proud` `support` `read` | Hub / library / takeaway / demo (`casey-companion.js`, hub) |
| **Companion** | `curious` `nod` `focus` | Demo idle / hub filter / CTA |

Paths: `cases/src/assets/casey/{tier}/{pose}.png` (runtime). SVG siblings are fallbacks only.

### `CASEY_SRC` naming (pre-install)

```text
casey-{tier}-{pose}.png          # e.g. casey-junior-celebrate.png
casey-{tier}-front.png           # optional; install also uses preview-ai anchors
```

Default staging directory on this machine:

```bash
export CASEY_SRC="$HOME/.cursor/projects/Users-animeshpandey-Documents-Codebases/assets"
```

### Install aliases (only when a guide source is missing)

From `scripts/install-casey-pngs.sh`:

| Guide pose | Falls back to |
|------------|---------------|
| `welcome`, `present` | `wave` |
| `proud` | `celebrate` |
| `support`, `read` | `think` |

Companion poses derive from core via `casey-images.py poses` (`curious`←`think`, `nod`←`perk`, `focus`←`point`) when AI sources are absent — prefer unique AI sources for quality.

### Pipeline outputs (do not hand-author)

- Hub WebP heroes, OG share card (`casey-images.py webp` / `og`)
- Lottie idle image copies under `casey/lottie/{tier}/images/idle.png`

---

## 3. Locked palette and proportions

See [`PALETTE.md`](style-anchor/PALETTE.md) and [`STYLE-GUIDE.md`](STYLE-GUIDE.md).

| Element | Hex |
|---------|-----|
| Outline | `#2D2A3E` |
| Fur base | `#FAFAF8` |
| Fur shadow | `#EDE8DF` |
| Eye iris / limbus / pupil | `#5BADF0` / `#1A6FC4` / `#1A1A2E` |
| Inner ear / blush / nose | `#F2C4C4` / `#F2C4C4` / `#F0A0A0` |
| Junior hoodie | `#8BAF9F` |
| Mid hoodie | `#7CA897` |
| Staff sweater | `#D4C5B0` |
| Tag / tag glyph | `#E8D5B0` / `#5E8F72` `</>` |
| Mid headphones | `#5A5A6E` |
| Staff glasses | `#8B7355` |

**Hard rule:** paws, feet, tail, cheeks, and neck fur are solid warm off-white — never mottled, static, glitch, checkerboard-in-fur, or dark blue/black speckles. Outlines continuous; no horizontal neck seam.

---

## 4. Copy-paste prompts

### Master (every image)

```text
Original character Casey: frontend developer cat mascot, soft anime cartoon style,
clean thick dark outlines (#2D2A3E), flat cel fills, premium-cute (not realistic photo).
Warm off-white fur #FAFAF8 on head, paws, feet, and tail — solid flat fill, no noise.
Bright blue eyes with catchlight (unless pose is blink/sleep). Soft pink blush and inner ears.
Gold circular collar tag with black </> coding symbol.
Transparent background. No studio floor. No watermark. No extra text.
Consistent character identity across the series.
```

### Anti-corruption negatives (every image)

```text
NO mottled fur, NO static noise, NO glitch texture, NO checkerboard baked into fur,
NO dark blue/black speckles on paws or tail, NO horizontal seam or cut line at neck,
NO broken outlines on feet or tail, NO studio floor, NO watermark,
NO text except the </> tag glyph, NO photorealistic fur grain.
Paws, feet, and tail: flat solid warm white fur #FAFAF8 with clean thick outline;
pink paw pads only on pad circles.
```

### Tier blocks (append one)

**Junior**

```text
TIER: Junior. Small fluffy kitten, roundest body, largest head and blue eyes,
oversized sage-green hoodie #8BAF9F with kangaroo pocket, eager apprentice energy.
```

**Mid**

```text
TIER: Mid. Same cute kawaii proportions and face as junior (large head, huge blue eyes,
pink blush, w-smile) — still adorable and soft, NOT a cool skinny adult.
Only slightly less round than the kitten. Fitted sage-green hoodie #7CA897 with drawstrings,
dark headphones #5A5A6E resting around the neck (not on ears), gold </> tag.
Sitting cute with paws in lap — never arms crossed, never swagger pose.
```

**Staff**

```text
TIER: Staff. Mature adult cat, composed posture, same white fur and blue eyes,
subtle reading glasses #8B7355 (eyes still visible), neat sweater #D4C5B0, calm authority.
```

### Pose blocks (append one)

| Pose | Prompt suffix |
|------|----------------|
| `idle` | sitting front-facing, calm attentive, paws resting in front |
| `blink` | same as idle, eyes closed in a happy blink |
| `perk` | ears up, alert smile, new-chapter energy |
| `point` | one paw pointing right toward UI, teaching gesture |
| `think` | head tilted, one paw near chin, considering a bug |
| `celebrate` | joyful victory; junior may raise both paws; solid white paws and fluffy white tail |
| `sleep` | curled peacefully sleeping (reduced-motion fallback) |
| `wave` | one paw raised in friendly hello |
| `welcome` | warm greeting pose for hub return visit |
| `present` | presenting / introducing for hub first visit |
| `proud` | satisfied takeaway pride |
| `support` | gentle supportive expression for broken-demo empathy |
| `read` | quiet reading / library strip pose |
| `curious` | slight lean / interest (demo idle) |
| `nod` | small affirming nod energy (hub filter) |
| `focus` | focused CTA attention |

---

## 5. Step-by-step regen loop

1. **Isolate** — work in a git worktree (e.g. `.worktrees/casey-full-regen`), not a dirty main checkout.
2. **Approve anchors** — regenerate `casey-{tier}-front` with master + tier + negatives; visual gate on face, tag, fur.
3. **Generate poses** — for each tier: core → guide → companion. Pass approved anchor via `reference_image_paths`. Save as `casey-{tier}-{pose}.png` under `CASEY_SRC`.
4. **Reject early** — drop any export with mottled extremities or neck seam; regenerate before install.
5. **Install**

```bash
cd cases
export CASEY_SRC="$HOME/.cursor/projects/Users-animeshpandey-Documents-Codebases/assets"
./scripts/install-casey-pngs.sh
```

6. **Static QA** (from repo root / `tests`)

```bash
node tests/static/assert-casey-fur.mjs
node tests/static/assert-casey-extremities.mjs
node tests/static/assert-casey-no-checker.mjs
node tests/static/assert-casey-floor-matte.mjs
```

7. **Visual E8** — catchlight at 80px; warm fur (not green body); tag readable; outline weight consistent; paws/tail clean.
8. **Commit** assets + docs + asserts together on the feature branch.

---

## 6. How to add a new pose

1. Add a pose prompt row to this doc and to `CASEY-PROMPT.md` / playbook if product-facing.
2. Extend pose lists in `scripts/install-casey-pngs.sh` (`CORE_POSES` / `GUIDE_POSES` / `COMPANION_POSES` as appropriate).
3. If companion-derived, add mapping in `scripts/casey-images.py` `COMPANION_POSES`.
4. Wire runtime: `casey-interactions.json`, coach/companion JS, and any hub/library partials that select the pose.
5. Generate `casey-{tier}-{newpose}.png` × 3 tiers → install → asserts → visual QA.
6. Update the inventory table above.

---

## 7. Failure modes → asserts

| Symptom | Likely cause | Assert / fix |
|---------|--------------|--------------|
| Black silhouette, almost no white | Matte flood ate fur | `assert-casey-fur.mjs` — restore sources; check `CHARACTER_SWATCHES` in `fix-casey-transparency.py` |
| Mottled/static paws or tail | Bad AI fill on extremities | `assert-casey-extremities.mjs` — regenerate with anti-corruption negatives |
| Checkerboard visible in product | Baked checker or bad alpha | `assert-casey-no-checker.mjs` — regen transparent; re-run transparency |
| White stage under feet | Studio floor in export | `assert-casey-floor-matte.mjs` + `validate-casey-src.py` — regen with no floor |
| Install skips pose | Missing `CASEY_SRC` file | Name must be `casey-{tier}-{pose}.png` |

Do **not** weaken thresholds to greenwash a bad export.

---

## 8. Brand IP packs (beyond coach poses)

Runtime coach still uses the 16 PNG poses. Brand packs live under `cases/src/assets/casey/brand/` and are generated from **approved junior poses** (no hand-pixel edits):

```bash
python3 cases/scripts/generate-casey-brand-pack.py
```

| Pack | Path | Use |
|------|------|-----|
| **Chrome** | `brand/chrome/` + `/brand/casey-*.png` + `casebook-favicon.svg` | Favicon, apple-touch, PWA 192/512, `casebook.webmanifest` |
| **Reactions** | `brand/reactions/*.png` (128²) | Interview/search micro-acks (`casey-reaction-chip`) |
| **Status** | `brand/status/{404,empty-filter,error,loading,email-header}.png` | Empty/error/404/email headers |
| **Social** | `brand/social/og-casey-forward.png` (+ LinkedIn/X) | Default OG (`brand/themes/casey-share-premium.png`) |
| **Milestones** | `brand/milestones/*.svg` | Prefs milestone stamps |

### When to add a pose vs a sticker

| Need | Prefer |
|------|--------|
| Coach/hub FSM state the reader sees for seconds | **Pose** (full body, tiered) |
| Tiny inline ack (toast, interview chip, 48px) | **Reaction sticker** |
| Full-bleed empty/error/email/social | **Status / social scene** |
| Badge in prefs / takeaway flash | **Milestone stamp** |

Fresh AI exports for brand packs (optional quality bump): put sources in `CASEY_SRC` as `casey-brand-{pack}-{name}.png`, then extend `generate-casey-brand-pack.py` — until then, derived junior crops are the shipped baseline.

**QA scope:** Brand packs are **not** coach poses. The old enclosed-hole / stray-pixel / alpha unit scanners were removed (#81); do not reintroduce scanners that walk `brand/` as if it were `junior|mid|staff` pose dirs. Pose coverage stays on `tests/static/assert-casey-pose-coverage.mjs` (the 16 named poses × 3 tiers).

**Deploy:** Repo-root `brand/` (favicon, PWA icons, `casebook.webmanifest`, themes OG) is outside Eleventy — `static-pages.yml` / `build-deploy.mjs` must rsync it into `_deploy/brand/`. Casebook stickers under `cases/src/assets/casey/brand/` ship via the cases Eleventy passthrough as `/cases/assets/casey/brand/`.

---

## 9. Do / don’t

**Do**

- Regenerate with references to approved anchors
- Run the full install script (transparency + webp + lottie)
- Keep extremities assert green before merge
- Document new poses here
- Re-run `generate-casey-brand-pack.py` after junior pose regen if faces changed

**Don’t**

- Hand-paint or clone-stamp PNG pixels in the repo
- Skip `fix-casey-transparency.py`
- Commit only some tiers of a pose set
- Point `CASEY_SRC` at stale Desktop paths on this machine
- Lower QA thresholds to pass mottled art
- Add a new coach pose when a reaction sticker would do