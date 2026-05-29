# Claude Prompt — Contact Form Recording + Email + Free Analytics

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Notification email:** `animeshpandey1909@gmail.com`  
**Stack:** Static GitHub Pages — **no backend, no build step**

**Related:** `docs/portfolio-architecture-prompt.md` (where code belongs), `README.md` (deploy checklist)

---

## Your role

You are a **senior frontend engineer** implementing **free, low-ops** contact capture and **privacy-conscious analytics** on a static portfolio. The site must stay deployable by `git push` to `main` with zero server maintenance.

**Goals:**

1. **Record** contact form submissions (viewable history, not only mailto).
2. **Email** each submission to `animeshpandey1909@gmail.com`.
3. **Analytics dashboard** for page views / traffic (free tier).
4. Keep setup **easy** (< 1 hour account + code), **free** at portfolio traffic levels, and **compatible** with GitHub Pages.

---

## Current state (analyze first)

| Area | Today |
|------|--------|
| Form | `#contactForm` in `index.html` — client validation, then **mailto** opens user's email client (`index.html` inline script ~line 1177) |
| Recording | **None** — submissions are lost if visitor has no mail client or abandons |
| Analytics | **None** in repo (no GA, Plausible, Cloudflare beacon, etc.) |
| Architecture | Form logic is inline in `index.html`; should move to `assets/contact.js` per architecture doc |

**Deliver Phase 0 audit:** confirm selectors, success message `#formSuccess`, validation pattern, and whether article pages have forms (they should not).

---

## Recommended stack (default — implement unless blocked)

Use this **two-service** combo unless the user rejects it:

### A. Contact: **Web3Forms** (free)

| | |
|--|--|
| **Why** | Built for static sites; email on every submit; web dashboard of submissions; honeypot + optional reCAPTCHA; domain restriction; generous free tier (~250 submissions/month) |
| **Cost** | $0 for personal portfolio volume |
| **Signup** | https://web3forms.com — verify `animeshpandey1909@gmail.com`, get `access_key` |
| **How it works** | `POST https://api.web3forms.com/submit` via `fetch` from browser |

**Alternatives (document in final report, do not implement multiple):**

| Service | Free tier | Email | Submission inbox | Notes |
|---------|-----------|-------|------------------|-------|
| **Formspree** | ~50/mo | Yes | Yes (dashboard) | Mature; same client-side key model |
| **FormSubmit.co** | Unlimited | Yes | Limited | No account; less control |
| **Getform** | 50/mo | Yes | Yes | Similar to Formspree |
| **Google Apps Script** | Free | Yes | Google Sheet | More DIY; URL is a secret endpoint |
| **Cloudflare Worker + Resend** | Free tiers | Yes | DIY DB | Overkill for this project |

**Do not use** Netlify Forms, Vercel serverless, or Supabase unless the user explicitly migrates hosting — site is **GitHub Pages only**.

### B. Analytics: **Cloudflare Web Analytics** + optional **Microsoft Clarity**

| Tool | Why | Cost |
|------|-----|------|
| **Cloudflare Web Analytics** | Privacy-friendly pageview dashboard; no cookie banner required in many jurisdictions; lightweight beacon | Free |
| **Microsoft Clarity** (optional) | Heatmaps, scroll maps, session recordings — complements pageviews | Free |

**Alternative analytics (pick one primary, not all):**

| Tool | Pros | Cons |
|------|------|------|
| **GA4** | Full funnel, Search Console link | Cookie consent often needed; heavier script |
| **GoatCounter** | Simple, OSS-friendly | Less detail than GA4 |
| **Plausible / Fathom** | Clean UI | Paid for custom domains at scale |
| **Umami Cloud** | Nice dashboard | Limited free tier |

**Default:** Cloudflare Web Analytics on all pages (`index.html`, articles, `404.html`). Add Clarity only if user wants behavioral detail.

---

## Non-negotiable constraints

1. **Zero build step** — no npm, no bundler.
2. **Progressive enhancement** — `mailto:` + visible email remain as fallback if API fails or JS disabled.
3. **WCAG 2.1 AA** — loading/success/error states announced (`aria-live`); focus management on submit; no CAPTCHA that blocks keyboard users without alternative.
4. **Privacy** — add a short line near the form: data sent to form provider + email; link to provider privacy policy if required.
5. **Spam** — honeypot field + Web3Forms built-in filtering; optional Turnstile/reCAPTCHA only if spam appears.
6. **Architecture** — new behavior in `assets/contact.js`; styles in `assets/site.css`; remove duplicate inline form handler from `index.html`.
7. **Secrets** — `access_key` will be **visible in client JS** (normal for static forms). **Mitigate:** enable **domain allowlist** in Web3Forms dashboard (`anmshpndy.com`, `animeshpandey.github.io`). Never commit API keys for paid services in repo if avoidable; Web3Forms key is designed to be public with domain lock.
8. **Service worker** — bump `sw.js` `CACHE` if adding `contact.js`; do not cache POST responses.
9. **SEO** — do not break canonical URLs or JSON-LD.

---

## Implementation spec

### Phase 1 — Accounts & configuration (human steps; document in PR)

1. Create **Web3Forms** account; verify `animeshpandey1909@gmail.com`.
2. Copy **Access Key**; in dashboard:
   - Set **recipient** to `animeshpandey1909@gmail.com`
   - Enable **domain restriction**: `anmshpndy.com`, `www.anmshpndy.com`, `animeshpandey.github.io`
   - Enable email notifications on new submission
3. Create **Cloudflare Web Analytics** site for `anmshpndy.com`; copy beacon token.
4. (Optional) Create **Microsoft Clarity** project; copy project ID.

### Phase 2 — HTML changes (`index.html`)

1. Add honeypot (hidden from users, not focusable):

```html
<input type="checkbox" name="botcheck" class="visually-hidden" tabindex="-1" autocomplete="off" aria-hidden="true" />
```

2. Add optional hidden fields for Web3Forms:

```html
<input type="hidden" name="subject" value="Portfolio contact — anmshpndy.com" />
<input type="hidden" name="from_name" value="Portfolio Contact Form" />
```

3. Update `#formSuccess` default copy from “Opening your email client…” to neutral: “Sending…” / success / error messages driven by JS.

4. Add privacy microcopy under submit button (one line).

5. Load scripts:

```html
<script src="/assets/contact.js" defer></script>
```

Place **after** `nav.js`, before or after `visuals.js` (contact has no dependency on visuals).

6. Add analytics snippets in `<head>` (or end of body per provider docs):
   - Cloudflare Web Analytics beacon
   - Optional Clarity script

Repeat **analytics only** on article pages and `404.html` (same beacon). **Do not** add form POST logic to article pages.

### Phase 3 — `assets/contact.js` (new file)

**Owns:** form submit, validation (reuse existing rules), `fetch` to Web3Forms, UI states, mailto fallback.

**Pseudoflow:**

```text
on submit (preventDefault)
  → validate fname, femail, fmsg (existing aria-invalid pattern)
  → set loading state on .form-btn (disabled + aria-busy)
  → POST JSON { access_key, name, email, message, subject, botcheck }
  → on success: show success, reset form, announce via #formSuccess (aria-live)
  → on failure: show error + offer mailto fallback link
```

**Web3Forms fetch example (adapt to repo style — IIFE, no modules):**

```js
fetch('https://api.web3forms.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({
    access_key: 'REPLACE_AT_SETUP', // domain-locked in dashboard
    name: nameEl.value.trim(),
    email: emailEl.value.trim(),
    message: msgEl.value.trim(),
    subject: 'Portfolio contact — anmshpndy.com',
    botcheck: '' // honeypot must be empty
  })
});
```

**Config pattern:** store key in a single constant at top of `contact.js` OR `assets/site-config.js` (if you want one place for analytics IDs too). Document in README that key is public but domain-restricted.

**mailto fallback** (keep existing behavior on network error):

```js
// Build same mailto URL as today; show "Couldn't send automatically — open email instead"
```

### Phase 4 — CSS (`assets/site.css`)

- `.form-btn[aria-busy="true"]` — loading opacity / cursor
- `.form-success` variants: `.is-error`, `.is-loading` if needed
- `.form-privacy` — small muted line under button

### Phase 5 — Service worker (`sw.js`)

- Add `/assets/contact.js` to `ASSETS` array.
- Bump `CACHE` version (e.g. `ap-v8` → `ap-v9`).

### Phase 6 — README + docs

- **README.md**: “Contact form” section — Web3Forms dashboard URL, how to view submissions, how to rotate access key.
- **README.md**: “Analytics” section — Cloudflare dashboard link, what is tracked.
- Do **not** commit `.env` files (not applicable without build).

---

## Viewing submissions & analytics (operator guide — include in final report)

| Need | Where |
|------|--------|
| **Email alert** | Gmail inbox `animeshpandey1909@gmail.com` (per submission) |
| **Submission history** | Web3Forms dashboard → Submissions |
| **Page views / referrers** | Cloudflare Web Analytics dashboard |
| **Heatmaps / recordings** | Microsoft Clarity dashboard (if enabled) |

---

## Privacy & compliance (implement minimally)

1. Add under form: *“Your message is sent securely to my inbox via Web3Forms. I don't sell your data.”* (adjust wording to match provider).
2. Analytics: Cloudflare Web Analytics is cookieless; Clarity uses cookies — if Clarity is added, consider a one-line cookie notice in footer (or skip Clarity if user wants zero banner).
3. Do not send form data to GA4 (PII risk).

---

## Verification checklist

### Contact form

- [ ] Valid submission → success UI + email received within ~2 min
- [ ] Submission appears in Web3Forms dashboard
- [ ] Invalid email → inline errors, no POST
- [ ] Honeypot filled (dev test) → rejected or silent fail per provider
- [ ] Airplane mode / failed fetch → error message + mailto fallback works
- [ ] Keyboard-only submit works; focus not trapped
- [ ] Mobile Safari + Chrome Android tested
- [ ] `aria-live` announces success/error

### Analytics

- [ ] Beacon on homepage, both articles, 404
- [ ] Cloudflare dashboard shows visit within 24h (or real-time if available)
- [ ] No console errors from blocked scripts
- [ ] Lighthouse: no major perf regression from scripts (defer/async per provider)

### Architecture

- [ ] Inline mailto handler **removed** from `index.html` (logic only in `contact.js`)
- [ ] `sw.js` cache bumped
- [ ] Domain restriction enabled in Web3Forms

---

## Commit plan

1. `portfolio: add contact.js with Web3Forms submit and mailto fallback`
2. `portfolio: wire contact form HTML, privacy copy, and loading states`
3. `portfolio: add Cloudflare Web Analytics (and optional Clarity)`
4. `portfolio: bump service worker cache and document form/analytics in README`

Do not commit provider API keys in git history messages. User may paste key during setup — document placeholder `YOUR_WEB3FORMS_ACCESS_KEY` in code with README instruction to replace.

---

## Anti-patterns

- Running a custom Node/Python server on GitHub Pages (not supported)
- Storing submissions only in `localStorage` (not real recording)
- Google Forms embed (ugly, off-brand)
- Multiple competing analytics scripts (GA + Plausible + CF — pick one primary)
- Blocking submit on third-party cookie consent before first paint
- Removing mailto entirely without API fallback path
- Putting form handling inside `visuals.js` or `nav.js`

---

## Phase 0 output (required before coding)

Reply with:

1. **Chosen providers** (default: Web3Forms + Cloudflare Web Analytics)
2. **Files to touch** (list)
3. **Risks** (spam, public access key, Clarity cookies)
4. **Open questions** (max 2): e.g. “Enable Clarity?” “Add Turnstile now or wait for spam?”

Then implement unless user said to proceed without approval.

---

## Execution instruction

Implement the **recommended stack** end-to-end. Keep the site static. Prefer **Web3Forms + Cloudflare Web Analytics**. Add **Microsoft Clarity** only if behavioral analytics are worth a possible cookie notice.

After implementation, provide the **operator guide** (dashboard URLs, how to test, how to rotate keys) and confirm checklist results.
