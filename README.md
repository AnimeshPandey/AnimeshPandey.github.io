# animeshpandey.github.io

Personal portfolio — Senior Frontend Engineer.  
Live at: **https://animeshpandey.github.io**

---

## Deploy to GitHub Pages (5 minutes)

### Step 1 — Create the repo

1. Go to [github.com/new](https://github.com/new)
2. Name it exactly: `animeshpandey.github.io`  
   _(must match your GitHub username for root domain hosting)_
3. Set it to **Public**
4. Click **Create repository**

### Step 2 — Push the files

```bash
cd portfolio/              # wherever you saved this folder
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/animeshpandey/animeshpandey.github.io.git
git push -u origin main
```

### Step 3 — Enable Pages

1. Open the repo on GitHub → **Settings → Pages**
2. Under **Source**, select `main` branch, `/ (root)` folder
3. Click **Save**
4. Wait ~60 seconds, then visit `https://animeshpandey.github.io`

That's it. No build step, no CI needed.

---

## Add your resume PDF

Place your resume as `resume.pdf` in this folder:

```
portfolio/
├── index.html
├── resume.pdf   ← add this
└── README.md
```

Then push:
```bash
git add resume.pdf
git commit -m "Add resume PDF"
git push
```

The "Download Resume" button and footer link will work automatically.

---

## Add to your resume

Once live, add this to your resume contact section:

```
🌐  animeshpandey.github.io
```

In LaTeX, add to the header line:
```latex
\faIcon{globe}\enspace \href{https://animeshpandey.github.io}{animeshpandey.github.io}
```

---

## Customise content

All content is in `index.html`. Search for these comments to find editable sections:

| Comment | What to update |
|---|---|
| `<!-- UPDATE: Replace href="#" ... projects -->` | Swap placeholder project links with real case study URLs |
| `<!-- UPDATE: Replace href="#" ... writing -->` | Add real Medium/blog links when articles are published |
| `Open to opportunities` (badge) | Change to "Currently employed" when not looking |

### Adding a real blog post
Find any `.wi` block in the writing section and update:
```html
<a href="https://medium.com/your-post-url" class="wi fade-up" target="_blank">
  <div>
    <div class="wi-date">Jun 2026</div>
    <div class="wi-title">Your Article Title</div>
    <div class="wi-excerpt">Brief excerpt or subtitle here.</div>
  </div>
  <div class="wi-arrow">↗</div>
</a>
```

### Changing availability status
Find the badge in the `#hero` section:
```html
<!-- Open to work -->
<div class="badge"><span class="badge-dot"></span>Open to opportunities</div>

<!-- Not looking -->
<div class="badge" style="background:var(--surface-2);color:var(--ink-3);">Currently employed</div>
```

---

## Using Formspree for the contact form (optional upgrade)

The contact form currently opens the user's email client (works with zero setup).  
For a true in-page form submission, sign up free at [formspree.io](https://formspree.io):

1. Create a form → get your form ID (e.g. `xpzgkdvl`)
2. In `index.html`, find `id="contactForm"` and change:
   ```html
   <form class="form" id="contactForm" novalidate>
   ```
   to:
   ```html
   <form class="form" action="https://formspree.io/f/xpzgkdvl" method="POST">
   ```
3. Remove the JS submit handler block (the last `addEventListener` in the script)

---

## Tech stack

- Pure HTML / CSS / vanilla JS — zero build step
- Fonts: DM Serif Display + Plus Jakarta Sans + JetBrains Mono (Google Fonts)
- Hosted on GitHub Pages (free, custom domain supported)
