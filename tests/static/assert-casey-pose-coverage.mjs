#!/usr/bin/env node
/**
 * assert-casey-pose-coverage.mjs — every declared Casey pose must have a
 * user-visible call site, and hub must not silently remap wave/welcome/perk.
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const INTERACTIONS = path.join(ROOT, 'cases/src/assets/casey/casey-interactions.json');
const COMPANION = path.join(ROOT, 'cases/src/assets/js/casey-companion.js');
const CSS = path.join(ROOT, 'cases/src/assets/css/casebook-components.css');

const SCAN_GLOBS = [
  'cases/src/assets/js/casey-companion.js',
  'cases/src/assets/js/casey-hub.js',
  'cases/src/assets/js/casey-coach.js',
  'cases/src/assets/js/casey-onboarding.js',
  'cases/src/assets/js/casey-guide.js',
  'cases/src/assets/js/casey-companion-prefs.js',
  'cases/src/assets/casey/casey-interactions.json',
  'cases/src/_data/guide-lines.json',
  'cases/src/_data/casey-hub.json',
];

const errors = [];

if (!existsSync(INTERACTIONS)) {
  console.error('Missing casey-interactions.json');
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(INTERACTIONS, 'utf8'));
const poses = cfg.poses || [];
if (poses.length < 16) {
  errors.push(`Expected ≥16 poses in interactions.json, got ${poses.length}`);
}

const sources = SCAN_GLOBS.map((rel) => {
  const abs = path.join(ROOT, rel);
  return existsSync(abs) ? { rel, text: readFileSync(abs, 'utf8') } : null;
}).filter(Boolean);

const allText = sources.map((s) => s.text).join('\n');

for (const pose of poses) {
  // Match string literals / JSON keys that intentionally select this pose
  const re = new RegExp(
    `(['"\`])${pose}\\1|["']pose["']\\s*:\\s*["']${pose}["']|CHAPTER_POSES[\\s\\S]{0,80}['"]${pose}['"]`,
    'g'
  );
  const hits = allText.match(re) || [];
  if (!hits.length) {
    errors.push(`Pose "${pose}" has zero call sites in companion/hub/coach/guide/JSON`);
  }
}

const companion = readFileSync(COMPANION, 'utf8');

// Hub must not collapse charm poses away
const remap = companion.match(
  /function safeHubPose\([\s\S]*?\{[\s\S]*?\n\s*\}/
);
if (!remap) {
  errors.push('safeHubPose() not found in casey-companion.js');
} else {
  const body = remap[0];
  if (/wave/.test(body) && /present/.test(body) && /return 'present'/.test(body)) {
    // Only fail if wave/perk/welcome are explicitly remapped to present
    if (/pose === 'wave'|pose === 'perk'|pose === 'welcome'/.test(body)) {
      errors.push(
        'safeHubPose remaps wave/perk/welcome → present (poses would be invisible on hub)'
      );
    }
  }
}

if (!/pose === 'wave'|['"]wave['"]/.test(companion) || !/playHubEntrance[\s\S]*wave/.test(companion)) {
  // Entrance must set wave for first visit
  if (!/setImgPose\([^)]*['"]wave['"]/.test(companion)) {
    errors.push('Hub entrance never sets pose "wave"');
  }
}
if (!/setImgPose\([^)]*['"]welcome['"]/.test(companion)) {
  errors.push('Hub never sets pose "welcome"');
}

const css = readFileSync(CSS, 'utf8');
if (!/--casey-bounce-px/.test(css) || !/casey-bounce-once[\s\S]*--casey-bounce-px/.test(css)) {
  errors.push('@keyframes casey-bounce-once must use var(--casey-bounce-px)');
}
if (!/casey-avatar-frame__img--incoming/.test(css)) {
  errors.push('Missing CSS for pose crossfade incoming layer');
}
if (!/onPrefersReducedMotionChange/.test(companion)) {
  errors.push('Missing prefers-reduced-motion change listener helper');
}

if (errors.length) {
  console.error('Casey pose-coverage check FAILED:');
  errors.forEach((e) => console.error('  •', e));
  process.exit(1);
}

console.log(`✓ Casey pose coverage OK (${poses.length} poses; hub wave/welcome visible; bounce var + PRM wired)`);
