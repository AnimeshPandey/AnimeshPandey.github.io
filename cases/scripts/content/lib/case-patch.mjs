/**
 * Writes into a scaffolded case's index.njk — the counterpart to
 * case-source.mjs's read-only chapterProse(). Used by apply-case-prose.mjs
 * to turn a reviewed draft into real chapter content, replacing only the
 * TODO placeholder the scaffold tool left behind.
 *
 * Same markup assumptions as case-source.mjs (sections don't nest, tone
 * blocks are `<div class="tone-{tone}">...</div>` inside `<section
 * class="case-chapter" data-chapter="{chapter}">`), so both files should
 * be kept in sync if the case-page markup shape ever changes.
 */

function findSectionRange(html, chapter) {
  const openRe = new RegExp(`<section\\b[^>]*data-chapter="${chapter}"[^>]*>`, 'i');
  const open = openRe.exec(html);
  if (!open) return null;
  const bodyStart = open.index + open[0].length;
  const bodyEnd = html.indexOf('</section>', bodyStart);
  if (bodyEnd === -1) return null;
  return { start: open.index, bodyStart, bodyEnd, end: bodyEnd + '</section>'.length };
}

function findToneBlockRange(html, sectionStart, sectionBodyEnd, tone) {
  const openRe = new RegExp(`<div\\s+class="tone-${tone}"\\s*>`, 'i');
  openRe.lastIndex = sectionStart;
  const open = openRe.exec(html.slice(sectionStart, sectionBodyEnd));
  if (!open) return null;
  const absoluteOpenIndex = sectionStart + open.index;
  const contentStart = absoluteOpenIndex + open[0].length;

  const tagRe = /<div\b[^>]*>|<\/div>/gi;
  tagRe.lastIndex = contentStart;
  let depth = 1;
  let match;
  while ((match = tagRe.exec(html))) {
    if (match.index >= sectionBodyEnd) return null;
    depth += match[0][1] === '/' ? -1 : 1;
    if (depth === 0) {
      return { start: absoluteOpenIndex, contentStart, contentEnd: match.index, end: match.index + match[0].length };
    }
  }
  return null;
}

/**
 * Replaces the <h2> headline text inside a chapter section. Leaves
 * everything else in the section (tone blocks, demo markup) untouched.
 * Returns the patched HTML, or null if the chapter/headline wasn't found.
 *
 * newHeadline is treated as trusted HTML (may contain inline <code> etc.),
 * same as newBodyHtml in patchToneBody below — see that function's comment
 * for why this pipeline doesn't escape.
 */
export function patchHeadline(html, chapter, newHeadline) {
  const range = findSectionRange(html, chapter);
  if (!range) return null;
  const section = html.slice(range.bodyStart, range.bodyEnd);
  const h2Re = /<h2>[\s\S]*?<\/h2>/;
  if (!h2Re.test(section)) return null;
  const patchedSection = section.replace(h2Re, `<h2>${newHeadline}</h2>`);
  return html.slice(0, range.bodyStart) + patchedSection + html.slice(range.bodyEnd);
}

/**
 * Replaces the inner content of one chapter/tone block with new body HTML.
 *
 * newBodyHtml is trusted, unescaped HTML, not plain text — this codebase's
 * real chapter prose routinely uses inline <code>/<strong> (see any live
 * case's index.njk), and this function is only ever called from
 * apply-case-prose.mjs, which only runs after a human has read the exact
 * HTML being applied (same draft/review/apply gate as apply-draft.mjs).
 * Escaping here would silently turn `<code>key</code>` into literal
 * "&lt;code&gt;key&lt;/code&gt;" text on the live page.
 *
 * Returns the patched HTML, or null if the chapter or tone block wasn't found.
 */
export function patchToneBody(html, chapter, tone, newBodyHtml) {
  const section = findSectionRange(html, chapter);
  if (!section) return null;
  const block = findToneBlockRange(html, section.bodyStart, section.bodyEnd, tone);
  if (!block) return null;
  return html.slice(0, block.contentStart) + `\n    ${newBodyHtml}\n  ` + html.slice(block.contentEnd);
}

/** Wraps paragraph HTML strings (may contain inline tags) into `<p>` blocks. */
export function buildParagraphsHtml(paragraphs) {
  return paragraphs.map((p) => `<p>\n      ${p}\n    </p>`).join('\n    ');
}
