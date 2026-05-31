# Article & whitepaper ideas

Blog posts for [anmshpndy.com](https://anmshpndy.com) and optional crossposts (Medium, Dev.to, HackerNoon). Use Claude for outline, diagrams, redaction — you own voice and facts.

**Redaction:** [portfolio-platform-inspired-writing-prompt.md](../prompts/portfolio-platform-inspired-writing-prompt.md) when informed by `lifesight-platform-ui`.

**Series brand:** **JavaScript, honestly** · **Frontend at scale** · **Calm AI interfaces**

---

## Existing canon

| Piece | Location | Notes |
|-------|----------|-------|
| Fundamentals of Functional JavaScript | On-site | Align index read time with body (~21 min) |
| How Well Do You Know `this`? | On-site | Series link to Fundamentals + HN piece |
| Everything You Need to Know About `this` | HackerNoon (external) | Keep ↗; not duplicate on-site |

---

## Platform-inspired priority {#platform-inspired-priority}

Research private UI repo; publish generic “B2B marketing analytics platform” framing.

| P | Title | Est. | Figures (min. 3 for long-form) |
|---|-------|------|--------------------------------|
| P0 | Streaming Agent UI Without the Chatbot Clipart | 18m | SSE sequence, event bridge, UI wireframe |
| P0 | CustomEvents as a Frontend Integration Layer | 14m | Bus diagram, sequence, anti-patterns table |
| P0 | Thought Traces: Showing Reasoning Without Drowning Users | 12m | Progressive disclosure states, collapse UX |
| P1 | Cancellable Sagas for Dashboard Filters | 12m | Race timeline, saga flow, fix pattern |
| P1 | Virtualized Tables with a Sticky Total Row | 14m | DOM sketch, a11y table semantics |
| P1 | MMM Dashboards: Chart Hierarchy for Skeptical CMOs | 12m | Wireframe tiers, “chart budget” checklist |
| P1 | BFF Proxy for AI: Why the Browser Shouldn’t Call the Model | 15m | Trust boundary, SSE buffer, timeout table |
| P2 | Testing Streaming Hooks with MSW and Fake Timers | 12m | Fixture file, test timeline |
| P2 | localStorage Quotas for Long Agent Sessions | 10m | Key layout, eviction flow |
| P2 | From Axios Services to Typed API Boundaries | 14m | Service object, error normalization |
| P2 | SCSS Modules + Tailwind in a Mature Design System | 14m | Decision tree: token vs utility |
| P3 | Maps for Analytics: maplibre + deck.gl Without the Jank | 14m | Layer budget, FPS overlay |
| P3 | Multi-Tenant Nav and Permission-Driven Menus | 12m | Config-driven nav schema (generic) |
| P3 | Feature Flags and i18n at Enterprise Scale | 12m | Rollout diagram, flag lifecycle |
| P3 | Vitest + Storybook in a Large SaaS Codebase | 12m | Testing pyramid for UI platform |
| P3 | Session Management for Multi-Surface Agents | 11m | Session stickiness, refresh, tabs |
| P3 | Retry and Backoff for Long-Running SSE Streams | 10m | 503/429 table, user messaging |

**Slug example:** `streaming-agent-ui-without-chatbot-clipart`

---

## JavaScript, honestly (Tier A)

| Title | Est. | Hook |
|-------|------|------|
| Closures Without the Magic Trick | 12m | Stale closures in hooks; fix patterns |
| Immutability in React: When Copying Hurts | 14m | Immer vs structural sharing |
| Parsing the Event Loop for UI Engineers | 10m | INP, rAF, starvation stories |
| TypeScript at the Boundaries | 15m | `unknown`, narrowing, MFE contracts |
| Testing Hooks and Async UI | 12m | RTL, timers, partial stream UI |
| Stop Calling `map()` Functional Programming | 5m | Extend Fundamentals thesis |
| Promises vs async/await in UI Codebases | 11m | Error boundaries, cancellation |
| Generators and Async Iterators (When You Need Them) | 10m | Rare but teachable |
| Structured Clone and PostMessage for MFE | 12m | Cross-app messaging without leaks |
| Regex for URL Paths (Router Mental Model) | 8m | Practical parsing, not theory |

---

## Frontend at scale (Tier B — `#projects`)

| Title | Est. | Project card |
|-------|------|--------------|
| Shipping Module Federation to 50k DAU | 18m | Microfrontend Architecture |
| Lighthouse CI Engineers Actually Read | 12m | Performance CI Guard |
| Design Tokens Across 10 Microfrontends | 14m | Enterprise Component Library |
| SSR for Charts: What We Cached and What We Didn’t | 16m | Marketing Intelligence Dashboard |
| Offline-First UX for Dealer Floors | 14m | Dealer Operations Mobile App |
| Anomaly Cards vs Alert Fatigue | 12m | Attribution Anomaly Intelligence |
| AI Dev Tooling That Survived Contact with Production | 14m | AI Dev Tooling Suite |
| Storybook as Contract Between Squads | 11m | Component library |
| Playwright as Platform Baseline | 12m | MMM dashboard |
| Water Intelligence Dashboards (GovTech Lessons) | 15m | Kerala-WRIS (no sensitive data) |
| Highcharts vs D3: When to Stop Drawing | 10m | GovTech + SaaS |
| React 18 Concurrent Features We Actually Used | 13m | Migration |
| Shared Redux Across Web and Mobile | 12m | Dealer app |
| Incrementality Tests in the UI (Explaining Uncertainty) | 11m | Lifesight measure |
| Budget Pacing UI That Marketers Trust | 10m | Planner / optimizer adjacency |

---

## Calm AI interfaces

| Title | Est. |
|-------|------|
| Tool-Call Panels: Show Work Without the Theater | 12m |
| Empty States for Copilots (Not “Ask me anything”) | 8m |
| Cancelling an LLM Request Is a Feature | 9m |
| Confidence Labels for Generated Insights | 10m |
| When to Freeze the Chart During Streaming | 8m |
| Multi-Step Agent Plans vs Single-Shot Prompts | 11m |
| Evaluating Agent UX Without Golden Answers | 13m |
| Privacy Copy for AI Features (Workspace Boundaries) | 9m |

---

## Performance & quality

| Title | Est. |
|-------|------|
| Why Your Lighthouse Score Lies on Dashboard Pages | 12m |
| INP for Filter-Heavy SPAs | 10m |
| Bundle Splitting vs Federation Overhead | 14m |
| Prefetching Remote Entries Safely | 9m |
| Image and Font Strategy on Static Portfolios | 8m |
| Service Worker Caching Without Stale Hell | 10m |
| Reduced Motion Is Not a Nice-to-Have | 7m |
| Core Web Vitals in CI vs RUM | 11m |
| The 300ms Tap Delay Is Gone (What Replaced It) | 6m |

---

## AI-assisted UI — wider audience {#ai-assisted-ui--wider-audience}

| Title | Est. |
|-------|------|
| Prompting for Layout: A Checklist for Non-Designers | 8m |
| From Figma Screenshot to Accessible HTML (What AI Gets Wrong) | 10m |
| CSS Variables Before Tailwind: A Gentler On-Ramp | 8m |
| Building Your First Chrome Extension in an Afternoon | 10m |
| When to Stop Asking AI and Open DevTools | 8m |
| Five Components to Learn Before React | 9m |
| Copy-Paste HTML: Sanitization Basics | 7m |
| Teaching Your Designer Friend GitHub Pages | 8m |
| Vocabulary: Semantic HTML in Plain English | 6m |
| How to Review AI-Generated CSS for Spacing Bugs | 9m |

---

## Meta / portfolio / career

| Title | Est. |
|-------|------|
| Recruiter Mode on a Static Site | 8m |
| When Canvas Hero Effects Are Worth It | 6m |
| Static Sites That Feel Premium Without a Framework | 10m |
| Crossposting Without SEO Cannibalization | 6m |
| Easter Eggs and Professionalism | 7m |
| What I Put in `profile-facts.js` (And What I Didn’t) | 8m |
| Writing for Hiring Managers vs Writing for Peers | 9m |
| Maintaining a Portfolio Without a Framework Burnout | 8m |

---

## External crosspost candidates

| Title | Platform | Note |
|-------|----------|------|
| MMM for Frontend Engineers (Primer) | Medium / Dev.to | SEO |
| Building Design Systems That Survive Acquisitions | Medium | Enterprise |
| Geospatial Dashboards at State Scale | Dev.to | Anonymized GovTech |
| Module Federation in 2026: Still Worth It? | Dev.to | Opinion |
| Staff Engineer Interviews: Frontend System Design | LinkedIn article | Career |

---

## Homepage pipeline rows (paste-ready)

Already on `index.html` — extend with:

| Title | Status line | Badge |
|-------|-------------|-------|
| Building Performance Budgets at Scale | Coming Q3 2026 | Draft |
| Microfrontends: Lessons from Three Years in Production | Coming Q4 2026 | Outline |
| Agentic AI on the Frontend: Streaming, Tool Calls, and Calm UX | Coming Q3 2026 | Draft |
| Data-Dense Dashboards Without Cognitive Overload | Researching | Research |
| From React 16 to 18 Across a Monorepo in Days | Coming 2026 | Outline |
| Designing Recruiter-First Portfolio UX | Exploring | Idea |
| Canvas vs DOM for Marketing Hero Effects | Backlog | Idea |
| Static Sites That Feel Premium Without a Framework | Backlog | Idea |
| Why Your Lighthouse Score Lies on Dashboard Pages | Coming Q4 2026 | Research |
| Module Federation Shared Dependencies: A Field Guide | Coming 2026 | Outline |
| Streaming LLM UI: Patterns That Don’t Feel Like ChatGPT | Coming Q3 2026 | Draft |
| Accessible Data Tables at Enterprise Density | Backlog | Idea |
| Tool-Call Panels: Show Work Without the Theater | Backlog | Idea |
| BFF Proxy for AI (Browser Trust Boundaries) | Outline | Outline |
| Session Management for Multi-Surface Agents | Idea | Idea |

---

## Whitepapers (long-form)

PDF or `/writing/whitepapers/<slug>/` — 4k–8k words, numbered sections, bibliography optional.

| Title | Audience | Thesis |
|-------|----------|--------|
| Trustworthy Agentic Analytics UI | Product + eng leaders | Streaming, tools, failure UX for data copilots |
| Performance Governance for Microfrontend Platforms | Platform teams | Budgets, CI, ownership model |
| Design Tokens at Scale in Legacy SaaS | Design systems | SCSS + Tailwind, drift, governance |
| Accessibility Economics in Enterprise Dashboards | EM / PM | Retrofit vs build-in; tables |
| From Dashboards to Decisions | Marketing technologists | MMM/attribution hierarchy (generic) |
| AI-Assisted UI Development: A Risk Framework | Managers | Verification checklist for Copilot output |
| Frontend Observability for SaaS (RUM + Errors + Releases) | SRE-adjacent FE | Correlation without vendor pitch |
| The BFF Layer in Modern SPAs | Architects | When Express proxy beats BaaS |

**Claude role:** section drafts, related work summaries, figure captions. **You:** decisions, anonymized incidents.

---

## Article production template

```text
1. Problem (who hurts)
2. Constraints (perf, a11y, multi-tenant, legacy stack)
3. Architecture figure
4. 2–4 deep sections + code you authored (≤40 lines/block)
5. UX / failure modes
6. Testing & observability
7. Lessons (include one mistake)
8. Series footer + further reading
```

**Per piece:** 3+ figures (Mermaid→SVG, ASCII wireframe, or CSS schematic). **Read time:** ~200 wpm on final body.

---

## Pairing matrix

| Article | Project ([projects.md](projects.md)) |
|---------|--------------------------------------|
| Streaming Agent UI… | `use-streaming-reply`, `sse-fixture-server` |
| Module Federation Field Guide | `mfe-shared-deps-doctor` |
| Lighthouse CI… | `lhci-pr-commenter` |
| Virtualized Tables… | `dense-table-a11y` |
| Recruiter Mode… | `static-recruiter-brief` |
| Chrome Extension… | Focus Outline extension |
| Closures… | `closure-vision`, `fp-js-katas` |

---

## Priority queue (next 6 to write)

1. Streaming Agent UI Without the Chatbot Clipart  
2. Cancellable Sagas for Dashboard Filters  
3. Lighthouse CI Engineers Actually Read  
4. Closures Without the Magic Trick  
5. Prompting for Layout (wider audience)  
6. Recruiter Mode on a Static Site (meta, fast win)
