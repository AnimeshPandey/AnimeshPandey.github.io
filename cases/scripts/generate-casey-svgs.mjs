#!/usr/bin/env node
/**
 * Generate harmonized Casey SVGs (reference-inspired + MASCOT-CASEY bible).
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
    headRx: 24,
    headRy: 26,
    headCy: 37,
    eyeRx: 7.8,
    eyeRy: 8.8,
    pupilRx: 5.2,
    pupilRy: 6.2,
    catchR: 2.3,
    body: '#8BAF9F',
    bodyPath:
      'M22,69 C18,73 18,91 28,96 L72,96 C82,91 82,73 78,69 C70,61 58,59 50,59 C42,59 30,61 22,69 Z',
    armStroke: '#7A9E8E',
  },
  mid: {
    label: 'Mid',
    headRx: 22,
    headRy: 24,
    headCy: 37,
    eyeRx: 7.2,
    eyeRy: 8.2,
    pupilRx: 4.8,
    pupilRy: 5.8,
    catchR: 2.1,
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
    eyeRx: 6.2,
    eyeRy: 7.2,
    pupilRx: 4.2,
    pupilRy: 5.2,
    catchR: 1.9,
    body: '#D4C5B0',
    bodyPath:
      'M26,67 C22,71 22,89 30,94 L70,94 C78,89 78,71 74,67 C67,60 58,58 50,58 C42,58 34,60 26,67 Z',
    armStroke: '#B8A894',
    glasses: true,
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

function collar(cx = 50) {
  return `
  <rect x="${cx - 16}" y="61" width="32" height="5" rx="2.5" fill="${P.collar}"/>
  <rect x="${cx - 3}" y="64" width="6" height="7" rx="1.5" fill="${P.tag}"/>
  <text x="${cx}" y="69.5" text-anchor="middle" font-family="monospace" font-size="3" fill="${P.tagSym}">&lt;&gt;</text>`;
}

function ears(headCy) {
  const y = headCy - 14;
  return `
  <path d="M26,${y + 2} L17,${y - 16} L39,${y - 4} Z" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M28,${y + 1} L21,${y - 10} L36,${y - 3} Z" fill="${P.innerEar}"/>
  <path d="M74,${y + 2} L83,${y - 16} L61,${y - 4} Z" fill="${P.fur}" stroke="${P.outline}" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M72,${y + 1} L79,${y - 10} L64,${y - 3} Z" fill="${P.innerEar}"/>`;
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
  <ellipse cx="${lx}" cy="${headCy - 1}" rx="${t.eyeRx}" ry="${t.eyeRy}" fill="${P.iris}" stroke="${P.limbus}" stroke-width="0.6"/>
  <ellipse cx="${lx}" cy="${headCy}" rx="${t.pupilRx}" ry="${t.pupilRy}" fill="${P.pupil}"/>
  <circle cx="${lx + 2}" cy="${headCy - 4}" r="${t.catchR}" fill="${P.catch}"/>
  <ellipse cx="${rx}" cy="${headCy - 1}" rx="${t.eyeRx}" ry="${t.eyeRy}" fill="${P.iris}" stroke="${P.limbus}" stroke-width="0.6"/>
  <ellipse cx="${rx}" cy="${headCy}" rx="${t.pupilRx}" ry="${t.pupilRy}" fill="${P.pupil}"/>
  <circle cx="${rx + 2}" cy="${headCy - 4}" r="${t.catchR}" fill="${P.catch}"/>`;
}

function face(t, cx, headCy, openEyes = true, mouthCurve = 'M44,53 Q50,58 56,53') {
  return `
  ${ears(headCy)}
  <ellipse cx="${cx}" cy="${headCy}" rx="${t.headRx}" ry="${t.headRy}" fill="${P.fur}" stroke="${P.outline}" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="${cx}" cy="${headCy + 5}" rx="${t.headRx - 8}" ry="${t.headRy - 14}" fill="${P.furShadow}" opacity="0.4"/>
  <ellipse cx="${cx - 10}" cy="${headCy + 8}" rx="4" ry="2.5" fill="${P.blush}" opacity="0.35"/>
  <ellipse cx="${cx + 10}" cy="${headCy + 8}" rx="4" ry="2.5" fill="${P.blush}" opacity="0.35"/>
  ${eyeMarkup(t, cx, headCy, openEyes)}
  <path d="M${cx - 3},${headCy + 10} L${cx} ${headCy + 14} L${cx + 3},${headCy + 10} Q${cx},${headCy + 8} ${cx - 3},${headCy + 10} Z" fill="${P.nose}"/>
  <path d="${mouthCurve}" stroke="${P.mouth}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="${cx - 23}" y1="${headCy + 11}" x2="${cx - 8}" y2="${headCy + 12}" stroke="${P.whisker}" stroke-width="0.8"/>
  <line x1="${cx - 23}" y1="${headCy + 14}" x2="${cx - 8}" y2="${headCy + 15}" stroke="${P.whisker}" stroke-width="0.8"/>
  <line x1="${cx + 8}" y1="${headCy + 12}" x2="${cx + 23}" y2="${headCy + 11}" stroke="${P.whisker}" stroke-width="0.8"/>
  <line x1="${cx + 8}" y1="${headCy + 15}" x2="${cx + 23}" y2="${headCy + 14}" stroke="${P.whisker}" stroke-width="0.8"/>`;
}

function glassesMarkup(cx, headCy) {
  return `
  <rect x="${cx - 20}" y="${headCy - 6}" width="13" height="8" rx="4" fill="none" stroke="${P.glasses}" stroke-width="1.4"/>
  <rect x="${cx + 7}" y="${headCy - 6}" width="13" height="8" rx="4" fill="none" stroke="${P.glasses}" stroke-width="1.4"/>
  <line x1="${cx - 7}" y1="${headCy - 2}" x2="${cx + 7}" y2="${headCy - 2}" stroke="${P.glasses}" stroke-width="1.2"/>
  <line x1="${cx - 28}" y1="${headCy - 2}" x2="${cx - 20}" y2="${headCy - 2}" stroke="${P.glasses}" stroke-width="1.2"/>
  <line x1="${cx + 20}" y1="${headCy - 2}" x2="${cx + 28}" y2="${headCy - 2}" stroke="${P.glasses}" stroke-width="1.2"/>`;
}

function headphonesMarkup(cx, headCy) {
  return `
  <path d="M${cx - 26},${headCy - 4} Q${cx},${headCy - 18} ${cx + 26},${headCy - 4}" fill="none" stroke="${P.headphones}" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="${cx - 26}" cy="${headCy - 2}" rx="4" ry="5" fill="${P.headphones}"/>
  <ellipse cx="${cx + 26}" cy="${headCy - 2}" rx="4" ry="5" fill="${P.headphones}"/>`;
}

function paw(x, y) {
  return `
  <ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="${P.fur}" stroke="${P.outline}" stroke-width="1"/>
  <circle cx="${x - 5}" cy="${y - 1}" r="2.3" fill="${P.furShadow}"/>
  <circle cx="${x}" cy="${y - 3}" r="2.3" fill="${P.furShadow}"/>
  <circle cx="${x + 5}" cy="${y - 1}" r="2.3" fill="${P.furShadow}"/>`;
}

function poseContent(tierKey, pose) {
  const t = TIERS[tierKey];
  const cx = 50;
  const headCy = t.headCy;
  let extra = '';
  let transform = '';
  let arms = '';
  let eyesOpen = true;
  let mouth = 'M44,53 Q50,58 56,53';

  const body = `
  <ellipse cx="50" cy="97" rx="22" ry="3" fill="${P.outline}" opacity="0.12"/>
  <path d="${t.bodyPath}" fill="${t.body}" stroke="${P.outline}" stroke-width="2" stroke-linejoin="round"/>
  ${collar(cx)}`;

  switch (pose) {
    case 'idle':
      arms = `${paw(33, 92)}${paw(67, 92)}`;
      break;
    case 'blink':
      eyesOpen = false;
      arms = `${paw(33, 92)}${paw(67, 92)}`;
      break;
    case 'perk':
      extra = `<path d="M24,${headCy - 20} L22,${headCy - 32} L30,${headCy - 22} Z" fill="${P.fur}" stroke="${P.outline}" stroke-width="1"/>`;
      arms = `${paw(33, 92)}${paw(67, 92)}`;
      break;
    case 'point':
      arms = `${paw(33, 92)}
  <path d="M72,72 C78,64 76,54 70,48" stroke="${t.armStroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="70" cy="47" rx="7" ry="7" fill="${P.fur}" stroke="${P.outline}" stroke-width="1"/>`;
      break;
    case 'think':
      transform = ' transform="rotate(5, 50, 38)"';
      arms = `${paw(67, 92)}
  <path d="M28,76 C24,68 26,58 34,52" stroke="${t.armStroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="35" cy="51" rx="7" ry="6" fill="${P.fur}" stroke="${P.outline}" stroke-width="1"/>`;
      mouth = 'M44,54 Q50,57 56,54';
      break;
    case 'celebrate':
      if (tierKey === 'junior') transform = ' transform="translate(0,-3)"';
      arms = `${paw(33, 90)}
  <path d="M70,68 C76,58 74,46 68,40" stroke="${t.armStroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="68" cy="39" rx="7" ry="7" fill="${P.fur}" stroke="${P.outline}" stroke-width="1"/>`;
      mouth = 'M43,52 Q50,60 57,52';
      break;
    case 'sleep':
      eyesOpen = false;
      transform = ' transform="translate(2, 4) rotate(-8, 50, 55)"';
      arms = `<ellipse cx="50" cy="78" rx="18" ry="12" fill="${t.body}" stroke="${P.outline}" stroke-width="1.5" opacity="0.9"/>`;
      mouth = 'M46,56 Q50,54 54,56';
      break;
    case 'wave':
      arms = `${paw(33, 92)}
  <path d="M74,70 C79,59 76,48 70,41" stroke="${t.armStroke}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="70" cy="40" rx="7" ry="7" fill="${P.fur}" stroke="${P.outline}" stroke-width="1"/>
  <circle cx="65" cy="38" r="2.3" fill="${P.furShadow}"/>
  <circle cx="70" cy="35" r="2.3" fill="${P.furShadow}"/>
  <circle cx="75" cy="38" r="2.3" fill="${P.furShadow}"/>`;
      break;
    default:
      break;
  }

  let faceBlock = `<g${transform}>${face(t, cx, headCy, eyesOpen, mouth)}`;
  if (t.glasses && eyesOpen) faceBlock += glassesMarkup(cx, headCy);
  if (t.headphones) faceBlock += headphonesMarkup(cx, headCy);
  faceBlock += '</g>';

  return { body, arms, face: faceBlock, eyesOpen };
}

function buildSvg(tierKey, pose) {
  const t = TIERS[tierKey];
  const { body, arms, face: faceG } = poseContent(tierKey, pose);
  const title = `${t.label} Casey, ${pose}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="${title}">
  <title>${title}</title>
  ${body}
  ${arms}
  ${faceG}
</svg>
`;
}

function buildAnchorSvg(tierKey) {
  const content = poseContent(tierKey, 'idle');
  const t = TIERS[tierKey];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="${t.label} Casey style anchor">
  <title>${t.label} Casey — style anchor (front)</title>
  <g transform="scale(1.85) translate(2, 2)">
  ${content.body}
  ${content.arms}
  ${content.face}
  </g>
</svg>
`;
}

function buildEmptyHub() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" role="img" aria-label="Casey, no results">
  <title>Casey, curious — no matches</title>
  <g transform="scale(0.78) translate(2, 4)">
  ${poseContent('mid', 'think').body}
  ${poseContent('mid', 'think').arms}
  ${poseContent('mid', 'think').face}
  </g>
</svg>
`;
}

// Main
for (const tier of Object.keys(TIERS)) {
  const dir = path.join(ROOT, tier);
  fs.mkdirSync(dir, { recursive: true });
  for (const pose of POSES) {
    const out = path.join(dir, `${pose}.svg`);
    fs.writeFileSync(out, buildSvg(tier, pose));
  }
  fs.writeFileSync(
    path.join(ROOT, 'style-anchor', `casey-${tier}-front.svg`),
    buildAnchorSvg(tier)
  );
}

fs.writeFileSync(path.join(ROOT, 'hub', 'casey-empty.svg'), buildEmptyHub());

// Copy reference PNGs into portfolio for img2img workflows
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

console.log('Generated', POSES.length * 3, 'pose SVGs + 3 style-anchor SVGs + casey-empty.svg');
