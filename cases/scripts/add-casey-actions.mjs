#!/usr/bin/env node
/**
 * Add demo + takeaway + hook action chips to casey.json for cases with interactive demos.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesDir = path.join(__dirname, '../src/cases');
const pathPrefix = '/cases/';

const DEMO_ACTIONS = {
  chapter: 'demo',
  junior: [
    { label: 'Try broken', target: '[data-demo-state=broken]' },
    { label: 'Try fixed', target: '[data-demo-state=fixed]' },
  ],
  mid: [
    { label: 'Toggle broken', target: '[data-demo-state=broken]' },
    { label: 'Toggle fixed', target: '[data-demo-state=fixed]' },
  ],
  staff: [
    { label: 'Broken state', target: '[data-demo-state=broken]' },
    { label: 'Fixed state', target: '[data-demo-state=fixed]' },
  ],
};

const HOOK_ACTIONS = {
  chapter: 'hook',
  junior: [{ label: 'Jump to demo', target: '[data-chapter=demo]' }],
  mid: [{ label: 'Skip to demo', target: '[data-chapter=demo]' }],
  staff: [{ label: 'Demo chapter', target: '[data-chapter=demo]' }],
};

const TAKEAWAY_ACTIONS = {
  chapter: 'takeaway',
  junior: [
    { label: 'Back to all cases', href: pathPrefix },
    { label: 'Reading library', href: pathPrefix + 'library/' },
  ],
  mid: [
    { label: 'Hub', href: pathPrefix },
    { label: 'Library', href: pathPrefix + 'library/' },
  ],
  staff: [
    { label: 'Case hub', href: pathPrefix },
    { label: 'War stories', href: pathPrefix + 'library/' },
  ],
};

function hasDemo(slugDir) {
  const njk = path.join(slugDir, 'index.njk');
  if (!fs.existsSync(njk)) return false;
  return fs.readFileSync(njk, 'utf8').includes('data-demo-state');
}

function mergeActions(existing, block) {
  const out = existing.filter((a) => a.chapter !== block.chapter);
  out.push(block);
  return out;
}

let updated = 0;
for (const slug of fs.readdirSync(casesDir)) {
  const slugDir = path.join(casesDir, slug);
  if (!fs.statSync(slugDir).isDirectory()) continue;
  if (!hasDemo(slugDir)) continue;

  const caseyPath = path.join(slugDir, 'casey.json');
  let data = { slug, hints: [], actions: [] };
  if (fs.existsSync(caseyPath)) {
    data = JSON.parse(fs.readFileSync(caseyPath, 'utf8'));
  }
  data.slug = slug;
  data.actions = data.actions || [];
  data.actions = mergeActions(data.actions, DEMO_ACTIONS);
  data.actions = mergeActions(data.actions, HOOK_ACTIONS);
  data.actions = mergeActions(data.actions, TAKEAWAY_ACTIONS);
  fs.writeFileSync(caseyPath, JSON.stringify(data, null, 2) + '\n');
  updated++;
  console.log('actions:', slug);
}

console.log('Updated', updated, 'casey.json files');
