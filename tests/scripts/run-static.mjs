#!/usr/bin/env node
/**
 * Run all static contract checks against staged _deploy + casebook source.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const TESTS = path.dirname(fileURLToPath(import.meta.url));

function runNode(script, cwd) {
  const r = spawnSync(process.execPath, [script], { stdio: 'inherit', cwd });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const STATIC = path.join(TESTS, '..', 'static');

runNode(path.join(TESTS, 'sync-live-slugs.mjs'), path.join(TESTS, '..'));

const scripts = [
  'assert-casey-fur.mjs',
  'assert-casey-no-checker.mjs',
  'assert-casey-floor-matte.mjs',
  'assert-live-cases.mjs',
  'assert-deploy-routes.mjs',
  'assert-critical-assets.mjs',
  'assert-html-contracts.mjs',
  'assert-seo-structured-data.mjs',
  'assert-case-continue.mjs',
  'assert-manifest-consistency.mjs',
  'assert-reading-time-honesty.mjs',
  'assert-portfolio-reading-time-honesty.mjs',
  'assert-internal-links-sample.mjs',
  'assert-json-embeds.mjs',
  'assert-no-hardcoded-metrics.mjs',
  'assert-library-slug-uniqueness.mjs',
  'assert-manifest-frontmatter-parity.mjs',
];

let failed = 0;
for (const name of scripts) {
  const file = path.join(STATIC, name);
  console.log('\n──', name, '──');
  const r = spawnSync(process.execPath, [file], { stdio: 'inherit' });
  if (r.status !== 0) failed += 1;
}

if (failed) {
  console.error(`\n✗ ${failed} static check(s) failed`);
  process.exit(1);
}
console.log('\n✓ All static checks passed');
