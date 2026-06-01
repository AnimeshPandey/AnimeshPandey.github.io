#!/usr/bin/env node
/**
 * Build portfolio + casebook and stage merged _deploy/ (mirrors CI static-pages.yml).
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEPLOY = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '_deploy');

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log('→ Syncing live slug fixture…');
run('node', ['scripts/sync-live-slugs.mjs'], path.join(ROOT, 'tests'));

console.log('→ Installing casebook dependencies…');
run('npm', ['install'], path.join(ROOT, 'cases'));

console.log('→ Building casebook…');
run('npm', ['run', 'build'], path.join(ROOT, 'cases'));

console.log('→ Installing portfolio site dependencies…');
run('npm', ['install'], path.join(ROOT, 'site'));

console.log('→ Building portfolio site…');
run('npm', ['run', 'build'], path.join(ROOT, 'site'));

console.log('→ Staging _deploy…');
rmrf(DEPLOY);
fs.mkdirSync(DEPLOY, { recursive: true });
copyDir(path.join(ROOT, 'site', '_site'), DEPLOY);
fs.mkdirSync(path.join(DEPLOY, 'cases'), { recursive: true });
copyDir(path.join(ROOT, 'cases', '_site'), path.join(DEPLOY, 'cases'));

const headers = path.join(ROOT, '_headers');
if (fs.existsSync(headers)) fs.copyFileSync(headers, path.join(DEPLOY, '_headers'));

const swRoot = path.join(ROOT, 'sw.js');
if (fs.existsSync(swRoot)) fs.copyFileSync(swRoot, path.join(DEPLOY, 'sw.js'));

const buildId = process.env.GITHUB_SHA?.slice(0, 7) || 'localdev';
console.log('→ Stamping build id:', buildId);
const stampExt = new Set(['.html', '.js']);
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (stampExt.has(path.extname(ent.name))) {
      let txt = fs.readFileSync(p, 'utf8');
      if (txt.includes('__AP_BUILD_ID__')) {
        fs.writeFileSync(p, txt.replaceAll('__AP_BUILD_ID__', buildId));
      }
    }
  }
}
walk(DEPLOY);

const count = walkCount(DEPLOY);
console.log(`✓ Staged ${count} files in ${DEPLOY}`);

function walkCount(dir) {
  let n = 0;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) n += walkCount(p);
    else n += 1;
  }
  return n;
}
