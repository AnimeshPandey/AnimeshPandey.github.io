# Ideas index

Master index for `.claude/ideas/`. See [README.md](README.md) for folder purpose.

---

## Quick links

| Lane | Doc |
|------|-----|
| Build something | [projects.md](projects.md) |
| Write something | [articles.md](articles.md) |
| Ship in browser / IDE | [extensions-and-connectors.md](extensions-and-connectors.md) |

---

## Starter trio (if you only pick three)

| Track | Build | Write |
|-------|--------|--------|
| **Dev credibility** | `use-streaming-reply` + demo | [Streaming Agent UI Without the Chatbot Clipart](articles.md#platform-inspired-priority) |
| **Beginner / AI UI** | Theme swapper lab (4+ themes) | [Prompting for Layout: A Checklist](articles.md#ai-assisted-ui--wider-audience) |
| **Distribution** | Focus Outline Chrome extension | [Building Your First Chrome Extension](articles.md#ai-assisted-ui--wider-audience) |

---

## Effort tags (used across files)

| Tag | Meaning |
|-----|---------|
| `S` | Weekend (~8–16h) |
| `M` | 2–4 weekends |
| `L` | Multi-week; still one clear MVP |

---

## Portfolio integration checklist

When an idea ships:

1. **Project** → `#projects` card or “Open source” subsection; GitHub + demo link.
2. **Article** → `/<slug>/index.html`, `#writing` → On this site, `sitemap.xml`, JSON-LD, read time.
3. **Extension** → Chrome Web Store or “load unpacked” + article walkthrough.
4. **MCP / skill** → README + example prompts; optional blog post.
5. Bump `sw.js` precache if static assets change.
6. Redaction pass if informed by `lifesight-platform-ui` ([platform-inspired rules](../prompts/portfolio-platform-inspired-writing-prompt.md)).

---

## Anti-patterns

- Generic todo apps, crypto tutorials, “100 AI tools” listicles
- LinkedIn-scraping extensions at scale (ToS, trust)
- Publishing employer names, customer names, `VITE_*`, GCP/Vertex IDs, internal API paths
- Fake metrics or read counts not on public portfolio
- Marking pipeline rows “published” when still draft

---

## Claude workflow cheat sheet

1. Pick a row from `projects.md`, `articles.md`, or `extensions-and-connectors.md`.
2. **Articles:** outline → Mermaid/SVG figures → draft → [redaction checklist](../prompts/portfolio-platform-inspired-writing-prompt.md).
3. **Code:** README problem statement, MIT license, one screenshot/GIF, `npx` or demo URL if possible.
4. Cross-link: article ↔ repo ↔ homepage card.

---

## Stats (backlog size)

| Category | Approx. count |
|----------|----------------|
| Projects | 45+ |
| Articles (blog) | 55+ |
| Whitepapers | 8 |
| Extensions | 18 |
| MCP / connectors / skills | 22 |

*Counts include stretch ideas; prioritize P0/P1 in each file.*
