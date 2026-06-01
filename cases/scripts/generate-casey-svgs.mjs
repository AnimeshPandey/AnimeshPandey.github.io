#!/usr/bin/env node
/**
 * Generate harmonized Casey SVGs (reference-inspired + MASCOT-CASEY bible).
 * v2 — tier poses aligned to user reference images.
 * Run: node scripts/generate-casey-svgs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../src/assets/casey');

const P = {
  outline: '#2D2A3E',
  fur: '#FAFAF8',
  furShadow: '#EDE8DF',
  iris: '#5BADF0',
  limbus: '#1A6FC4',
  pupil: '#1A1A2E',
  catch: '#FFFFFF',
  innerEar: '#F2C4C4',
  nose: '#F0A0A0',
  mouth: '#B07878',
  collar: '#7CA897',
  tag: '#E8D5B0',
  tagSym: '#5E8F72',
  blush: '#F2C4C4',
  whisker: '#C8BFB5',
  headphones: '#5A5A6E',
  glasses: '#8B7355',
};

const TIERS = {
  junior: {
    label: 'Junior',
    headRx: 25,
    headRy: 27,
    headCy: 36,
    eyeRx: 8.5,
    eyeRy: 9.5,
    pupilRx: 5.5,
    pupilRy: 6.5,
    catchR: 2.5,
    body: '#8BAF9F',
    bodyPath:
      'M20,70 C16,74 16,92 26,97 L74,97 C84,92 84,74 80,70 C72,62 58,60 50,60 C42,60 28,62 20,70 Z',
    armStroke: '#7A9E8E',
    sitting: true,
  },
  mid: {
    label: 'Mid',
    headRx: 22,
    headRy: 24,
    headCy: 37,
    eyeRx: 7.4,
    eyeRy: 8.4,
    pupilRx: 5,
    pupilRy: 6,
    catchR: 2.2,
    body: '#7CA897',
    bodyPath:
      'M24,68 C20,72 20,90 30,95 L70,95 C80,90 80,72 76,68 C68,60 57,58 50,58 C43,58 32,60 24,68 Z',
    armStroke: '#6B9585',
    headphones: true,
  },
  staff: {
    label: 'Staff',
    headRx: 20,
    headRy: 22,
    headCy: 37,
    eyeRx: 6.4,
    eyeRy: 7.4,
    pupilRx: 4.3,
    pupilRy: 5.3,
    catchR: 2,
    body: '#D4C5B0',
    bodyPath:
      'M26,67 C22,71 22,89 30,94 L70,94 C78,89 78,71 74,67 C67,60 58,58 50,58 C42,58 34,60 26,67 Z',
    armStroke: '#B8A894',
    glasses: true,
    peek: true,
  },
};

const POSES = [
  'idle',
  'blink',
  'perk',
  'point',
  'think',
  'celebrate',
  'sleep',
  'wave',
];

const ANCHOR_POSE = { junior: 'idle', mid: 'think', staff: 'wave' };

function collar(cx = 50) {
  return `
  <rect x="${cx - 16}" y="61" width="32" height="5" rx="2.5" fill="${P.collar}"/>
  <rect x="${cx - 3}" y="64" width="6" height="7" rx="1.5" fill="${P.tag}"/>
  <text x="${cx}" y="69.5" text-anchor="middle" font-family="monospace" font-size="3" fill="${P.tagSym}">&lt;&gt;</text>`;
}

function ears(headCy, tierKey) {
  const y = headCy - 14;
  const cock = tierKey === 'mid' ? '' : '';
  return `
  <path d="M26,${y + 2} L17,${y - 16} L39,${y - 4} Z" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M28,${y + 1} L21,${y - 10} L36,${y - 3} Z" fill="${P.innerEar}"/>
  <path d="M74,${y + 2} L83,${y - 16} L61,${y - 4} Z" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M72,${y + 1} L79,${y - 10} L64,${y - 3} Z" fill="${P.innerEar}"/>
  ${tierKey === 'mid' ? `<path d="M74,${y + 1} L78,${y - 8} L70,${y - 2} Z" fill="${P.fur}" stroke="${P.outline}" stroke-width="1"/>` : ''}
  ${cock}`;
}

function eyeMarkup(t, cx = 50, headCy = 37, open = true) {
  if (!open) {
    return `
  <path d="M${cx - 14},${headCy + 2} Q${cx - 10},${headCy + 6} ${cx - 6},${headCy + 2}" stroke="${P.outline}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M${cx + 6},${headCy + 2} Q${cx + 10},${headCy + 6} ${cx + 14},${headCy + 2}" stroke="${P.outline}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  }
  const lx = cx - 12;
  const rx = cx + 12;
  return `
  <ellipse cx="${lx}" cy="${headCy - 1}" rx="${t.eyeRx}" ry="${t.eyeRy}" fill="${P.iris}" stroke="${P.limbus}" stroke-width="0.7"/>
  <ellipse cx="${lx}" cy="${headCy}" rx="${t.pupilRx}" ry="${t.pupilRy}" fill="${P.pupil}"/>
  <circle cx="${lx + 2.5}" cy="${headCy - 4.5}" r="${t.catchR}" fill="${P.catch}"/>
  <circle cx="${lx - 1}" cy="${headCy - 2}" r="${t.catchR * 0.45}" fill="${P.catch}" opacity="0.7"/>
  <ellipse cx="${rx}" cy="${headCy - 1}" rx="${t.eyeRx}" ry="${t.eyeRy}" fill="${P.iris}" stroke="${P.limbus}" stroke-width="0.7"/>
  <ellipse cx="${rx}" cy="${headCy}" rx="${t.pupilRx}" ry="${t.pupilRy}" fill="${P.pupil}"/>
  <circle cx="${rx + 2.5}" cy="${headCy - 4.5}" r="${t.catchR}" fill="${P.catch}"/>
  <circle cx="${rx - 1}" cy="${headCy - 2}" r="${t.catchR * 0.45}" fill="${P.catch}" opacity="0.7"/>`;
}

function face(t, tierKey, cx, headCy, openEyes = true, mouthCurve = 'M44,53 Q50,58 56,53') {
  return `
  ${ears(headCy, tierKey)}
  <ellipse cx="${cx}" cy="${headCy}" rx="${t.headRx}" ry="${t.headRy}" fill="${P.fur}" stroke="${P.outline}" stroke-width="2.2" stroke-linejoin="round"/>
  <ellipse cx="${cx}" cy="${headCy + 5}" rx="${t.headRx - 8}" ry="${t.headRy - 14}" fill="${P.furShadow}" opacity="0.45"/>
  <ellipse cx="${cx - 10}" cy="${headCy + 8}" rx="4.5" ry="2.8" fill="${P.blush}" opacity="0.4"/>
  <ellipse cx="${cx + 10}" cy="${headCy + 8}" rx="4.5" ry="2.8" fill="${P.blush}" opacity="0.4"/>
  ${eyeMarkup(t, cx, headCy, openEyes)}
  <path d="M${cx - 3},${headCy + 10} L${cx} ${headCy + 14} L${cx + 3},${headCy + 10} Q${cx},${headCy + 8} ${cx - 3},${headCy + 10} Z" fill="${P.nose}"/>
  <path d="${mouthCurve}" stroke="${P.mouth}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <line x1="${cx - 23}" y1="${headCy + 11}" x2="${cx - 8}" y2="${headCy + 12}" stroke="${P.whisker}" stroke-width="0.8"/>
  <line x1="${cx - 23}" y1="${headCy + 14}" x2="${cx - 8}" y2="${headCy + 15}" stroke="${P.whisker}" stroke-width="0.8"/>
  <line x1="${cx + 8}" y1="${headCy + 12}" x2="${cx + 23}" y2="${headCy + 11}" stroke="${P.whisker}" stroke-width="0.8"/>
  <line x1="${cx + 8}" y1="${headCy + 15}" x2="${cx + 23}" y2="${headCy + 14}" stroke="${P.whisker}" stroke-width="0.8"/>`;
}

function glassesMarkup(cx, headCy) {
  return `
  <rect x="${cx - 20}" y="${headCy - 6}" width="13" height="8" rx="4" fill="none" stroke="${P.glasses}" stroke-width="1.5"/>
  <rect x="${cx + 7}" y="${headCy - 6}" width="13" height="8" rx="4" fill="none" stroke="${P.glasses}" stroke-width="1.5"/>
  <line x1="${cx - 7}" y1="${headCy - 2}" x2="${cx + 7}" y2="${headCy - 2}" stroke="${P.glasses}" stroke-width="1.3"/>
  <line x1="${cx - 28}" y1="${headCy - 2}" x2="${cx - 20}" y2="${headCy - 2}" stroke="${P.glasses}" stroke-width="1.3"/>
  <line x1="${cx + 20}" y1="${headCy - 2}" x2="${cx + 28}" y2="${headCy - 2}" stroke="${P.glasses}" stroke-width="1.3"/>`;
}

function headphonesMarkup(cx, headCy) {
  return `
  <path d="M${cx - 26},${headCy - 4} Q${cx},${headCy - 19} ${cx + 26},${headCy - 4}" fill="none" stroke="${P.headphones}" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="${cx - 26}" cy="${headCy - 2}" rx="4.5" ry="5.5" fill="${P.headphones}"/>
  <ellipse cx="${cx + 26}" cy="${headCy - 2}" rx="4.5" ry="5.5" fill="${P.headphones}"/>`;
}

function paw(x, y) {
  return `
  <ellipse cx="${x}" cy="${y}" rx="9" ry="5.5" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2"/>
  <circle cx="${x - 5}" cy="${y - 1}" r="2.4" fill="${P.furShadow}"/>
  <circle cx="${x}" cy="${y - 3}" r="2.4" fill="${P.furShadow}"/>
  <circle cx="${x + 5}" cy="${y - 1}" r="2.4" fill="${P.furShadow}"/>`;
}

function sittingPaws() {
  return `
  <ellipse cx="42" cy="93" rx="10" ry="6" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2"/>
  <ellipse cx="58" cy="93" rx="10" ry="6" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2"/>`;
}

function thinkArm(t) {
  return `
  ${paw(68, 92)}
  <path d="M26,77 C22,69 24,58 32,52" stroke="${t.armStroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="33" cy="51" rx="7" ry="6.5" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2"/>
  <line x1="33" y1="48" x2="33" y2="42" stroke="${P.outline}" stroke-width="1.8" stroke-linecap="round"/>`;
}

function peekFrame() {
  return `<line x1="4" y1="96" x2="96" y2="96" stroke="${P.outline}" stroke-width="2.8" stroke-linecap="round"/>`;
}

function poseContent(tierKey, pose) {
  const t = TIERS[tierKey];
  const cx = 50;
  const headCy = t.headCy;
  let transform = '';
  let arms = '';
  let eyesOpen = true;
  let mouth = 'M44,53 Q50,58 56,53';
  let peekLine = '';
  let peekShift = '';

  if (t.peek && pose === 'wave') {
    peekLine = peekFrame();
    peekShift = ' transform="translate(0,-6)"';
  }

  const body = `
  <ellipse cx="50" cy="97" rx="24" ry="3.5" fill="${P.outline}" opacity="0.1"/>
  ${peekLine}
  <g${peekShift}>
  <path d="${t.bodyPath}" fill="${t.body}" stroke="${P.outline}" stroke-width="2.2" stroke-linejoin="round"/>
  ${collar(cx)}`;

  const bodyClose = '</g>';

  switch (pose) {
    case 'idle':
      arms = t.sitting ? sittingPaws() : `${paw(33, 92)}${paw(67, 92)}`;
      break;
    case 'blink':
      eyesOpen = false;
      arms = t.sitting ? sittingPaws() : `${paw(33, 92)}${paw(67, 92)}`;
      break;
    case 'perk':
      arms = `${paw(33, 92)}${paw(67, 92)}`;
      transform = ' transform="translate(0,-2)"';
      break;
    case 'point':
      arms = `${paw(33, 92)}
  <path d="M72,72 C78,64 76,54 70,48" stroke="${t.armStroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="70" cy="47" rx="7.5" ry="7.5" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2"/>`;
      break;
    case 'think':
      transform = ' transform="rotate(6, 50, 38)"';
      arms = thinkArm(t);
      mouth = 'M44,54 Q50,57 56,54';
      break;
    case 'celebrate':
      if (tierKey === 'junior') transform = ' transform="translate(0,-4)"';
      arms = `${paw(33, 90)}
  <path d="M70,68 C76,58 74,46 68,40" stroke="${t.armStroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="68" cy="39" rx="7.5" ry="7.5" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2"/>`;
      mouth = 'M43,52 Q50,60 57,52';
      break;
    case 'sleep':
      eyesOpen = false;
      transform = ' transform="translate(2, 5) rotate(-10, 50, 55)"';
      arms = `<ellipse cx="50" cy="78" rx="20" ry="13" fill="${t.body}" stroke="${P.outline}" stroke-width="1.5" opacity="0.95"/>`;
      mouth = 'M46,56 Q50,54 54,56';
      break;
    case 'wave':
      if (t.peek) {
        arms = `${paw(30, 90)}
  <path d="M76,68 C82,56 79,44 72,36" stroke="${t.armStroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="72" cy="35" rx="8" ry="8" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2"/>
  <circle cx="67" cy="33" r="2.4" fill="${P.furShadow}"/>
  <circle cx="72" cy="30" r="2.4" fill="${P.furShadow}"/>
  <circle cx="77" cy="33" r="2.4" fill="${P.furShadow}"/>`;
      } else {
        arms = `${paw(33, 92)}
  <path d="M74,70 C79,59 76,48 70,41" stroke="${t.armStroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="70" cy="40" rx="7.5" ry="7.5" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2"/>
  <circle cx="65" cy="38" r="2.4" fill="${P.furShadow}"/>
  <circle cx="70" cy="35" r="2.4" fill="${P.furShadow}"/>
  <circle cx="75" cy="38" r="2.4" fill="${P.furShadow}"/>`;
      }
      mouth = 'M44,52 Q50,57 56,52';
      break;
    default:
      break;
  }

  let faceBlock = `<g${transform}>${face(t, tierKey, cx, headCy, eyesOpen, mouth)}`;
  if (t.glasses && eyesOpen) faceBlock += glassesMarkup(cx, headCy);
  if (t.headphones) faceBlock += headphonesMarkup(cx, headCy);
  faceBlock += '</g>';

  return { body: body + arms + faceBlock + bodyClose, arms: '', face: '' };
}

function buildSvg(tierKey, pose) {
  const t = TIERS[tierKey];
  const { body } = poseContent(tierKey, pose);
  const title = `${t.label} Casey, ${pose}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="${title}">
  <title>${title}</title>
  ${body}
</svg>
`;
}

function buildAnchorSvg(tierKey) {
  const pose = ANCHOR_POSE[tierKey];
  const content = poseContent(tierKey, pose);
  const t = TIERS[tierKey];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="${t.label} Casey style anchor">
  <title>${t.label} Casey — style anchor (${pose})</title>
  <g transform="scale(1.85) translate(2, 2)">
  ${content.body}
  </g>
</svg>
`;
}

function buildEmptyHub() {
  const content = poseContent('mid', 'think');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" role="img" aria-label="Casey, no results">
  <title>Casey, curious — no matches</title>
  <g transform="scale(0.78) translate(2, 4)">
  ${content.body}
  </g>
</svg>
`;
}

for (const tier of Object.keys(TIERS)) {
  const dir = path.join(ROOT, tier);
  fs.mkdirSync(dir, { recursive: true });
  for (const pose of POSES) {
    fs.writeFileSync(path.join(dir, `${pose}.svg`), buildSvg(tier, pose));
  }
  fs.writeFileSync(
    path.join(ROOT, 'style-anchor', `casey-${tier}-front.svg`),
    buildAnchorSvg(tier)
  );
}

fs.writeFileSync(path.join(ROOT, 'hub', 'casey-empty.svg'), buildEmptyHub());

const refSrc = path.join(
  __dirname,
  '../../../../ideas/projects/case-studies/assets/casey/reference'
);
const refDst = path.join(ROOT, 'style-anchor/reference');
if (fs.existsSync(refSrc)) {
  fs.mkdirSync(refDst, { recursive: true });
  for (const f of fs.readdirSync(refSrc)) {
    if (f.endsWith('.png')) fs.copyFileSync(path.join(refSrc, f), path.join(refDst, f));
  }
}

console.log('Generated', POSES.length * 3, 'pose SVGs + 3 tier anchors + casey-empty.svg');
