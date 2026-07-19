# Social cross-posting scripts

Automation for the four channels worth scripting, per the social & syndication
plan: **Dev.to**, **LinkedIn**, **X**, **Instagram**. Reddit, Medium, and
Hacker News deliberately have no script here — see "Why no Reddit / Medium /
Hacker News script" below.

Every script renders from the same source: `manifest.json` + a case's
`casey.json`, via `lib/content.mjs` and `lib/compose.mjs`. Nothing here
invents new copy — it reuses what's already authored.

## Quick reference

| Script | Posts to | Required env vars |
|---|---|---|
| `post-to-devto.mjs` | Dev.to | `DEVTO_API_KEY` |
| `post-to-linkedin.mjs` | LinkedIn | `LINKEDIN_ACCESS_TOKEN` |
| `post-to-x.mjs` | X | `X_ACCESS_TOKEN` |
| `post-to-instagram.mjs` | Instagram | `IG_ACCESS_TOKEN`, `IG_USER_ID` |
| `x-oauth-setup.mjs` | — (one-time helper) | `X_CLIENT_ID`, `X_CLIENT_SECRET`* |
| `linkedin-oauth-setup.mjs` | — (one-time helper) | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| `render-cards.mjs` | — (renders a PNG, posts nothing) | none — just `playwright` installed |

\* `X_CLIENT_SECRET` only if your X app is a "confidential" client.

Optional env vars, all with working defaults: `LINKEDIN_PERSON_URN` (skips
a `userinfo` lookup if set), `LINKEDIN_API_VERSION` (default `202401` —
see Known limitations below), `GRAPH_API_VERSION` (default `v21.0`,
Instagram).

Requires Node 18+ (global `fetch`) — same floor as the rest of `cases/`.
Run everything from the `cases/` directory; paths inside the scripts are
resolved from the script's own location, not your shell's cwd, but the
examples below assume you're in `cases/`.

Every `post-to-*.mjs` script:

- takes a case `slug` as its first argument (except `post-to-instagram.mjs
  --discover`, which doesn't post anything) and refuses to run if that slug
  isn't `status: "live"` in the manifest
- supports `DRY_RUN=1` to print exactly what would be sent without calling
  any API
- records what it posted in a small ledger file under `cases/src/_data/`
  (`.devto-posted.json`, `.linkedin-posted.json`, `.x-posted.json`,
  `.instagram-posted.json`) so re-running the same slug is a no-op unless
  you pass `--force` — for Dev.to, `--force` always **creates a new
  article** rather than updating the existing one; re-running *without*
  `--force` on an already-posted slug updates it in place instead

## Flags & defaults

`--tone` is validated — `junior`, `mid`, or `staff` only; anything else
(including a typo like `Junior`) now fails loudly instead of silently
posting empty content. Defaults differ **on purpose**, matching the voice
guidance in the social plan (LinkedIn = staff register, everywhere else =
junior):

| Script | Default `--tone` | Other flags |
|---|---|---|
| `post-to-devto.mjs` | `junior` | `--publish` (default: draft), `--force` |
| `post-to-linkedin.mjs` | **`staff`** | `--force` |
| `post-to-x.mjs` | `junior` | `--force` |
| `post-to-instagram.mjs` | `junior` | `--image=`, `--images=` (carousel), `--video=` (Reel), `--force`, `--discover` |

Only Dev.to has a draft/publish distinction — LinkedIn, X, and Instagram
posts go live the moment the script's real (non-dry-run) call succeeds.
There's no "unpublish" flag here; deleting a bad post means doing it by
hand on that platform.

## Setup, per platform

Nobody can hand you these credentials — you generate each one yourself,
once, by logging into your own account. I can't complete an OAuth consent
screen or click "generate" in your settings for you; the sections below are
exactly the steps only you can do, followed by what to run once you have
the result.

### Dev.to — easiest, start here

1. [dev.to/settings/extensions](https://dev.to/settings/extensions) →
   generate a **DEV Community API Key**.
2. `export DEVTO_API_KEY=...`
3. `node scripts/social/post-to-devto.mjs skeleton-screens-perceived-speed`
   — creates a **draft** on Dev.to by default. Add `--publish` once you've
   reviewed it there.

### LinkedIn

1. [linkedin.com/developers](https://www.linkedin.com/developers/apps) →
   create an app.
2. Products tab → add **Share on LinkedIn** and **Sign In with LinkedIn
   using OpenID Connect** (both free, self-serve, no partner review).
3. Auth tab → add redirect URL `http://localhost:8935/callback`.
4. `export LINKEDIN_CLIENT_ID=...` / `export LINKEDIN_CLIENT_SECRET=...`
   (from the app's Auth tab).
5. `node scripts/social/linkedin-oauth-setup.mjs` — opens your browser for
   the one-time "Allow" click, prints `LINKEDIN_ACCESS_TOKEN` to export.
6. `node scripts/social/post-to-linkedin.mjs skeleton-screens-perceived-speed`

### X

1. [developer.x.com](https://developer.x.com/) → create a free Project +
   App with **OAuth 2.0** enabled.
2. App settings → User authentication settings → add callback URL
   `http://127.0.0.1:8934/callback`; enable scopes `tweet.read`,
   `tweet.write`, `users.read`, `offline.access`.
3. `export X_CLIENT_ID=...` (and `X_CLIENT_SECRET` if the app is
   "confidential" rather than "public").
4. `node scripts/social/x-oauth-setup.mjs` — opens your browser, prints
   `X_ACCESS_TOKEN` to export.
5. `node scripts/social/post-to-x.mjs skeleton-screens-perceived-speed`

X is pay-per-use (~$0.015/post, ~$0.20 for a post containing a link — no
monthly minimum). `post-to-x.mjs` logs an estimated cost before it posts.
Verify current pricing at
[docs.x.com/x-api/getting-started/pricing](https://docs.x.com/x-api/getting-started/pricing)
before relying on that number — it has changed before.

**Token lifetime:** X access tokens are short-lived (commonly ~2 hours).
`x-oauth-setup.mjs` requests `offline.access` and prints a `refresh_token`,
but nothing refreshes it automatically yet (see Future enhancements below)
— when `post-to-x.mjs` starts failing with an auth error, just re-run
`x-oauth-setup.mjs` for a fresh `X_ACCESS_TOKEN`. LinkedIn tokens are much
longer-lived (typically ~60 days), so this is mostly an X-specific
annoyance.

### Instagram — do this one last

Instagram needs a **public HTTPS image URL** for whatever you're posting
(the Graph API cannot accept a local file upload) and a **Business/Creator
account linked to a Facebook Page**.

**The image side is built.** `render-cards.mjs` renders a "principle card"
PNG (1080×1350) for any live case, using the real `theme.css` +
`casebook-tokens.css` tokens (see its header comment for why — the card
follows whatever the live site actually renders, not a planning doc) and
the real Casey SVG for the given tone:

```bash
npm install                              # once — pulls in the playwright devDependency
npx playwright install chromium          # once — downloads a Chromium build (~170MB)
node scripts/social/render-cards.mjs skeleton-screens-perceived-speed
# → cases/src/assets/social/skeleton-screens-perceived-speed/principle-card.png
node scripts/social/render-cards.mjs --all   # every live case at once
```

That file lands in `src/assets/`, which `.eleventy.js` already
passthrough-copies — so it's not live until you commit it, `npm run
build`, and deploy. **`render-cards.mjs` only renders and saves locally —
it does not commit, build, or deploy anything.** It prints the exact
public URL and the ready-to-run `post-to-instagram.mjs` command once
that's done.

1. Convert the Instagram account to **Professional (Business or
   Creator)** and link it to a Facebook Page you admin.
2. [developers.facebook.com](https://developers.facebook.com/) → create an
   app → add yourself as a **tester** under Roles (this is what keeps you
   on self-serve "Standard Access" instead of needing full App Review —
   review is only required to publish on behalf of *other* people's
   accounts).
3. Use the Graph API Explorer (or your app's own login flow) to get a
   **User Access Token** with `instagram_basic`,
   `instagram_content_publish`, and `pages_show_list` — then exchange it
   for a **long-lived token** (Graph API `/oauth/access_token` with
   `grant_type=fb_exchange_token`; see Meta's docs for the exact call).
4. `export IG_ACCESS_TOKEN=...`
5. `node scripts/social/post-to-instagram.mjs --discover` — lists your
   linked Pages and their Instagram Business Account id.
6. `export IG_USER_ID=...` (from step 5)
7. Render + deploy a card (above), then:
   `node scripts/social/post-to-instagram.mjs skeleton-screens-perceived-speed --image=<the printed public URL>`

## Local `.env` (optional)

`lib/env.mjs` will load `scripts/social/.env` if present (`KEY=value` per
line), for any var not already set in your real shell environment. This
file is gitignored — never commit real credentials to it. CI should keep
using GitHub Actions secrets, same as `BUTTONDOWN_API_KEY` in
`send-newsletter.mjs`, not this file.

## Recommended order

1. **Dev.to** — automate immediately, it's trivial.
2. **LinkedIn**, then **X** — once the manual posting cadence has proven
   the format is worth the one-time OAuth app setup.
3. **Instagram** — last, once the social-card image pipeline exists and is
   hosted somewhere with a public URL.

## Why no Reddit / Medium / Hacker News script

- **Reddit**: new API access is now gated behind a manual approval process
  that favors commercial/established use cases, and small personal
  projects are commonly rejected. Even with access, scripted
  self-promotional posting is exactly the pattern subreddit moderation
  (and AutoModerator) is built to catch and ban. Keep this one manual,
  comment-first, and slow.
- **Medium**: stopped issuing new API integration tokens years ago. A
  legacy control still works for some accounts but is explicitly
  unsupported and could be pulled without notice — not worth building
  against when the "Import a story" flow (paste the live case URL, Medium
  fetches it and sets the canonical for you) takes under a minute by hand.
- **Hacker News**: has no public submission API at all, by design — it's
  core to how they stay spam-resistant. It's also meant to be a single
  "Show HN" event at a real milestone, not a recurring post.

## Known limitations & future enhancements

What's genuinely missing today, not a wishlist — each of these is a real
gap found while building and dry-running these scripts.

- **`concept` and `fe-depth` hints are often boilerplate — guarded, not
  fixed.** Auditing all 31 live `casey.json` files turned up 11 sentences
  reused near-verbatim across most or all cases — `concept/staff` is
  *identical in all 31*. `hook` and `demo` are fine (0 duplicates). `lib/
  content.mjs`'s `KNOWN_BOILERPLATE_HINTS` set drops these known strings
  so nothing posted looks templated, and the composers degrade gracefully
  when that leaves `concept`/`fe-depth` empty (LinkedIn/X posts get
  shorter; Dev.to skips the heading). That's a safety net, not a content
  fix — the real fix is authoring case-specific `concept`/`fe-depth` text
  for the affected cases, which is a writing task, not a scripting one.
- **The card renderer ships one card type.** `render-cards.mjs` /
  `lib/card-template.mjs` build a "principle card" (title + principle +
  hook + Casey). The plan's "Casey Explains" carousel format (mascot +
  quote bubble, no title) isn't built — `buildPrincipleCardHtml` would need
  a sibling, not a rewrite, since it already reads the real theme tokens
  and Casey SVGs.
- **Rendered cards aren't wired into deploy.** `render-cards.mjs` writes to
  `src/assets/social/` locally; nothing commits, builds, or deploys that
  automatically. You render, review, commit, push, wait for the deploy,
  *then* the printed public URL actually resolves and
  `post-to-instagram.mjs` can use it. A `--all` batch-render right after a
  publish cycle, committed alongside it, would close that gap.
- **The site's real accent isn't the accent BRANDING.md describes.**
  Found while building the card renderer: `casebook-layout.njk` hardcodes
  `data-theme="light"` on every case page, which resolves to the
  portfolio's terracotta `--accent` (`#BF5A32`) — not the sage green
  (`#5a7a5e`) the planning docs call "LOCKED." The card renderer
  deliberately follows the real site (reads the actual `theme.css` +
  `casebook-tokens.css` at render time) rather than hardcoding either
  color, so it'll self-correct if that gets reconciled — but the
  discrepancy itself is worth resolving in one direction or the other.
- **X token refresh isn't automated.** See "Token lifetime" above — the
  refresh token is printed and thrown away. A `lib/x-refresh.mjs` that
  trades it for a new access token before each post (and updates
  `scripts/social/.env` in place) would remove the "re-run oauth-setup
  every couple hours" friction entirely.
- **LinkedIn's API version is a hardcoded guess.** `LINKEDIN_API_VERSION`
  defaults to `'202401'` in `post-to-linkedin.mjs`. LinkedIn expires
  versioned endpoints after roughly a year; nothing here warns when the
  pinned version is going stale — posts would just start failing one day
  with no warning beforehand. Worth a startup check that warns if the
  pinned version is more than ~10 months old.
- **No single command to post everywhere.** Cross-posting one case today
  is three separate commands (`post-to-devto.mjs`, `post-to-linkedin.mjs`,
  `post-to-x.mjs`). A thin `post-all.mjs <slug>` wrapper — same `--tone`
  and `DRY_RUN` semantics, one process exit code — is a reasonable next
  step once the manual three-command cadence gets old enough to justify it.
- **Nothing is wired into CI yet, on purpose.** These scripts are
  manual-only, matching the plan's own start-manual-then-automate
  sequencing. Once a channel's cadence is proven worth automating, Dev.to
  is the obvious first candidate to add as a step in
  `casebook-publish-scheduled.yml`, gated by the same
  `casebook-publish` environment/human-confirm pattern the newsletter step
  already uses — not by silently auto-posting on every deploy.
- **Reddit's API terms are worth re-checking periodically.** The decision
  to keep Reddit fully manual is a 2026 snapshot (approval-gated API,
  self-promo-hostile culture) — if that policy loosens materially, revisit
  it; nothing about the ledger/compose architecture here would need to
  change to add a fifth `post-to-reddit.mjs` later.

## Testing without spending anything

Every posting script honors `DRY_RUN=1`:

```bash
DRY_RUN=1 node scripts/social/post-to-x.mjs skeleton-screens-perceived-speed
```

Run that before wiring real credentials for any channel — it prints
exactly what would be sent (and, for X, the estimated cost) so you can
sanity-check the generated copy first.
