/**
 * Builds a self-contained HTML document for one Instagram "principle card"
 * (1080×1350 — IG feed portrait). Playwright loads this directly via
 * page.setContent(), no server or build step involved.
 *
 * Inlines the REAL theme.css + casebook-tokens.css files rather than
 * hardcoding color values, so the card can never drift from whatever the
 * live site actually renders — see render-cards.mjs's header comment for
 * why that matters here specifically (the site currently renders with
 * `data-theme="light"` hardcoded in casebook-layout.njk, i.e. the
 * portfolio's terracotta accent, not the sage accent BRANDING.md
 * describes as locked — this template intentionally follows the real
 * site, not the planning doc, and will follow it automatically if that
 * gap ever gets fixed).
 *
 * Card fonts are a plain system stack, not the site's webfonts (DM Serif
 * Display / Plus Jakarta Sans) — those load from Google Fonts at runtime
 * on the real site and aren't guaranteed available to a headless render
 * with no network access. Color tokens carry the brand identity here;
 * exact typeface match is a nice-to-have, not attempted.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dir, '../../../..');
const THEME_CSS_PATH = resolve(REPO_ROOT, 'assets/theme.css');
const TOKENS_CSS_PATH = resolve(REPO_ROOT, 'cases/src/assets/css/casebook-tokens.css');

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readRealTokens() {
  return {
    themeCss: readFileSync(THEME_CSS_PATH, 'utf8'),
    tokensCss: readFileSync(TOKENS_CSS_PATH, 'utf8'),
  };
}

/**
 * @param {object} c - a loaded case (see lib/content.mjs's loadCase)
 * @param {string} caseySvg - raw <svg>...</svg> markup, read by the caller
 *   from cases/src/assets/casey/{tone}/idle.svg (kept out of this module
 *   so it stays a pure string-builder with one clear file-reading job).
 */
export function buildPrincipleCardHtml(c, caseySvg) {
  const { themeCss, tokensCss } = readRealTokens();
  // Path only (no domain) — shorter, still identifies the specific case.
  const displayUrl = new URL(c.url).pathname;

  return `<!doctype html>
<html data-theme="light">
<head>
<meta charset="utf-8">
<style>
${themeCss}
${tokensCss}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  background: var(--casebook-bg);
  color: var(--casebook-ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: flex;
  flex-direction: column;
  padding: 96px 88px;
  overflow: hidden;
}
.content { margin: auto 0; }
.eyebrow {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 28px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--casebook-accent);
  font-weight: 600;
}
.title {
  font-size: 76px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.01em;
  margin: 48px 0 0;
  max-width: 880px;
}
.principle-pill {
  display: inline-block;
  margin-top: 40px;
  padding: 14px 28px;
  border-radius: 999px;
  background: var(--casebook-accent);
  color: var(--casebook-accent-contrast);
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 26px;
  font-weight: 600;
}
.hook {
  font-size: 34px;
  line-height: 1.5;
  color: var(--casebook-ink-muted);
  max-width: 820px;
  margin-top: 40px;
}
.footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-top: 2px solid var(--casebook-border);
  padding-top: 40px;
}
.casey-mark { width: 130px; height: 130px; flex: none; }
.brand {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 24px;
  color: var(--casebook-ink-muted);
  text-align: left;
  max-width: 460px;
}
.brand strong { display: block; color: var(--casebook-ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 32px; margin-bottom: 8px; text-align: right; }
</style>
</head>
<body>
  <div class="content">
    <div class="eyebrow">The Frontend Casebook</div>
    <div class="title">${escapeHtml(c.title)}</div>
    ${c.principle ? `<div class="principle-pill">${escapeHtml(c.principle)}</div>` : ''}
    <div class="hook">${escapeHtml(c.hook)}</div>
  </div>
  <div class="footer">
    <div class="casey-mark">${caseySvg}</div>
    <div class="brand"><strong>Read the full case</strong>${escapeHtml(displayUrl)}</div>
  </div>
</body>
</html>`;
}
