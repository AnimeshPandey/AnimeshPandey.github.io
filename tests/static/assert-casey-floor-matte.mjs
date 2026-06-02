#!/usr/bin/env node
/**
 * assert-casey-floor-matte.mjs — opaque white studio floor in bottom band (hub/coach poses).
 */
import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CASEY_SRC = path.join(ROOT, 'cases/src/assets/casey');
const TIERS = ['junior', 'mid', 'staff'];
const POSES = ['present.png', 'idle.png'];
const MAX_FLOOR = 100;

function parsePng(buf) {
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
    } else if (type === 'IDAT') idatParts.push(data);
    else if (type === 'IEND') break;
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

function countFloor(file) {
  const buf = readFileSync(file);
  const { width, height, bitDepth, colorType, idatParts } = parsePng(buf);
  if (bitDepth !== 8 || colorType !== 6) return null;
  const channels = 4;
  const raw = inflateSync(Buffer.concat(idatParts));
  const stride = 1 + width * channels;
  const y0 = Math.floor(height * 0.75);
  let floor = 0;
  let prev = null;
  for (let y = 0; y < height; y++) {
    const base = y * stride;
    const filter = raw[base];
    const row = reconstructRow(filter, raw.slice(base + 1, base + 1 + width * channels), prev, channels);
    prev = row;
    if (y < y0) continue;
    for (let x = 0; x < width; x++) {
      const i = x * channels;
      const r = row[i], g = row[i + 1], b = row[i + 2], a = row[i + 3];
      if (a < 200 || isWarmFur(r, g, b)) continue;
      if (r >= 248 && g >= 248 && b >= 248) floor++;
    }
  }
  return { floor };
}

const errors = [];
const checked = [];
for (const tier of TIERS) {
  for (const pose of POSES) {
    const fullPath = path.join(CASEY_SRC, tier, pose);
    let result;
    try {
      result = countFloor(fullPath);
    } catch (e) {
      errors.push(`${tier}/${pose}: ${e.message}`);
      continue;
    }
    if (!result) continue;
    checked.push(`${tier}/${pose}`);
    if (result.floor > MAX_FLOOR) {
      errors.push(`${tier}/${pose}: ${result.floor} floor pixels in bottom band (max ${MAX_FLOOR})`);
    }
  }
}

if (errors.length) {
  console.error('Casey floor matte check FAILED:');
  errors.forEach((e) => console.error('  ✗', e));
  process.exit(1);
}
console.log(`OK: ${checked.length} hub/coach PNGs passed floor matte check (≤${MAX_FLOOR} bottom-band pixels)`);
