#!/usr/bin/env node
/**
 * Audit all manifest status:live cases for tone coverage, casey.json, demos, refs.
 * Run: node scripts/audit-live-cases.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/_data/manifest.json'), 'utf8')
);
const casesDir = path.join(ROOT, 'src/cases');
const demosDir = path.join(ROOT, 'src/assets/js/demos');

const live = manifest.cases.filter((c) => c.status === 'live');

function countTone(file, tone) {
  if (!fs.existsSync(file)) return 0;
  const s = fs.readFileSync(file, 'utf8');
  return (s.match(new RegExp(`class="tone-${tone}"`, 'g')) || []).length;
}

function hasChapter(file, ch) {
  if (!fs.existsSync(file)) return false;
  return fs.readFileSync(file, 'utf8').includes(`data-chapter="${ch}"`);
}

const rows = live.map((c) => {
  const slug = c.slug;
  const njk = path.join(casesDir, slug, 'index.njk');
  const caseyPath = path.join(casesDir, slug, 'casey.json');
  const demoPath = path.join(demosDir, `${slug}.js`);
  const j = countTone(njk, 'junior');
  const m = countTone(njk, 'mid');
  const s = countTone(njk, 'staff');
  const minTone = Math.min(j, m, s);
  const casey = fs.existsSync(caseyPath) ? JSON.parse(fs.readFileSync(caseyPath, 'utf8')) : null;
  const hints = casey?.hints?.length || 0;
  const hints3 = (casey?.hints || []).filter(
    (h) => h.junior && h.mid && h.staff
  ).length;
  return {
    slug,
    j,
    m,
    s,
    minTone,
    demo: fs.existsSync(demoPath),
    refs: hasChapter(njk, 'references'),
    takeaway: hasChapter(njk, 'takeaway'),
    uiStrip: hasChapter(njk, 'ui-strip'),
    caseyHints: hints,
    hints3,
    score:
      (minTone >= 5 ? 2 : minTone >= 3 ? 1 : 0) +
      (fs.existsSync(demoPath) ? 2 : 0) +
      (hasChapter(njk, 'references') ? 1 : 0) +
      (hints3 >= 2 ? 2 : hints >= 1 ? 1 : 0),
  };
});

console.log('| slug | J/M/S tones | demo | refs | hints×3 | score |');
console.log('|------|-------------|------|------|---------|-------|');
rows
  .sort((a, b) => a.score - b.score)
  .forEach((r) => {
    console.log(
      `| ${r.slug} | ${r.j}/${r.m}/${r.s} | ${r.demo ? 'yes' : '**no**'} | ${r.refs ? 'yes' : 'no'} | ${r.hints3}/${r.caseyHints} | ${r.score}/7 |`
    );
  });

const out = path.join(ROOT, 'LIVE-CASES-AUDIT.md');
const md = `# Live cases audit (${live.length})\n\nGenerated: ${new Date().toISOString().slice(0, 10)}\n\n| slug | junior | mid | staff | demo | refs | takeaway | hints (3-tone) | score |\n|------|--------|-----|-------|------|------|----------|----------------|-------|\n${rows
  .map(
    (r) =>
      `| ${r.slug} | ${r.j} | ${r.m} | ${r.s} | ${r.demo ? '✓' : '—'} | ${r.refs ? '✓' : '—'} | ${r.takeaway ? '✓' : '—'} | ${r.hints3}/${r.caseyHints} | ${r.score}/7 |`
  )
  .join('\n')}\n`;
fs.writeFileSync(out, md);
console.log('\nWrote', out);
