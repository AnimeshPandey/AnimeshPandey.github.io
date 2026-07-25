#!/usr/bin/env node
/**
 * assert-casey-extremities.mjs — fail if paws/tail band has mottled/static corruption.
 *
 * Healthy Casey PNGs keep solid warm-white fur on extremities. Corrupted AI exports
 * bake dark blue/black speckles into the bottom of the frame (paws, feet, tail tip).
 *
 * Pure Node.js PNG decode (mirrors assert-casey-fur.mjs).
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { inflateSync } from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CASEY_SRC = path.join(ROOT, 'cases/src/assets/casey');
const TIERS = ['junior', 'mid', 'staff'];

/** Bottom band fraction inspected for extremity corruption. */
const BAND_FROM = 0.65;
/** Fail when mottled opaque pixels / opaque pixels in band exceeds this. */
const MAX_MOTTLE_RATIO = 0.08;

const EXCLUDE_SWATCHES = [
  [45, 42, 62], // outline #2D2A3E
  [26, 26, 46], // pupil / near-outline
  [30, 30, 40],
  [20, 20, 30],
  [139, 175, 159], // junior hoodie
  [124, 168, 151], // mid hoodie / collar
  [110, 150, 135],
  [100, 140, 125],
  [90, 130, 115],
  [113, 137, 129],
  [212, 197, 176], // staff sweater
  [200, 185, 165],
  [180, 165, 145],
  [242, 196, 196], // blush / inner ear / pad-ish pink
  [240, 160, 160], // nose / pad
  [232, 213, 176], // tag
  [94, 143, 114], // tag text
  [90, 90, 110], // headphones
  [60, 60, 80],
  [139, 115, 85], // glasses
  [91, 175, 240], // iris
  [26, 111, 196], // limbus
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
    } else if (type === 'IEND') {
      break;
    }
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

function decodeRgba(file) {
  const buf = readFileSync(file);
  const { width, height, bitDepth, colorType, idatParts } = parsePng(buf);
  if (bitDepth !== 8) return null;
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : null;
  if (!channels) return null;

  const raw = inflateSync(Buffer.concat(idatParts));
  const stride = 1 + width * channels;
  const rgba = Buffer.alloc(width * height * 4);
  let prev = null;

  for (let y = 0; y < height; y++) {
    const base = y * stride;
    const filter = raw[base];
    const rowRaw = raw.slice(base + 1, base + 1 + width * channels);
    const row = reconstructRow(filter, rowRaw, prev, channels);
    prev = row;
    for (let x = 0; x < width; x++) {
      const i = x * channels;
      const o = (y * width + x) * 4;
      rgba[o] = row[i];
      rgba[o + 1] = row[i + 1];
      rgba[o + 2] = row[i + 2];
      rgba[o + 3] = channels === 4 ? row[i + 3] : 255;
    }
  }
  return { width, height, rgba };
}

function colorClose(r, g, b, ref, tol) {
  return Math.abs(r - ref[0]) <= tol && Math.abs(g - ref[1]) <= tol && Math.abs(b - ref[2]) <= tol;
}

function isExcludedFill(r, g, b) {
  for (const ref of EXCLUDE_SWATCHES) {
    if (colorClose(r, g, b, ref, 18)) return true;
  }
  return false;
}

function isDarkBlueNoise(r, g, b) {
  // Skip near-black outline strokes (low chroma, very dark)
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  if (mx < 70 && mx - mn < 35) return false;
  if (r >= 140 || g >= 140) return false;
  return b > r + 8 || mx < 55;
}

function luma(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function localVariance(rgba, width, height, x, y) {
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const o = (ny * width + nx) * 4;
      if (rgba[o + 3] < 200) continue;
      const L = luma(rgba[o], rgba[o + 1], rgba[o + 2]);
      sum += L;
      sumSq += L * L;
      n += 1;
    }
  }
  if (n < 4) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

function scoreExtremities(file) {
  const decoded = decodeRgba(file);
  if (!decoded) return null;
  const { width, height, rgba } = decoded;
  const y0 = Math.floor(height * BAND_FROM);
  let opaque = 0;
  let mottled = 0;

  for (let y = y0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const r = rgba[o];
      const g = rgba[o + 1];
      const b = rgba[o + 2];
      const a = rgba[o + 3];
      if (a < 200) continue;
      if (isExcludedFill(r, g, b)) continue;
      opaque += 1;
      // Dark/blue speckles only — local variance catches legitimate cel AA/shading
      if (isDarkBlueNoise(r, g, b)) mottled += 1;
    }
  }

  const ratio = opaque ? mottled / opaque : 0;
  return { mottled, opaque, ratio, width, height };
}

const errors = [];
const checked = [];

function checkFile(label, fullPath) {
  let result;
  try {
    result = scoreExtremities(fullPath);
  } catch (e) {
    errors.push(`${label}: parse error — ${e.message}`);
    return;
  }
  if (!result) return;
  checked.push(label);
  const { mottled, opaque, ratio } = result;
  if (opaque > 200 && ratio > MAX_MOTTLE_RATIO) {
    errors.push(
      `${label}: mottle ratio ${(ratio * 100).toFixed(1)}% (${mottled}/${opaque} in bottom ${(1 - BAND_FROM) * 100 | 0}%) — need ≤${(MAX_MOTTLE_RATIO * 100).toFixed(0)}%`
    );
  }
}

for (const tier of TIERS) {
  const tierDir = path.join(CASEY_SRC, tier);
  let files;
  try {
    files = readdirSync(tierDir).filter((f) => f.endsWith('.png'));
  } catch {
    errors.push(`Missing tier directory: ${tier}`);
    continue;
  }
  for (const file of files) {
    checkFile(`${tier}/${file}`, path.join(tierDir, file));
  }
}

const anchorDir = path.join(CASEY_SRC, 'style-anchor');
if (existsSync(anchorDir)) {
  for (const file of readdirSync(anchorDir).filter((f) => f.endsWith('.png') && f.includes('-front'))) {
    checkFile(`style-anchor/${file}`, path.join(anchorDir, file));
  }
}

if (errors.length) {
  console.error('Casey extremities check FAILED:');
  errors.forEach((e) => console.error('  ✗', e));
  process.exit(1);
}

console.log(`OK: ${checked.length} Casey PNGs passed extremities mottle check`);
