# Repository identity

Use this GitHub account and remote for **all** work on this repo (clone, push, PRs, `gh` CLI).

| Item | Value |
|------|--------|
| **GitHub username** | [`AnimeshPandey`](https://github.com/AnimeshPandey) |
| **Repository** | `AnimeshPandey/AnimeshPandey.github.io` |
| **Remote `origin`** | `https://github.com/AnimeshPandey/AnimeshPandey.github.io.git` |
| **Pages site** | https://anmshpndy.com (custom domain) · https://animeshpandey.github.io |

## Do not use

- GitHub user **`animesh-lifesight`** for pushes, PRs, or deploy credentials on this repository
- Remotes pointing at forks under other accounts unless explicitly requested

## Local git (this clone)

Set **repository-local** config so commits attribute to the portfolio owner:

```bash
git config --local user.name "Animesh Pandey"
git config --local user.email "animeshpandey1909@gmail.com"
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
- Commit author on new work should match the local config above (not `animesh-lifesight`)
