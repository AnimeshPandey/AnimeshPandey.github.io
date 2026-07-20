# CLAUDE.md

Monorepo: personal portfolio + **The Frontend Casebook**, deployed together as one static site. Read `README.md` first for the architecture diagram and live URLs; this file covers the gotchas that aren't obvious from the repo layout.

## Shape

- `site/` — portfolio, own Eleventy build.
- `cases/` — Casebook, own Eleventy build, `pathPrefix: /cases/`. See `cases/README.md` for its own structure and content workflow.
- Both build independently, then get merged into one `_deploy/` artifact by `.github/workflows/static-pages.yml` (`site/_site/` → `_deploy/`, `cases/_site/` → `_deploy/cases/`). Building `cases/` alone will 404 on `/assets/theme.css` — that file is served from the portfolio root in production; local Casebook dev without a second server at the portfolio root falls back to unstyled tokens (this is documented, not a bug — see `cases/README.md`).
- `ideas/IDEAS.md` in this repo is an unrelated scratch note — the real planning/spec repo for the Casebook is the sibling `ideas` repo (`ideas/projects/case-studies/`), not this file.

## The theme-token chain (read before touching Casebook colors)

`cases/src/assets/css/casebook-tokens.css` aliases `--casebook-*` names to the portfolio's `--bg`/`--ink`/`--accent`/etc, which are defined in `assets/theme.css` at the repo root. `cases/src/_includes/layouts/casebook-layout.njk` hardcodes `data-theme="light"` on every Casebook page — so the Casebook's actual rendered accent is the portfolio's **light-theme terracotta** (`#BF5A32`), not the sage green the planning repo's `BRANDING.md` calls "locked." This is a known, logged discrepancy (see that doc's decision log), not something to silently "fix" by guessing which one is right.

## Social cross-posting scripts (`cases/scripts/social/`)

Manifest-driven automation for Dev.to/LinkedIn/X/Instagram — full guide in that folder's own `README.md`. Two things worth knowing before touching it:
- Every script supports `DRY_RUN=1` — use it before any real change, no credentials required.
- `lib/content.mjs`'s `KNOWN_BOILERPLATE_HINTS` guards against publishing near-duplicate `casey.json` content (a real, audited finding — `concept`/`fe-depth` hints are boilerplate across most live cases). Don't remove it without fixing the underlying content first. `cases/scripts/content/` has a draft-generator for that fix — it drafts, a human reviews, nothing is applied automatically (see its own `README.md`).

## Publishing gate

Cases go `draft` → `scheduled` → `live` via `confirm-publish.py` (in the `ideas` repo) + `.github/workflows/casebook-publish-scheduled.yml`. **Nothing goes live on a timer without an explicit human confirm** — don't "helpfully" flip a manifest entry to `live` to unblock a task.

## Verifying case counts

The manifest (`cases/src/_data/manifest.json`) is the only source of truth for case counts (currently 229 total, 31 live — check `stats` in that file, don't trust a number from prose). It has drifted in other docs before; grep before citing.

## Git workflow — this repo has concurrent automated activity

Branch → PR → code review → merge, same as anywhere, but treat it as a hard requirement here specifically: this repo has an autonomous session shipping its own PRs on its own branches at the same time yours might run. **Use an isolated `git worktree`** (`git worktree add <path> -b <branch> origin/main`) for any change instead of committing in the shared checkout — the shared working directory's checked-out branch and uncommitted state can change out from under you mid-task. Never assume the directory you started in is still on the branch you left it on.
