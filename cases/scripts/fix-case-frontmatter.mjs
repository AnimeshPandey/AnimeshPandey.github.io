#!/usr/bin/env node
/**
 * Repair index.njk frontmatter (orphan ---, duplicated YAML, ogImage outside block).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CASES = path.join(ROOT, 'src/cases');
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/_data/manifest.json'), 'utf8')
);
const TITLES = Object.fromEntries(MANIFEST.cases.map((c) => [c.slug, c.title]));

const BODY_START = /\n(\{# ── Chapter|<section class="case-chapter")/;

function extractYamlFields(text) {
  const fm = {};
  const simple = [
    'layout',
    'permalink',
    'title',
    'description',
    'slug',
    'track',
    'readMin',
    'flagship',
    'demoType',
    'publishedAt',
    'principle',
    'schemaType',
    'ogImage',
    'status',
    'tier',
  ];
  for (const key of simple) {
    if (key === 'title') {
      const titles = [...text.matchAll(/^title:\s*(.+)$/gm)].map((m) =>
        m[1].replace(/^["']|["']$/g, '')
      );
      if (titles.length) {
        fm.title =
          titles.find((t) => t.includes(':')) ||
          titles.find((t) => t !== fm.slug && t.length > 12) ||
          titles[titles.length - 1];
      }
      continue;
    }
    const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    if (m) fm[key] = m[1].replace(/^["']|["']$/g, '');
  }
  const relBlock = text.match(/relatedCases:\s*([\s\S]*?)(?=\n[a-zA-Z][\w-]*:|$)/);
  if (relBlock) {
    fm.relatedCases = [];
    const slugM = [...relBlock[1].matchAll(/slug:\s*(\S+)/g)];
    const titleM = [...relBlock[1].matchAll(/title:\s*(.+)/g)];
    slugM.forEach((s, i) => {
      fm.relatedCases.push({
        slug: s[1],
        title: titleM[i] ? titleM[i][1].trim() : s[1],
      });
    });
  }
  return fm;
}

function yamlQuote(v) {
  if (!v) return '""';
  if (v.startsWith('"') && v.endsWith('"')) return v;
  if (v.startsWith("'") && v.endsWith("'")) return v;
  if (/[:#{}[\],&*?|>!%@`]|^\s|\s$/.test(v) || v.includes('"')) {
    return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return v;
}

function buildFrontmatter(fm) {
  const lines = [
    '---',
    `layout: ${fm.layout || 'layouts/case-layout.njk'}`,
    `permalink: ${yamlQuote(fm.permalink || '/{{ slug }}/index.html')}`,
    `title: ${yamlQuote(fm.title)}`,
  ];
  if (fm.description) lines.push(`description: ${yamlQuote(fm.description)}`);
  if (fm.publishedAt) lines.push(`publishedAt: ${yamlQuote(fm.publishedAt)}`);
  lines.push(`slug: ${fm.slug}`);
  if (fm.track) lines.push(`track: ${fm.track}`);
  if (fm.readMin) lines.push(`readMin: ${fm.readMin}`);
  if (fm.flagship) lines.push(`flagship: ${fm.flagship}`);
  if (fm.demoType) lines.push(`demoType: ${fm.demoType}`);
  if (fm.principle) lines.push(`principle: ${fm.principle}`);
  if (fm.schemaType) lines.push(`schemaType: ${fm.schemaType}`);
  if (fm.relatedCases?.length) {
    lines.push('relatedCases:');
    for (const r of fm.relatedCases) {
      lines.push(`  - slug: ${r.slug}`);
      lines.push(`    title: ${r.title}`);
    }
  }
  lines.push(
    `ogImage: ${fm.ogImage || `https://anmshpndy.com/brand/cases/${fm.slug}-og.png`}`
  );
  lines.push('---');
  return lines.join('\n');
}

function repairFile(dir) {
  const file = path.join(CASES, dir, 'index.njk');
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(BODY_START);
  if (!m || m.index == null) {
    console.warn('skip (no body marker):', dir);
    return false;
  }
  const body = src.slice(m.index + 1);
  const header = src.slice(0, m.index);
  const yamlBlob = header.replace(/^---\s*$/gm, '\n').trim();
  const fm = extractYamlFields(yamlBlob);
  fm.slug = fm.slug || dir;
  if (TITLES[dir]) fm.title = TITLES[dir];
  const out = `${buildFrontmatter(fm)}\n\n${body}`;
  fs.writeFileSync(file, out.endsWith('\n') ? out : out + '\n');
  return true;
}

let fixed = 0;
for (const dir of fs.readdirSync(CASES)) {
  const njk = path.join(CASES, dir, 'index.njk');
  if (!fs.statSync(path.join(CASES, dir)).isDirectory() || !fs.existsSync(njk)) continue;
  if (repairFile(dir)) {
    console.log('repaired:', dir);
    fixed++;
  }
}
console.log('Done.', fixed, 'files.');
