/**
 * demos/feature-sliced-folders.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": renders two static folder trees containing the same
 * 8 files for 3 features (saved-searches, price-alerts, recent-views) —
 * one grouped by technical layer, one grouped by feature slice — so the
 * reader can see how much is scattered/interleaved in each.
 */
import { wireToggleDemo } from './_demo-utils.js';

function tree(html) {
  return `<pre style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:10px 12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;margin:0;overflow-x:auto;line-height:1.6;">${html}</pre>`;
}

function setupBroken(vp) {
  vp.innerHTML = `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">✗ Grouped by technical layer — saved-searches' 4 files are split across 4 folders, interleaved with 2 other features</p>
    ${tree(
`src/
├── components/
│   ├── <mark style="background:none;color:var(--casebook-accent);">SavedSearchList.jsx</mark>
│   ├── PriceAlertBanner.jsx
│   ├── <mark style="background:none;color:var(--casebook-accent);">SavedSearchCard.jsx</mark>
│   └── RecentViewsStrip.jsx
├── hooks/
│   ├── <mark style="background:none;color:var(--casebook-accent);">useSavedSearches.js</mark>
│   ├── usePriceAlerts.js
│   └── useRecentViews.js
├── utils/
│   ├── formatPriceAlert.js
│   ├── <mark style="background:none;color:var(--casebook-accent);">formatSavedSearchLabel.js</mark>
│   └── formatRecentView.js
└── services/
    ├── <mark style="background:none;color:var(--casebook-accent);">savedSearchApi.js</mark>
    └── priceAlertApi.js`
    )}
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;">Highlighted = saved-searches' files. To delete the feature: open 4 folders, find 4 files, hope nothing else imports them.</p>
  `;
}

function setupFixed(vp) {
  vp.innerHTML = `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">✓ Grouped by feature — saved-searches' 4 files live together, deletable as one folder</p>
    ${tree(
`src/
├── features/
│   ├── <mark style="background:none;color:var(--casebook-accent);">saved-searches/</mark>
│   │   ├── <mark style="background:none;color:var(--casebook-accent);">SavedSearchList.jsx</mark>
│   │   ├── <mark style="background:none;color:var(--casebook-accent);">SavedSearchCard.jsx</mark>
│   │   ├── <mark style="background:none;color:var(--casebook-accent);">useSavedSearches.js</mark>
│   │   ├── <mark style="background:none;color:var(--casebook-accent);">formatSavedSearchLabel.js</mark>
│   │   └── <mark style="background:none;color:var(--casebook-accent);">savedSearchApi.js</mark>
│   ├── price-alerts/
│   │   ├── PriceAlertBanner.jsx
│   │   ├── usePriceAlerts.js
│   │   ├── formatPriceAlert.js
│   │   └── priceAlertApi.js
│   └── recent-views/
│       ├── RecentViewsStrip.jsx
│       ├── useRecentViews.js
│       └── formatRecentView.js
└── shared/
    └── (only components/utils used by 2+ features)`
    )}
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;">Highlighted = saved-searches' files. To delete the feature: delete features/saved-searches/.</p>
  `;
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
