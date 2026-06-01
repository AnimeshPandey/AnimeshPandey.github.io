#!/usr/bin/env node
/** Track-themed SVG illustrations for case ui-strip chapters. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/assets/case-illustrations');

const TRACKS = {
  accessibility: { label: 'Accessibility', accent: '#5E8F72', icon: 'focus' },
  performance: { label: 'Performance', accent: '#5BADF0', icon: 'vitals' },
  react: { label: 'React', accent: '#61DAFB', icon: 'react' },
  javascript: { label: 'JavaScript', accent: '#F7DF1E', icon: 'js' },
  networking: { label: 'Networking', accent: '#E8A838', icon: 'net' },
  'state-architecture': { label: 'State', accent: '#9B7EDE', icon: 'state' },
  'css-layout': { label: 'CSS layout', accent: '#E34F26', icon: 'css' },
  'ai-agents': { label: 'AI agents', accent: '#7CA897', icon: 'ai' },
  psychology: { label: 'UX psychology', accent: '#5E8F72', icon: 'psych' },
  patterns: { label: 'Patterns', accent: '#5E8F72', icon: 'patterns' },
  motion: { label: 'Motion', accent: '#9B7EDE', icon: 'motion' },
  tooling: { label: 'Tooling', accent: '#94A3B8', icon: 'tool' },
  'agent-ui': { label: 'Agent UI', accent: '#7CA897', icon: 'ai' },
};

function svg(track, meta) {
  const a = meta.accent;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 200" role="img" aria-label="${meta.label} pattern illustration">
  <rect width="640" height="200" rx="12" fill="#0f1412"/>
  <rect x="24" y="24" width="592" height="152" rx="8" fill="#1a221e" stroke="${a}" stroke-width="1" stroke-opacity="0.35"/>
  <text x="40" y="52" fill="${a}" font-family="ui-monospace, monospace" font-size="11" letter-spacing="0.08em">${meta.label.toUpperCase()}</text>
  <rect x="40" y="72" width="200" height="12" rx="6" fill="${a}" opacity="0.25"/>
  <rect x="40" y="94" width="320" height="8" rx="4" fill="#FAFAF8" opacity="0.12"/>
  <rect x="40" y="110" width="280" height="8" rx="4" fill="#FAFAF8" opacity="0.08"/>
  <circle cx="520" cy="120" r="36" fill="${a}" opacity="0.15"/>
  <circle cx="520" cy="120" r="20" fill="${a}" opacity="0.35"/>
  <text x="40" y="168" fill="#9BB5A8" font-family="system-ui, sans-serif" font-size="13">Synthetic UI mock — Casebook illustration</text>
</svg>`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const [track, meta] of Object.entries(TRACKS)) {
  const file = path.join(OUT, `${track}.svg`);
  fs.writeFileSync(file, svg(track, meta));
  console.log(file);
}
// alias
const alias = {
  'state-arch': 'state-architecture',
  'psychology-perception': 'psychology',
  'accessibility-motion': 'accessibility',
};
for (const [from, to] of Object.entries(alias)) {
  fs.copyFileSync(path.join(OUT, `${to}.svg`), path.join(OUT, `${from}.svg`));
}
