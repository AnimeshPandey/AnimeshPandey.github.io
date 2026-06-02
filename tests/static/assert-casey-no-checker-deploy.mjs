#!/usr/bin/env node
/**
 * assert-casey-no-checker-deploy.mjs — checkerboard guard on shipped hub/coach poses.
 */
import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';
import path from 'path';
import { deployRoot } from './deploy-root.mjs';

const CASEY_DEPLOY = path.join(deployRoot(), 'cases/assets/casey');
const TIERS = ['junior', 'mid', 'staff'];
const POSE_SPECS = [
  { file: 'present.png', max: 900 },
  { file: 'welcome.png', max: 4500 },
  { file: 'idle.png', max: 6500 },
  { file: 'nod.png', max: 5000 },
];

function parsePng(buf) {
  const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== SIG[i]) throw new Error('Invalid PNG signature');
  }
  let offset = 8;
  let width, height, bitDepth, colorType;
  const idatParts = [];
  while (offset < buf.length - 4) {
    const len = buf.readUInt32BE(offset);
    const type = buf.slice(offset + 4, offset + 8).toString('ascii');
    const data = buf.slice(offset + 8, offset + 8 + len);
    offset += 12 + len;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') break;
  }
  return { width, height, bitDepth, colorType, idatParts };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function reconstructRow(filter, raw, prev, channels) {
  const len = raw.length;
  const out = Buffer.alloc(len);
  const L = (i) => (i >= channels ? out[i - channels] : 0);
  const U = (i) => (prev ? prev[i] : 0);
  const LU = (i) => (prev && i >= channels ? prev[i - channels] : 0);
  for (let i = 0; i < len; i++) {
    const x = raw[i];
    switch (filter) {
      case 0: out[i] = x; break;
      case 1: out[i] = (x + L(i)) & 0xff; break;
      case 2: out[i] = (x + U(i)) & 0xff; break;
      case 3: out[i] = (x + ((L(i) + U(i)) >> 1)) & 0xff; break;
      case 4: out[i] = (x + paeth(L(i), U(i), LU(i))) & 0xff; break;
      default: out[i] = x;
    }
  }
  return out;
}

function isWarmFur(r, g, b) {
  return r >= 244 && g >= 244 && b >= 238 && Math.abs(r - g) <= 6;
}

function isCheckerOpaque(r, g, b, a) {
  if (a < 200) return false;
  if (isWarmFur(r, g, b)) return false;
  return Math.abs(r - g) <= 6 && Math.abs(g - b) <= 6 && r >= 180 && r <= 238;
}

function countChecker(file) {
  const buf = readFileSync(file);
  const { width, height, bitDepth, colorType, idatParts } = parsePng(buf);
  if (bitDepth !== 8) return null;
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : null;
  if (!channels) return null;

  const raw = inflateSync(Buffer.concat(idatParts));
  const stride = 1 + width * channels;
  let checker = 0;
  let prev = null;

  for (let y = 0; y < height; y++) {
    const base = y * stride;
    const filter = raw[base];
    const rowRaw = raw.slice(base + 1, base + 1 + width * channels);
    const row = reconstructRow(filter, rowRaw, prev, channels);
    prev = row;

    for (let x = 0; x < width; x++) {
      const i = x * channels;
      const r = row[i], g = row[i + 1], b = row[i + 2];
      const a = channels === 4 ? row[i + 3] : 255;
      if (isCheckerOpaque(r, g, b, a)) checker++;
    }
  }
  return { checker };
}

const errors = [];
const checked = [];

for (const tier of TIERS) {
  for (const { file, max } of POSE_SPECS) {
    const fullPath = path.join(CASEY_DEPLOY, tier, file);
    let result;
    try {
      result = countChecker(fullPath);
    } catch (e) {
      errors.push(`deployed ${tier}/${file}: ${e.message}`);
      continue;
    }
    if (!result) continue;
    checked.push(`${tier}/${file}`);
    if (result.checker > max) {
      errors.push(`deployed ${tier}/${file}: ${result.checker} opaque checker pixels (max ${max})`);
    }
  }
}

if (errors.length) {
  console.error('Deployed Casey checkerboard check FAILED:');
  errors.forEach((e) => console.error('  ✗', e));
  process.exit(1);
}

console.log(`OK: ${checked.length} deployed Casey PNGs passed checkerboard matrix check`);
