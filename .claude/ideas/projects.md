# Project ideas

Shippable repos and sandboxes. Tag: **S** / **M** / **L**. **Signal** = what hiring managers infer.

---

## Tier 1 — Backs portfolio `#projects` (build first)

| Project | One-liner | Stack | Effort | Signal |
|---------|-----------|-------|--------|--------|
| `mfe-shared-deps-doctor` | Scan Module Federation for duplicate React, version skew, eager/singleton mistakes | Node, JSON schema | M | MFE at scale |
| `lhci-pr-commenter` | GitHub Action: Lighthouse + bundle diff table in PR comments | GH Actions, Node | M | Performance CI Guard |
| `perf-budgets-presets` | Opinionated LCP/INP/CLS budgets for dashboard vs marketing routes | JSON + docs | S | Platform perf culture |
| `react-streaming-ui` | Headless hooks + demo: token stream, tool steps, abort | React, TS | M | Agentic / Mia UX |
| `use-streaming-reply` | npm package: SSE consumer + state machine only | React, TS | S | Same, smaller scope |
| `static-recruiter-brief` | Embed recruiter-mode pattern from portfolio | Vanilla JS | S | Recruiter-first UX |
| `playwright-mfe-smoke` | Template: smoke remote entries in CI | Playwright, TS | M | Tekion-scale QA |
| `bundle-remote-import-map` | Visualize which host imports which remote | Node, graph JSON | S | Federation debugging |
| `codemod-react-18-pack` | Published codemods: `createRoot`, batching, types | jscodeshift | M | React 18 migration story |
| `storybook-mfe-isolation` | Storybook config recipe for federated components | Storybook 8 | M | Design system + MFE |

---

## CLI & developer tooling

| Project | One-liner | Effort | Signal |
|---------|-----------|--------|--------|
| `sse-fixture-server` | Local HTTP/SSE server emitting fake agent events | S | Streaming tests |
| `hook-deps-audit` | Heuristic scan for suspicious `useEffect` deps | S | Hooks craft |
| `og-resume-validator` | PDF: pages, fonts, text layer, ATS hints | S | Recruiter polish |
| `eslint-plugin-mfe` | Rules: remote imports only from allowlist | M | Governance |
| `css-token-diff` | Diff two `theme.css` exports; report renamed tokens | S | Multi-theme work |
| `import-cost-pr` | Comment estimated KB per new import on PR | M | Bundle discipline |
| `saga-flow-graph` | Parse redux-saga files → Mermaid flow (static) | M | Legacy Redux shops |
| `vitest-msw-sse` | Starter kit: MSW handler for `text/event-stream` | S | Agent testing |
| `commit-conventional-portfolio` | Changelog generator for static site deploys | S | DX meta |
| `gh-action-a11y-regression` | axe on changed routes in PR | S | a11y CI |
| `module-graph-cycles` | Detect circular deps in monorepo slice | S | Architecture hygiene |
| `env-example-linter` | Fail CI if `.env.example` missing keys from schema | S | Platform teams |

---

## Vanilla JS / static (no bundler)

| Project | One-liner | Effort | Signal |
|---------|-----------|--------|--------|
| `this-binding-lab` | Four rules; pick scenario → bound `this` | S | JS series |
| `event-loop-toy` | Macro / micro / rAF queues animated | S | Event loop article |
| `fp-js-katas` | `compose`, `pipe`, purity checks in browser | S | Fundamentals series |
| `closure-vision` | Step-through closures with highlighted bindings | S | Closures article |
| `promise-state-machine` | Visual pending/fulfilled/rejected + chaining | S | Async teaching |
| `contrast-on-page` | Bookmarklet: WCAG contrast on selection | S | a11y |
| `focus-order-audit` | Tab through page; log order + traps | S | a11y |
| `reduced-motion-audit` | Detect animations ignoring PRM | S | a11y |
| `json-config-form` | JSON → accessible form → JSON (no framework) | S | Internal tools pattern |
| `csv-chart-lab` | Paste CSV → SVG bar/line (synthetic axes) | S | Dashboard literacy |
| `portfolio-starter-kit` | Clone of your site skeleton: tokens, nav, one section | S | Beginner AI UI |
| `theme-swatcher` | 6 palettes via `data-theme`; export CSS | S | Layout/themes prompt |
| `scroll-driven-demo` | CSS `animation-timeline` showcase with fallbacks | S | Modern CSS |
| `view-transitions-demo` | MPAs with View Transitions API | S | Polish |
| `service-worker-recipes` | Precache strategies cookbook for static sites | S | Your `sw.js` story |

---

## React libraries & demos

| Project | One-liner | Effort | Signal |
|---------|-----------|--------|--------|
| `dense-table-a11y` | Virtualized table + screen reader tests | M | Enterprise tables |
| `virtual-table-totals-row` | TanStack 8 + sticky footer aggregate | S | Lifesight tables |
| `focus-trap-audit` | Dev overlay: tab order in open modals | S | WCAG |
| `storybook-contrast-addon` | Contrast on design tokens in Storybook | M | Design system |
| `use-abortable-fetch` | Fetch + AbortController + stale response guard | S | Dashboard filters |
| `use-prefers-reduced-motion` | Hook + docs for conditional effects | S | Visuals policy |
| `chart-empty-states` | Library of empty/error/skeleton chart slots | S | MMM UX |
| `inline-insight-card` | “Anomaly card” component + Storybook stories | S | Attribution AI |
| `tool-call-timeline` | Present tool steps + durations (mock data) | S | Agentic UI |
| `stream-markdown-safe` | Incremental markdown render without XSS | M | Copilot UIs |
| `dashboard-filter-bar` | Composable date/channel filters with URL sync | M | SaaS patterns |
| `react-window-total-row` | react-window + pinned summary row recipe | S | Performance |
| `form-wizard-a11y` | Multi-step form with focus management | S | Enterprise flows |
| `map-layer-budget` | maplibre: layer count + FPS overlay | M | Geo dashboards |

---

## AI-assisted UI learner kits (low code)

For designers / PMs learning UI through Cursor, Claude, v0, etc.

| Project | One-liner | Effort | Outcome |
|---------|-----------|--------|---------|
| `component-gallery-starter` | 8 components, 4 themes, checklist per component | S | Tokens + states |
| `layout-mistakes-fixme` | 6 broken layouts + “reveal fix” toggle | S | Flex/grid intuition |
| `prompt-to-component-cards` | Printable prompt templates per component type | S | Better AI output |
| `design-token-playground` | Sliders → live CSS variables | S | Variables before Tailwind |
| `accessibility-quest` | Gamified fixes: alt text, labels, contrast | S | a11y vocabulary |
| `notion-style-block-editor-static` | contenteditable blocks without framework | M | Rich text basics |
| `landing-page-in-60-min` | Video + repo: hero, CTA, footer only | S | Ship GitHub Pages |
| `figma-token-importer-lite` | Paste Figma variables → CSS file | S | Handoff |
| `responsive-screenshot-grid` | iframe widths 320–1280 side by side | S | QA habit |
| `copy-deck-to-html` | Markdown copy → semantic HTML sections | S | Content-first |

---

## Mobile & cross-platform (stretch)

| Project | One-liner | Effort | Signal |
|---------|-----------|--------|--------|
| `offline-queue-ui-demo` | Optimistic UI + retry queue (fake API) | M | Dealer mobile story |
| `react-native-web-tabs` | Shared nav pattern demo | M | Cross-platform |
| `expo-skia-sparkline` | Tiny sparkline component | M | Dashboard widgets |

---

## Portfolio meta (dogfood this repo)

| Project | One-liner | Effort |
|---------|-----------|--------|
| `portfolio-theme-tokens` | npm: CSS variables from `theme.css` | S |
| `eggs-tier-loader` | Extract device-tier lazy load from `eggs-*.js` | S |
| `recruiter-data-schema` | JSON schema for `profile-facts.js` | S |
| `visuals-capability-test` | Page reporting `prefers-reduced-motion`, DPR, memory | S |
| `contact-form-starter` | Web3Forms + honeypot template | S |
| `article-mermaid-static` | Build step optional: `.md` → HTML figures | M |

---

## Pairing matrix (project → article)

| Project | Article in [articles.md](articles.md) |
|---------|--------------------------------------|
| `use-streaming-reply` | Streaming Agent UI Without the Chatbot Clipart |
| `mfe-shared-deps-doctor` | Module Federation Shared Dependencies |
| `lhci-pr-commenter` | Lighthouse CI Engineers Actually Read |
| `this-binding-lab` | How Well Do You Know `this`? (existing) |
| `theme-swatcher` | CSS Variables Before Tailwind |
| `static-recruiter-brief` | Recruiter Mode on a Static Site |
| `dense-table-a11y` | Virtualized Tables with Sticky Total Row |

---

## Selection rubric

Pick ideas that score 2+ of:

1. Links to a real `#projects` bullet you can defend in interviews  
2. Produces a demo URL or `npx` one-liner  
3. Enables a blog post within 2 weeks of shipping  
4. Small enough to finish before scope creep (cap at **M** unless committed)
