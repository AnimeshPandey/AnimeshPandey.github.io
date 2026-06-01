#!/usr/bin/env node
/**
 * assert-casey-matte-box.mjs — fail CI if any Casey PNG has a visible white studio card.
 *
 * After fix-casey-transparency.py runs, true neutral white (r-b=0, g-b=0, r>=248)
 * should be 0% of opaque pixels.  A fail means the interior-matte pass was skipped
 * or the is_character_pixel guard re-protected studio-white pixels.
 *
 * Pure Node.js — same PNG decoder as assert-casey-fur.mjs.
 */
import { readFileSync, readdirSync } from 'fs';
import { inflateSync } from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CASEY_SRC = path.join(ROOT, 'cases/src/assets/casey');
const TIERS = ['junior', 'mid', 'staff'];

// >1% truly-neutral opaque pixels = visible studio card
const MAX_NEUTRAL_RATIO = 0.01;

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

function countMatte(file) {
  const buf = readFileSync(file);
  const { width, height, bitDepth, colorType, idatParts } = parsePng(buf);
  if (bitDepth !== 8) return null;
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : null;
  if (!channels) return null;

  const raw = inflateSync(Buffer.concat(idatParts));
  const stride = 1 + width * channels;
  let opaque = 0;
  let neutralWhite = 0;
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
      if (a < 50) continue;
      opaque++;
      // True neutral white: r=g=b, no warmth (fur is always r-b >= 2)
      if (r >= 248 && g >= 248 && b >= 248 && (r - b) === 0 && (g - b) === 0) {
        neutralWhite++;
      }
    }
  }
  return { opaque, neutralWhite, width, height };
}

const errors = [];

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
    const fullPath = path.join(tierDir, file);
    let result;
    try {
      result = countMatte(fullPath);
    } catch (e) {
      errors.push(`${tier}/${file}: parse error — ${e.message}`);
      continue;
    }
    if (!result) continue;

    const { opaque, neutralWhite } = result;
    if (opaque === 0) continue;
    const ratio = neutralWhite / opaque;
    if (ratio > MAX_NEUTRAL_RATIO) {
      errors.push(
        `${tier}/${file}: neutral-white ratio ${(ratio * 100).toFixed(1)}% > ${MAX_NEUTRAL_RATIO * 100}% ` +
        `(${neutralWhite}/${opaque} opaque px) — studio card matte not removed`
      );
    }
  }
}

if (errors.length) {
  console.error('Casey matte-box check FAILED:');
  errors.forEach((e) => console.error('  ✗', e));
  process.exit(1);
}

const totalPngs = TIERS.reduce((n, t) => {
  try { return n + readdirSync(path.join(CASEY_SRC, t)).filter((f) => f.endsWith('.png')).length; }
  catch { return n; }
}, 0);
console.log(`OK: ${totalPngs} Casey PNGs passed matte-box check (neutral-white ≤${MAX_NEUTRAL_RATIO * 100}%) across ${TIERS.length} tiers`);
