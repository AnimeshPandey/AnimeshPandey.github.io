# Casey style anchors

| File | Purpose |
|------|---------|
| `casey-{junior,mid,staff}-front.png` | Approved AI style anchors (512px web) |
| `preview-ai/` | Source anchors + generation references |
| `casey-{tier}-front.svg` | Legacy vector fallback |
| `reference/` | User inspiration PNGs |

Install AI pose batch (after generating `casey-{tier}-{pose}.png` into Cursor assets):

```bash
cd cases && ./scripts/install-casey-pngs.sh
```

Legacy SVG regen:

```bash
cd cases && node scripts/generate-casey-svgs.mjs
```

Palette: [PALETTE.md](PALETTE.md)
