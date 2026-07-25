# Casey Charm, Usefulness & Brand-IP — Design Spec

**Date:** 2026-07-25  
**Branch / worktree:** `feat/casey-charm-roadmap` · `.worktrees/casey-charm-roadmap`  
**Runtime source of truth:** PNG pose FSM (`casey-companion.js` + `casey-interactions.json`)

## Goal

Turn Casey from a decorative PNG sticker + breathe loop into distinctive, useful Casebook IP—without redesigning the character bible or replacing PNG runtime with SVG/Lottie-first.

## Pose visibility matrix

| Pose | Intended trigger | Pre-fix status | Target status |
|------|------------------|-----------------|---------------|
| `idle` | Coach rest, prefs | Wired | Keep |
| `blink` | 4–8s timer | Wired | Keep |
| `perk` | Case hook; hint; hub idle (rotate) | Cases OK; hub remapped → `present` | Visible on hub |
| `point` | Demo; interview/review start; ui-strip; concept→demo chip | Wired | Keep + teach moments |
| `think` | Concept / FE-depth; hub idle mix | Wired | Keep |
| `celebrate` | Demo fixed; milestones; onboarding; interview high | Wired | Keep |
| `sleep` | PRM; intensity off | Wired | React to PRM *changes* mid-session |
| `wave` | Hub first-visit; onboarding; hub idle | Underused / remapped | Distinct on hub |
| `welcome` | Hub return visit; Guide return | Fragile / remapped | Distinct on hub |
| `present` | Hub base (after settle); about; interview | Overloaded | Still base; not a dump for wave/welcome/perk |
| `proud` | Takeaway; interview yes | Wired | Keep |
| `support` | Demo broken; interview no / stuck | Wired | + stuck nudge |
| `read` | Library; references | Wired | Keep |
| `curious` | Demo idle; empty filter; story chapters; 404 | Partial | + story + 404 + companies empty |
| `nod` | Hub click/idle; peek; CTA hover | Wired | Keep |
| `focus` | Demo control hover | Easy to miss | Keep |

**Dead / weak (addressed by phase):**

- `story-1` / `story-2` / `ui-strip` → `idle` → Phase 2 assigns `curious` / `curious` / `point`
- CSS crossfade / enter classes unused → Phase 1 wires them
- `--casey-bounce-px` set but bounce hardcodes `-6px` → Phase 1
- Prefs → `/about/#casey` missing `id` → Phase 2
- Unused hub empty / hero WebPs → Phase 2 wire or delete

## Architecture decisions

1. **Crossfade:** Dual-layer `<img>` inside `.casey-avatar-frame` (incoming fades in, outgoing fades out). Skip when PRM or same URL. Keep `singleImgInFrame` only for first paint / teardown, not every swap.
2. **Hub remap:** Remove `wave` / `welcome` / `perk` → `present` collapse. `safeHubPose` only aliases unknown poses.
3. **Hub choreography:** First visit `wave` → settle `present`; return `welcome` → settle `present`. Idle mix may roll `wave` / `perk` / `think` when intensity allows `rotate`.
4. **Pose coverage test:** Static assert fails if a declared pose has zero call sites *or* is only reachable through a remap that collapses it away.
5. **Brand packs (Phase 3):** Prefer junior-cropped / SVG chrome derived from existing PNGs when fresh AI exports are unavailable; document full AI path in `REGENERATION.md`.

## Acceptance criteria

### Phase 1 — Charm & motion
- [ ] Pose change crossfades (not hard `src` pop) when motion allowed
- [ ] Hub shows `wave` (first visit) and `welcome` (return) distinctly
- [ ] Bounce amplitude uses `--casey-bounce-px` (differs by tier)
- [ ] Toggling `prefers-reduced-motion` mid-session reconfigures blink/float/sleep
- [ ] `assert-casey-pose-coverage.mjs` green

### Phase 2 — Useful coach moments & UX
- [ ] Story chapters not stuck on `idle`; ui-strip uses `point`
- [ ] About deep-link `#casey` works from prefs
- [ ] Companies empty + site 404 show Casey
- [ ] Hub avatar click suggests a concrete next unread case
- [ ] Config hygiene: stale “779” copy aligned or dynamic; greeting path not double-overwriting

### Phase 3 — Brand IP
- [ ] Casebook favicon / PWA icons are Casey-forward
- [ ] Reaction chip set + at least one status scene shipped and wired
- [ ] OG / social default uses Casey-forward banner
- [ ] `REGENERATION.md` documents packs + pose-vs-sticker guidance

## Explicit non-goals

- Redesigning Casey’s character bible / palette
- SVG-first runtime (SVG stays fallback)
- Full Lottie rewrite before Phase 1 crossfade is proven
- Regenerating the entire 48-pose library again

## Verification

- Static: existing Casey asserts + pose-coverage (+ bounce var smoke if practical)
- Manual / Playwright (as available): hub entrance, coach chapter scroll, demo broken→fixed, 404, about `#casey`
