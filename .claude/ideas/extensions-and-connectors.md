# Extensions & connectors

Browser extensions (Chrome MV3), MCP servers, Claude skills/projects, VS Code extensions, GitHub Actions templates.

**Principles:** narrow permissions, local-first where possible, README + 30s demo GIF.

---

## Chrome extensions (MV3)

### Accessibility & learning

| Extension | Users | Behavior | Effort |
|-----------|--------|----------|--------|
| **Focus Outline** | Everyone learning a11y | Toggle strong `:focus-visible` rings on any page | S |
| **Reduced Motion Warn** | a11y advocates | Badge when animations ignore `prefers-reduced-motion` | S |
| **Heading Map** | Writers, devs | Overlay h1–h6 outline; flag skipped levels | S |
| **Landmark Navigator** | Keyboard users | Jump list: main, nav, footer, search | S |
| **Color Blind Sim** | Designers | CSS filters: deuteranopia, protanopia, tritanopia | S |
| **Touch Target Ruler** | Mobile QA | Highlight controls &lt; 44×44px | S |
| **Screen Reader Preview** | Devs | Speak focused element (Web Speech API) | S |

### Developer productivity

| Extension | Users | Behavior | Effort |
|-----------|--------|----------|--------|
| **Perf Snapshot** | FE devs | LCP/CLS/INP/TTFB from Performance API on tab | S |
| **Layout Shift Logger** | Perf | Console + badge when CLS &gt; threshold | S |
| **CSS Grid Inspector Lite** | CSS learners | Highlight grid lines on hovered container | S |
| **Copy Computed Tokens** | Design systems | Selection → CSS variables snippet | S |
| **SSE Stream Logger** | Agent UI devs | Dev-only: log EventStream bodies (allowlist hosts) | M |
| **React Fiber Hint** | React devs | Detect React root; show version if exposed | S |
| **Source Map Helper** | Debugging | Open DevTools Sources to mapped file (heuristic) | M |
| **Cookie Size Warn** | Platform | Flag cookies &gt; 4KB on domain | S |
| **CORS Error Explainer** | Juniors | Plain-English sidebar on failed fetch (pattern match) | M |

### Content & research

| Extension | Users | Behavior | Effort |
|-----------|--------|----------|--------|
| **Tabular Reader** | Analysts | Extract HTML tables → CSV | S |
| **Article Readability** | Readers | Apply readability stylesheet + time estimate | S |
| **Code Block Copier** | Devs | One-click copy from `pre` on docs sites | S |
| **HN Format Helper** | Writers | Preview title length for Hacker News | S |
| **Link Rot Check** | Bloggers | Scan page outbound links → status codes | M |

### Portfolio / career (personal brand)

| Extension | Users | Behavior | Effort |
|-----------|--------|----------|--------|
| **Recruiter Brief** | You | Notes on GitHub/LinkedIn profiles → local export | S |
| **Job Post Highlighter** | Job search | Highlight React/TS/MFE keywords; export checklist | S |
| **Portfolio Peek** | Recruiters | On GitHub user: link to portfolio if in known list | S |
| **Resume PDF Quick Check** | You | Open PDF tab → run client-side ATS heuristics | S |

### AI-assisted UI learning

| Extension | Users | Behavior | Effort |
|-----------|--------|----------|--------|
| **Prompt Inject Helper** | Beginners | Sidebar prompts for “accessible button”, “responsive nav” | S |
| **AI Output Linter** | Learners | Paste HTML → basic a11y/contrast warnings | S |
| **Component Checklist** | Learners | On localhost: checklist for focus, alt, viewport | S |

**MV3 checklist:** `manifest v3`, service worker, minimal `host_permissions`, privacy policy if store listing.

---

## MCP servers (Claude Desktop / Cursor)

| Server | Tools / resources | Input | Effort |
|--------|-------------------|-------|--------|
| `lighthouse-pr-guard` | `analyze_pr`, `compare_budgets` | PR URL or dist folder | M |
| `a11y-snapshot` | `scan_html`, `scan_url` | HTML string or localhost URL | S |
| `css-token-extractor` | `extract_tokens` | Path to CSS/SCSS dir | S |
| `sse-event-parser` | `parse_stream_log` | Raw SSE text → timeline JSON | S |
| `bundle-stats-diff` | `diff_webpack_stats` | Two `stats.json` files | S |
| `mfe-config-lint` | `lint_federation_config` | webpack config path | M |
| `saga-graph` | `graph_saga_file` | `.ts` saga → Mermaid | M |
| `readme-quality` | `score_readme` | Repo path → checklist score | S |
| `portfolio-redact` | `redact_draft` | Markdown → flagged terms | S |
| `figma-token-bridge` | `tokens_to_css` | Figma export JSON | M |
| `vitest-failure-summary` | `summarize_test_log` | CI log paste | S |
| `conventional-release` | `suggest_version` | Commits since tag | S |
| `playwright-trace-hint` | `explain_trace` | trace.zip path | M |
| `dependency-risk` | `flag_deps` | package.json → known-risk list | S |
| `openapi-mock-gen` | `generate_msw_handlers` | OpenAPI path | M |

**First MCP to ship:** `sse-event-parser` or `a11y-snapshot` — smallest surface, clearest demo.

---

## Claude Project skills & custom instructions

| Skill name | Use when | Outputs |
|------------|----------|---------|
| `portfolio-article-writer` | Drafting on-site technical posts | Outline, Mermaid, redacted prose |
| `platform-redaction-linter` | Before publish | Flag employer/env/path leaks |
| `senior-fe-pr-review` | Reviewing FE PRs | Architecture, a11y, perf notes |
| `figma-to-scss-checklist` | Design handoff | Component file list + token map |
| `mfe-incident-postmortem` | Writing blameless summaries | Timeline, action items (generic) |
| `lighthouse-comment-writer` | PR failed budgets | Human-readable delta comment |
| `beginner-ui-prompt-coach` | Teaching AI UI | Safe prompts per component |
| `whitepaper-outliner` | Long-form | Section tree + figure list |
| `json-ld-article` | SEO | Schema.org Article block |
| `commit-message-lifesight` | Commits | Ticket prefix style (optional) |

Store as `.claude/skills/` in portfolio repo or user-level `~/.claude/skills/`.

---

## VS Code / Cursor extensions (lighter than MCP)

| Extension | Behavior | Effort |
|-----------|----------|--------|
| **Saga Flow Preview** | Command: generate Mermaid from open saga file | M |
| **SCSS Module Jump** | Go to `.module.scss` from component | S |
| **Token Hover** | Show resolved CSS variable on hover in SCSS | M |
| **Effect Dep Warning** | Highlight `useEffect` missing deps (regex heuristic) | S |
| **Remote Import Guard** | Warn on non-allowlisted Module Federation imports | M |
| **Article Word Count** | Status bar for `*.md` in `articles/` | S |

---

## GitHub Actions templates (marketplace-style repos)

| Template | What it does | Effort |
|----------|--------------|--------|
| `lhci-pr-comment` | Lighthouse + bundle comment | S |
| `axe-changed-routes` | axe on paths from git diff | S |
| `preview-deploy-smoke` | Playwright against preview URL | M |
| `size-limit-budget` | Fail on JS/CSS budget | S |
| `storybook-chromatic-free` | Build Storybook artifact on PR | S |
| `pages-deploy-static` | Deploy `AnimeshPandey.github.io` pattern | S |

---

## Connectors & integrations (stretch)

| Idea | Platform | Notes |
|------|----------|-------|
| **Slack deploy digest** | Slack webhook | GitHub Pages deploy success + Lighthouse | S |
| **Notion pipeline sync** | Notion API | Writing pipeline rows ↔ database | M |
| **Linear idea importer** | Linear | One-way: ideas.md section → issues | M |
| **Obsidian vault export** | Obsidian | Symlink `.claude/ideas` as knowledge base | S |
| **Raycast extension** | Raycast | Quick open ideas + copy slug | S |
| **Alfred workflow** | macOS | Same | S |

---

## Security & privacy defaults

- No broad `<all_urls>` unless essential  
- No exfiltration of page content to third-party APIs without explicit opt-in  
- `storage.local` only for recruiter/notes extensions  
- Document data handling in README for Web Store review  
- MCP servers: read-only FS where possible; no prod credentials in config samples  

---

## Pairing matrix

| Ship | Write ([articles.md](articles.md)) |
|------|-----------------------------------|
| Focus Outline | Building Your First Chrome Extension |
| Perf Snapshot | Why Your Lighthouse Score Lies on Dashboard Pages |
| SSE Stream Logger | Streaming Agent UI… |
| `a11y-snapshot` MCP | Accessibility Economics (whitepaper) or a11y article |
| `portfolio-redact` MCP | Platform-inspired redaction post (meta) |
