# Casey STYLE-GUIDE (reference-harmonized)

**References:** `ideas/projects/case-studies/assets/casey/reference/`  
**Harmonization:** [HARMONIZATION.md](../../../../../../ideas/projects/case-studies/assets/casey/reference/HARMONIZATION.md)  
**Palette:** [style-anchor/PALETTE.md](style-anchor/PALETTE.md)

## Art direction

- Clean vector mascot: **thick dark outlines**, flat/soft cel fills, premium-cute (Notion/Linear editorial — not stock clipart).
- **viewBox:** `0 0 100 100` for all pose SVGs; character ~65% of frame; 8px padding.
- **Runtime assets:** raster PNG (512px max edge) per pose, **RGBA with true transparency** (run `scripts/fix-casey-transparency.py` after AI export or `install-casey-pngs.sh`).
- **Regen:** AI anchors in `style-anchor/preview-ai/` → pose batch → `scripts/install-casey-pngs.sh`.

## Tier proportions

| Tier | Head | Eyes | Body | Accessories |
|------|------|------|------|-------------|
| **junior** | Largest (rx≈24) | Largest iris | Roundest; sage hoodie `#8BAF9F` | Tiny laptop hint optional |
| **mid** | Medium (rx≈22) | Standard | Leaner; hoodie `#7CA897` | Headphones band |
| **staff** | Smallest (rx≈20) | Slightly smaller | Sweater `#D4C5B0` | Reading glasses (eyes visible) |

## Pose inventory

**Core (coach FSM):** `idle` · `blink` · `perk` · `point` · `think` · `celebrate` · `sleep` · `wave`

**Guide (companion):** `welcome` · `present` · `proud` · `support` · `read`

**Micro (FSM):** `curious` (demo idle) · `nod` (hub filter) · `focus` (demo CTA) — AI PNG via `CASEY_SRC` + `install-casey-pngs.sh` (compositor fallback only with `--force`)

| Pose | Where |
|------|--------|
| `present` | Hub — first visit |
| `welcome` | Hub — return visit |
| `read` | `/library/` strip |
| `proud` | Case takeaway chapter |
| `support` | Demo broken toggle |

Primary poses: AI-generated PNGs via `scripts/install-casey-pngs.sh`. Spec: `ideas/.../CASEY-AI-GENERATION.md`. Fallback SVG: `scripts/generate-casey-svgs.mjs`.

Motion: `casey-breathing`, `casey-bounce-once`, `casey-tier-fade` in `casebook-components.css`.

## E8 quick check

- [ ] Catchlight visible at 80px
- [ ] Fur warm off-white (not green body, not tabby)
- [ ] Collar tag readable
- [ ] Same outline weight across tier grid
