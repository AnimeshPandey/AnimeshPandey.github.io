# Repository identity

Use this GitHub account and remote for **all** work on this repo (clone, push, PRs, `gh` CLI).

| Item | Value |
|------|--------|
| **GitHub username** | [`AnimeshPandey`](https://github.com/AnimeshPandey) |
| **Repository** | `AnimeshPandey/AnimeshPandey.github.io` |
| **Remote `origin`** | `https://github.com/AnimeshPandey/AnimeshPandey.github.io.git` |
| **Pages site** | https://anmshpndy.com (custom domain) · https://animeshpandey.github.io |

## Do not use

- Alternate GitHub accounts for pushes, PRs, or deploy credentials on this repository
- Remotes pointing at forks under other accounts unless explicitly requested

## Local git (this clone)

Set **repository-local** config so commits attribute to the portfolio owner:

```bash
git config --local user.name "Animesh Pandey"
# GitHub noreply — ties commits only to @AnimeshPandey (Settings → Emails → Keep my email addresses private)
git config --local user.email "18488164+AnimeshPandey@users.noreply.github.com"
```

Verify:

```bash
git config --local --get user.name
git remote get-url origin
gh auth status   # should show: account AnimeshPandey
```

## Agents & CI

- Run `gh` and `git push` only when authenticated as **AnimeshPandey**
- GitHub Actions deploy uses `GITHUB_TOKEN` from this repo — no change needed for account name
- Commit author on new work should use the noreply email above so GitHub attributes commits to [@AnimeshPandey](https://github.com/AnimeshPandey) only

## GitHub Actions secrets (Settings → Secrets and variables → Actions)

| Secret name (preferred) | Also accepted | Injected into |
|-------------------------|---------------|---------------|
| `W3F_ACCESS_KEY` | `WEB3FORMS_ACCESS_KEY` | `assets/contact.js`, `index.html` meta `web3forms-access-key` |
| `CF_BEACON_TOKEN` | `CLOUDFLARE_BEACON_TOKEN` | All `*.html` (`YOUR_CF_BEACON_TOKEN`) |

Deploy fails the inject step if placeholders remain after `sed`. **Repository** secrets (not Environment-only) are required unless you duplicate them on the `github-pages` environment.

After changing secrets, push to `main` or re-run **Deploy static site to GitHub Pages**. Users with an old service worker should hard-refresh once (cache bumped to `ap-v23`).

## Why you might still see the old username

After a history rewrite, **old commit URLs** (pre–force-push SHAs) can remain on GitHub’s servers and still show the previous account if opened directly. The **`main` branch** and the [commits page](https://github.com/AnimeshPandey/AnimeshPandey.github.io/commits/main) should list only **AnimeshPandey**. Hard-refresh (Cmd+Shift+R) or use an incognito window.

Ensure `animesh@lifesight.io` is **not** verified on any other GitHub account, or remove it from that account’s email settings.
