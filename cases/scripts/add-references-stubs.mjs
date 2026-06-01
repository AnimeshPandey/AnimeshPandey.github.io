#!/usr/bin/env node
/** Insert minimal 3-tone references chapter before takeaway when missing. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const casesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/cases');

const REFS = {
  default: {
    junior: ['MDN Web Docs — relevant API guides.', 'web.dev — Learn section.'],
    mid: ['MDN — detailed reference.', 'W3C / WHATWG specs where applicable.'],
    staff: ['Primary spec or RFC.', 'web.dev — performance and best practices.'],
  },
};

function block(tone, items) {
  const lis = items.map((t) => `      <li>${t}</li>`).join('\n');
  return `  <div class="tone-${tone}">\n    <ol>\n${lis}\n    </ol>\n  </div>`;
}

function chapter(slug) {
  const r = REFS[slug] || REFS.default;
  return `
{# ── Chapter: References (stub — expand per case) ── #}
<section class="case-chapter case-references" data-chapter="references">
  <h3>References</h3>
${block('junior', r.junior)}
${block('mid', r.mid)}
${block('staff', r.staff)}
</section>
`;
}

let n = 0;
for (const slug of fs.readdirSync(casesDir)) {
  const file = path.join(casesDir, slug, 'index.njk');
  if (!fs.existsSync(file)) continue;
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('data-chapter="references"')) continue;
  const marker = '<section class="case-chapter" data-chapter="takeaway">';
  if (!s.includes(marker)) continue;
  s = s.replace(marker, chapter(slug) + '\n' + marker);
  fs.writeFileSync(file, s);
  n++;
  console.log('Added references:', slug);
}
console.log('Done.', n, 'files updated.');
