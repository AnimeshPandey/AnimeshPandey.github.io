# Casey STYLE-GUIDE (reference-harmonized)

**References:** `ideas/projects/case-studies/assets/casey/reference/`  
**Harmonization:** [HARMONIZATION.md](../../../../../../ideas/projects/case-studies/assets/casey/reference/HARMONIZATION.md)  
**Palette:** [style-anchor/PALETTE.md](style-anchor/PALETTE.md)

## Art direction

- Clean vector mascot: **thick dark outlines**, flat/soft cel fills, premium-cute (Notion/Linear editorial — not stock clipart).
- **viewBox:** `0 0 100 100` for all pose SVGs; character ~65% of frame; 8px padding.
- **Runtime assets:** raster PNG (512px max edge) per pose; legacy SVG kept for reference/regen.
- **Regen:** AI anchors in `style-anchor/preview-ai/` → pose batch → `scripts/install-casey-pngs.sh`.

## Tier proportions

| Tier | Head | Eyes | Body | Accessories |
|------|------|------|------|-------------|
| **junior** | Largest (rx≈24) | Largest iris | Roundest; sage hoodie `#8BAF9F` | Tiny laptop hint optional |
| **mid** | Medium (rx≈22) | Standard | Leaner; hoodie `#7CA897` | Headphones band |
| **staff** | Smallest (rx≈20) | Slightly smaller | Sweater `#D4C5B0` | Reading glasses (eyes visible) |

## Pose inventory

`idle` · `blink` · `perk` · `point` · `think` · `celebrate` · `sleep` · `wave`

Primary poses: AI-generated PNGs installed via `scripts/install-casey-pngs.sh`. Fallback vector regen: `scripts/generate-casey-svgs.mjs`.

## E8 quick check

- [ ] Catchlight visible at 80px
- [ ] Fur warm off-white (not green body, not tabby)
- [ ] Collar tag readable
- [ ] Same outline weight across tier grid
