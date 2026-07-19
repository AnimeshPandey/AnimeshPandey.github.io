/**
 * Pulls real per-tone chapter prose out of a case's index.njk. This is the
 * grounding material for the draft generator: casey.json's concept/fe-depth
 * *hints* are frequently boilerplate (see lib/boilerplate.mjs), but the
 * actual chapter body text in index.njk is reliably case-specific — it's
 * the thing a good hint should actually be pointing at.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CASES_ROOT = resolve(__dir, '../../..');

export function caseSourcePath(slug) {
  return resolve(CASES_ROOT, `src/cases/${slug}/index.njk`);
}

export function readCaseHtml(slug) {
  const path = caseSourcePath(slug);
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

/** Sections in this codebase don't nest, so a plain indexOf close is safe. */
function extractSection(html, chapter) {
  const openRe = new RegExp(`<section\\b[^>]*data-chapter="${chapter}"[^>]*>`, 'i');
  const open = openRe.exec(html);
  if (!open) return null;
  const bodyStart = open.index + open[0].length;
  const bodyEnd = html.indexOf('</section>', bodyStart);
  return bodyEnd === -1 ? null : html.slice(bodyStart, bodyEnd);
}

/** Div-depth-aware extraction — tone blocks can contain their own nested divs. */
function extractBalancedDiv(html, contentStart) {
  const tagRe = /<div\b[^>]*>|<\/div>/gi;
  tagRe.lastIndex = contentStart;
  let depth = 1;
  let match;
  while ((match = tagRe.exec(html))) {
    depth += match[0][1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(contentStart, match.index);
  }
  return null;
}

function extractToneBlock(sectionHtml, tone) {
  const openRe = new RegExp(`<div\\s+class="tone-${tone}"\\s*>`, 'i');
  const open = openRe.exec(sectionHtml);
  if (!open) return '';
  return extractBalancedDiv(sectionHtml, open.index + open[0].length) ?? '';
}

function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' [code example] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns the plain-text prose for one chapter/tone from a case's
 * index.njk, or '' if the case has no source file, no such chapter, or no
 * such tone block. Never throws — a missing extraction just means the
 * generator has less grounding for that slot, not a hard failure.
 */
export function chapterProse(html, chapter, tone) {
  if (!html) return '';
  const section = extractSection(html, chapter);
  if (!section) return '';
  return htmlToPlainText(extractToneBlock(section, tone));
}
