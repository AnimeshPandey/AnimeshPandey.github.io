# Claude Prompt — Universal Language Support (i18n)

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · vanilla JS · JSON locale files · **no build step**

**Architecture:** `.claude/prompts/portfolio-architecture-prompt.md`

**Related:**

- `portfolio-design-system-tokens-prompt.md` — move strings out of HTML into locale files; components stay presentational
- `portfolio-premium-ux-sections-prompt.md` — language switcher in header (consolidated chrome)
- `profile-facts.js` / `recruiter-data.js` — recruiter briefing may stay EN-only initially (document decision)

---

## Your role

You are a **staff frontend engineer** adding **first-class internationalization** to a static portfolio: recruiters and engineers worldwide can read core content in their language without maintaining separate HTML per locale.

**North star:** Switch language from the header → entire homepage (and articles where translated) updates instantly, persists on reload, remains accessible and SEO-honest.

---

## Scope

| In scope | Out of scope (v1) |
|----------|-------------------|
| Homepage `index.html` all user-facing strings | Full auto-translation of 2 long articles (optional EN + one locale stub) |
| Nav, hero, about, experience, projects, skills, writing labels, contact, footer | Recruiter panel long generated copy (EN first; structure for later) |
| Article chrome: nav, footer, back link, form labels | RTL layout polish beyond logical properties (phase 2 for `ar`) |
| SEO: `lang`, `hreflang`, canonical strategy | Server-side locale routes (`/hi/`) unless user approves |
| Language picker UI | i18n for easter-egg jokes (optional EN only) |

---

## Supported languages (v1 — ship all with EN complete, others progressive)

| Code | Language | Notes |
|------|----------|--------|
| `en` | English | Default, source of truth |
| `hi` | Hindi (हिन्दी) | High value for Bangalore / India hiring |
| `es` | Spanish | Global reach |
| `fr` | French | Global reach |
| `de` | German | EU hiring |
| `pt-BR` | Portuguese (Brazil) | |
| `ja` | Japanese | |
| `zh-Hans` | Chinese (Simplified) | |
| `ar` | Arabic | **RTL** — set `dir="rtl"` on `<html>` |
| `ko` | Korean | Optional v1.1 if timeboxed |

**Quality bar:** EN 100% keys; `hi` + `es` at least hero + nav + contact for demo; others may fallback to EN per key with `data-i18n-fallback` logging in dev.

**Translation:** Use accurate human-quality strings — Claude may draft, but label non-EN as “community / AI-assisted” in PR if not reviewed by native speaker.

---

## Architecture

```
assets/
├── i18n/
│   ├── i18n.js              # core: setLocale, t(), applyTranslations
│   ├── locales/
│   │   ├── en.json
│   │   ├── hi.json
│   │   ├── es.json
│   │   └── …
│   └── keys.md                # optional key glossary for translators (in repo)
```

### Locale file shape (nested JSON)

```json
{
  "meta": { "title": "Animesh Pandey · Senior Frontend Engineer", "description": "…" },
  "nav": { "about": "about", "experience": "experience", "contact": "contact" },
  "hero": {
    "badge": "Open to senior & staff roles",
    "ctaExperience": "View experience",
    "ctaResume": "Resume",
    "ctaContact": "Let's talk"
  },
  "sections": {
    "about": { "label": "// about", "title": "Thoughtful engineer,", "titleEm": "product thinker" }
  },
  "a11y": {
    "skipLink": "Skip to main content",
    "themeMenu": "Choose theme",
    "langMenu": "Choose language"
  }
}
```

**Key naming:** `section.component.element` — stable, grep-friendly.

---

## DOM binding strategies (pick one primary)

### A — `data-i18n` attributes (recommended)

```html
<h2 data-i18n="sections.about.title">Thoughtful engineer,</h2>
<em data-i18n="sections.about.titleEm">product thinker</em>
```

```javascript
function applyTranslations(dict) {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    var val = t(dict, key);
    if (val == null) return;
    if (el.hasAttribute('data-i18n-attr')) {
      el.setAttribute(el.getAttribute('data-i18n-attr'), val);
    } else {
      el.textContent = val;
    }
  });
}
```

### B — `data-i18n-html` (limited, sanitized)

Only for strings with `<strong>` — prefer splitting into multiple keys.

### Attributes

```html
<button data-i18n="hero.ctaContact" data-i18n-attr="aria-label">…</button>
<meta name="description" data-i18n="meta.description" data-i18n-attr="content">
```

---

## `i18n.js` behavior

1. **Detect initial locale:** `localStorage.locale` → `navigator.language` (map `en-IN` → `en`) → fallback `en`.
2. **Load JSON:** `fetch('/assets/i18n/locales/' + locale + '.json')` with cache bust tied to `sw.js` version.
3. **Apply:** `document.documentElement.lang = locale`; `dir = 'rtl'` for `ar`.
4. **Persist:** `localStorage.setItem('locale', locale)`.
5. **Announce:** `aria-live` region “Language changed to Hindi”.
6. **FOUC:** Inline in `<head>` before paint (minimal):

```html
<script>
(function(){
  var L=localStorage.getItem('locale')||'en';
  if(L==='ar')document.documentElement.dir='rtl';
  document.documentElement.lang=L;
})();
</script>
```

7. **Expose:** `window.AP_I18N = { setLocale, t, getLocale };` for recruiter/visuals if needed.

---

## Language switcher UI

- Place in **header** `.nav-right` — compact globe + current code (`EN` / `हि` / `ES`).
- Popover pattern **matches theme picker** (reuse `components/icon-btn` + menu from design-system prompt).
- `role="listbox"`, keyboard navigation, `aria-current` on active locale.
- Mobile: inside `#mobile-nav` footer, not duplicated in header bar (reduce clutter — coordinate with premium UX prompt).

---

## SEO & hreflang

In `index.html` `<head>`:

```html
<link rel="alternate" hreflang="en" href="https://anmshpndy.com/" />
<link rel="alternate" hreflang="hi" href="https://anmshpndy.com/?lang=hi" />
<!-- … -->
<link rel="alternate" hreflang="x-default" href="https://anmshpndy.com/" />
```

**Canonical:** `https://anmshpndy.com/` — query `?lang=` is client-only state (same URL) **or** document hash `#lang=hi` to avoid duplicate content; pick one approach and document in architecture prompt.

Update **JSON-LD** `inLanguage` when locale changes (re-render script tag or use array).

---

## Articles

| Page | v1 approach |
|------|-------------|
| `fundamentals-of-functional-javascript/` | Chrome i18n only; body stays EN (technical content) |
| `how-well-do-you-know-this/` | Same |
| `streaming-agent-ui-…/` | Same |

Optional: `data-i18n` on article title if translated JSON provided later.

---

## Recruiter mode

**v1:** Keep `recruiter-data.js` / generated briefing in **English**.

**v2-ready:** Structure `recruiter-data.js` as `{ en: { … }, hi: { … } }` or separate `recruiter-data.hi.js` lazy-loaded.

---

## Numbers, dates, names

- Use `Intl.DateTimeFormat` and `Intl.NumberFormat` in JS for stats animation labels if locale-sensitive.
- **Proper names** (Animesh Pandey, company names, Lifesight/Tekion) stay **untranslated** unless locale convention requires transliteration (Hindi may use Latin name).

---

## Typography & RTL

- `ar`: `html[dir="rtl"]` flips layout via logical properties — migrate critical CSS:

```css
/* prefer */
margin-inline-start: var(--space-4);
/* not */
margin-left: var(--space-4);
```

Audit `site.css` / component files for physical `left`/`right` in nav, hero grid, timeline dots.

- Fonts: Noto Sans Devanagari / Arabic supplement via Google Fonts `&display=swap` — subset weights to limit payload.

---

## Files to touch

| File | Action |
|------|--------|
| `assets/i18n/i18n.js` | **New** |
| `assets/i18n/locales/*.json` | **New** (10 files) |
| `index.html` | `data-i18n` on strings; remove hardcoded copy |
| `assets/nav.js` | Wire lang picker; update `aria-current` labels |
| Article `*/index.html` | Chrome strings + load `i18n.js` |
| `sw.js` | Precache locale JSON |
| `sitemap.xml` | Note if query params used |
| `portfolio-architecture-prompt.md` | i18n section |

---

## Phase 0 — String inventory

Export CSV or table:

| Key | EN text | Location (file/line) | Notes |
|-----|---------|----------------------|-------|
| `nav.about` | about | index.html | |

~150–250 keys expected for homepage.

---

## Verification checklist

- [ ] Every visible homepage string has a key (grep for orphaned text nodes in main)
- [ ] Language switch persists reload
- [ ] `html[lang]` and `dir` correct for `ar`
- [ ] Theme picker + lang picker don’t overlap on 320px width
- [ ] Screen reader announces language change
- [ ] Missing key falls back to EN + `console.warn` in dev only
- [ ] `hreflang` links valid
- [ ] No layout break with longest translation (German labels in nav)
- [ ] Recruiter / contact / form still submit correctly

---

## Anti-patterns

- Separate `index-hi.html` duplicate (unmaintainable)
- Google Translate widget (off-brand, SEO noise)
- Translating SEO keywords into nonsense — keep `meta` quality high
- Hardcoding locale list in 3 files (use `constants.js` `LOCALES` array)

---

## Execution order

1. Phase 0 inventory + key schema.
2. Extract `en.json` from current HTML.
3. Implement `i18n.js` + apply pass on homepage.
4. Language switcher UI.
5. Draft `hi.json`, `es.json` (priority locales).
6. Stub remaining locales with EN fallback copy.
7. RTL pass for `ar`.
8. Articles chrome + SW + architecture doc.
