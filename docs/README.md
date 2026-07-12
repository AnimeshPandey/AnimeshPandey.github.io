# Documentation

Human-readable technical documentation for **anmshpndy.com** (`AnimeshPandey.github.io`).

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Exhaustive reference — layers, files, load order, subsystems, deploy, SW, **alignment status** (doc vs code drift), maintainer workflows |
| [PLATFORM-SHELL.md](PLATFORM-SHELL.md) | Stylesheet order, theme contract, features by surface — portfolio vs Casebook |
| [CASEBOOK-ROADMAP.md](CASEBOOK-ROADMAP.md) | Forward roadmap — content polish, Casey smart guide, Pro payments, premium art, auth, discovery |

## Repo alignment

If the codebase does not match the documented layer model (e.g. hero logic in `nav.js`, inline FAQ CSS), check the **alignment status** section in [ARCHITECTURE.md](ARCHITECTURE.md) and fix drift directly — there is no separate alignment prompt file.

## Not here

**Implementation prompts** for Claude/Cursor live in the planning repo — **[`ideas/projects/case-studies/prompts/`](../../ideas/projects/case-studies/prompts/)** — not under `docs/`. Start with `03-portfolio-resume-sync-declutter-docs-prompt.md`.

Quick start and deploy: root [README.md](../README.md).
