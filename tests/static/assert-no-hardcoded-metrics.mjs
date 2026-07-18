#!/usr/bin/env node
/**
 * Guardrail against reintroducing the "hand-typed number pretending to be a
 * computed one" bug class (design-backlog idea #48 — a cheap, generic
 * regression guard for the exact defect ideas #1/#9 fixed one surface at a
 * time). Scans template *source* (not built output) for a literal digit
 * sitting directly next to "min read" or a card-catalog "No. <n>" stamp —
 * the signature of a value someone typed by hand instead of sourcing from a
 * filter/global-data computation (which would show as a Nunjucks `{{ }}`
 * expression in the source, never a bare literal digit).
 *
 * A handful of hits are known, real, and *not* bugs — teaser pages whose
 * full prose lives externally (Medium/Dev.to), where "min read" describes
 * that external piece and can't be computed from local content. Those are
 * allowlisted explicitly below with the reasoning, so a NEW hardcoded hit
 * anywhere else still fails the build. If this list needs to grow, that's
 * a signal to re-check whether the new hit is genuinely unmeasurable
 * locally (allowlist-worthy) or just a missed wiring of an existing filter
 * (fix it instead).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const SCAN_DIRS = [path.join(ROOT, 'site/src'), path.join(ROOT, 'cases/src')];

// "<file relative to ROOT>:<1-based line number>" — each entry here is a
// known-external, unverifiable-locally reading time (see module comment).
const ALLOWLIST = new Set([
  'site/src/fundamentals-of-functional-javascript/index.njk:28',
  'site/src/fundamentals-of-functional-javascript/index.njk:72',
  'site/src/how-well-do-you-know-this/index.njk:28',
  'site/src/how-well-do-you-know-this/index.njk:68',
  'site/src/streaming-agent-ui-without-chatbot-clipart/index.njk:307',
]);

const SUSPECT_PATTERNS = [
  /(?<!\{\{[^}]{0,40})\b\d+\s*min read\b/, // literal digit, not from a {{ }} expression just before it
  />\s*No\.\s*\d+\s*</, // a literal rendered "No. <n>" stamp, not `{{ ... }}`
];

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '_site') continue;
      walk(p, out);
    } else if (ent.name.endsWith('.njk')) {
      out.push(p);
    }
  }
  return out;
}

const files = [];
SCAN_DIRS.forEach((d) => walk(d, files));

const errors = [];
let allowlistedHits = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    // Skip pure comment lines ({# ... #}) — they can't render a fabricated
    // number to a visitor, so they're not the bug this guard targets.
    const trimmed = line.trim();
    if (trimmed.startsWith('{#') || trimmed.startsWith('*')) return;

    const hit = SUSPECT_PATTERNS.some((re) => re.test(line));
    if (!hit) return;

    const key = `${rel}:${idx + 1}`;
    if (ALLOWLIST.has(key)) {
      allowlistedHits += 1;
      return;
    }
    errors.push(`${key}: hardcoded metric-looking literal — "${trimmed}"`);
  });
}

// Catch allowlist entries that no longer match anything real (stale allowlist).
if (allowlistedHits < ALLOWLIST.size) {
  errors.push(
    `allowlist has ${ALLOWLIST.size} entries but only ${allowlistedHits} still match a real line — remove stale entries`
  );
}

if (errors.length) {
  console.error('Hardcoded-metric guard failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log(
  'OK: no unexplained hardcoded "min read" / "No. <n>" literals in template source (',
  allowlistedHits,
  'known external-source exceptions allowlisted )'
);
