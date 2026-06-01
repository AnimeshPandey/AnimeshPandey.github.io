# Documentation

Human-readable technical documentation for **anmshpndy.com** (`AnimeshPandey.github.io`).

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Exhaustive reference — layers, files, load order, subsystems, deploy, SW, **alignment status** (doc vs code drift), maintainer workflows |
| [PLATFORM-SHELL.md](PLATFORM-SHELL.md) | Stylesheet order, theme contract, features by surface — portfolio vs Casebook |
| [CASEBOOK-ROADMAP.md](CASEBOOK-ROADMAP.md) | Forward roadmap — content polish, Casey smart guide, Pro payments, premium art, auth, discovery |

## Repo alignment

If the codebase does not match the documented layer model (e.g. hero logic in `nav.js`, inline FAQ CSS), implement fixes using the agent prompt:

**[`.claude/prompts/portfolio-architecture-alignment-prompt.md`](../.claude/prompts/portfolio-architecture-alignment-prompt.md)**

## Not here

**Implementation prompts** for Claude/Cursor live in **[`.claude/prompts/`](../.claude/prompts/)** — not under `docs/`.

Quick start and deploy: root [README.md](../README.md).
