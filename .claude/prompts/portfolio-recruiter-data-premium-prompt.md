# Claude Prompt — Portfolio Master Implementation (Recruiter + Contact + Polish)

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · vanilla JS · GitHub Pages · **no build step**

**Canonical architecture:** [portfolio-architecture-prompt.md](portfolio-architecture-prompt.md) · [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)

**Structural cleanup first (recommended):** [portfolio-architecture-alignment-prompt.md](portfolio-architecture-alignment-prompt.md) — slim `nav.js`, consolidate homepage behaviour in `visuals.js`, before premium recruiter UI work.

**This is the master implementation backlog** for recruiter data/chrome, contact, and panel polish. Historical prompts (`portfolio-recruiter-mode-prompt.md`, UX refinement, visuals, contact-only, etc.) are **built/outdated** — do not treat as greenfield specs.

---

## Your role

Staff frontend engineer + editorial systems designer. Fix factual drift, keep a **single header entry** for recruiter mode, polish the briefing panel, and verify contact behaviour — without adding a build step or backend.

---

## Shipped (do not rebuild)

| Area | Status |
|------|--------|
| Recruiter panel | Lazy load chain; scan → structured brief; copy; `?recruiter=1` |
| Data layer | `profile-facts.js` + `recruiter-data.js` derivation |
| Chrome | `#rm-strip` removed; header icon-only toggle + exit |
| Page effects | No dimming/blocking of `#writing` or FAQ |
| Visuals / eggs | Tiered lazy eggs; hero canvas capability-gated |
| Contact wiring | Web3Forms POST; honeypot; in-page feedback |
| SW | `ap-v19` precaches recruiter + facts |

---

## Still open / verify

| ID | Task |
|----|------|
| **R-sync** | After any copy change: `index.html` ↔ `profile-facts.js` ↔ FAQ JSON-LD ↔ resume.tex |
| **R-chrome** | Confirm `syncToggles` in `recruiter.js` / `visuals.js` only references live IDs (`#header-rm-toggle`, `#header-rm-exit`) |
| **R-premium** | Panel typography, scan pacing, mobile sheet safe-area, minimize vs exit clarity |
| **C-prod** | Production POST with `W3F_ACCESS_KEY` secret; placeholder not live |
| **C-success** | No programmatic `mailto:` on `data.success` (manual links OK) |

---

## Phase 1 — Data accuracy

Authority order: `index.html` → `profile-facts.js` → `recruiter-data.js` (derived).

| Field | Must match page |
|-------|-----------------|
| Lifesight | Sept 2025 – Present |
| Tekion | Apr 2022 – Sept 2025 |
| Vassar Labs | On timeline |
| Education | CPI 7.9 (not CGPA 8.7) |

Never hand-edit dates/scores in `recruiter-data.js`.

---

## Phase 2 — Single header control

**Keep:** `#header-rm-toggle`, `#header-rm-exit` (icon-only, 44px).

**Do not restore:** `#rm-hero-toggle`, footer recruiter toggle, `#mobile-rm-btn` in mobile nav, `#rm-strip`.

---

## Phase 3 — Premium panel polish

- Executive summary scannable (short paragraphs, not wall of text)
- At-a-glance grid aligned with `.stat-n` on page
- Fit signals honest (no “AI” claims unless wired)
- Footer CTAs: Resume download, Email (user-initiated), scroll to `#contact`
- `_lastRenderMs` cache: preserve 2-minute reuse behaviour

---

## Phase 4 — Contact & analytics

| Item | Detail |
|------|--------|
| Web3Forms | `assets/contact.js` — `W3F_KEY` replaced at deploy |
| GitHub secret | `W3F_ACCESS_KEY` |
| CF beacon | `CF_BEACON_TOKEN` → `sed` in all `*.html` |
| Missing secret | Deploy succeeds; config message in form; no auto mailto |

---

## Verification

- [ ] `?recruiter=1` opens mode + panel
- [ ] Network: recruiter bundle absent until first toggle
- [ ] Brief dates match timeline and FAQ
- [ ] Exit clears mode; minimize only closes panel
- [ ] Contact POST on production with secret set
- [ ] SW cache bumped if JS/CSS changed

---

## Execution

1. Read architecture prompt + `docs/ARCHITECTURE.md` recruiter/contact sections.  
2. Minimal diff per phase.  
3. Bump `sw.js` `CACHE` if cached assets change.  
4. Update `docs/ARCHITECTURE.md` if contracts change.
