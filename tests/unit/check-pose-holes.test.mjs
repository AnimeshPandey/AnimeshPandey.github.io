import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findEnclosedHoles, checkFile } from '../../cases/scripts/content/check-pose-holes.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CASEY = path.join(ROOT, 'cases/src/assets/casey');

/** RGBA buffer, opaque everywhere except a low-alpha rectangular hole fully inside it. */
function bufferWithEnclosedHole(width, height, hx0, hy0, hx1, hy1) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const inHole = x >= hx0 && x < hx1 && y >= hy0 && y < hy1;
      rgba[i + 3] = inHole ? 0 : 255;
    }
  }
  return rgba;
}

/** RGBA buffer with a low-alpha notch cut into one edge — connects to the border, not enclosed. */
function bufferWithEdgeNotch(width, height, nx0, ny0, nx1, ny1) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const inNotch = x >= nx0 && x < nx1 && y >= ny0 && y < ny1;
      rgba[i + 3] = inNotch ? 0 : 255;
    }
  }
  return rgba;
}

describe('findEnclosedHoles', () => {
  it('does not flag a fully opaque buffer', () => {
    const rgba = Buffer.alloc(100 * 100 * 4, 0);
    for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255;
    const result = findEnclosedHoles(rgba, 100, 100);
    assert.equal(result.flagged, false);
    assert.equal(result.holePixels, 0);
  });

  it('does not flag a fully transparent buffer (all border-reachable)', () => {
    const rgba = Buffer.alloc(100 * 100 * 4);
    const result = findEnclosedHoles(rgba, 100, 100);
    assert.equal(result.flagged, false);
  });

  it('flags a low-alpha region fully enclosed by opaque pixels', () => {
    const rgba = bufferWithEnclosedHole(100, 100, 40, 40, 60, 60);
    const result = findEnclosedHoles(rgba, 100, 100);
    assert.equal(result.flagged, true);
    assert.equal(result.holePixels, 400); // 20x20
    assert.deepEqual(result.bbox, [40, 40, 59, 59]);
  });

  it('does not flag a low-alpha notch that touches the canvas edge', () => {
    // Touches y=0, so it's reachable from the border — a real silhouette
    // edge, not an enclosed hole.
    const rgba = bufferWithEdgeNotch(100, 100, 40, 0, 60, 20);
    const result = findEnclosedHoles(rgba, 100, 100);
    assert.equal(result.flagged, false);
  });
});

describe('checkFile against real repo assets (regression baseline)', () => {
  it('no live pose PNG has enclosed alpha holes after the 2026-07-25 fix', () => {
    const tiers = ['junior', 'mid', 'staff'];
    const poses = [
      'idle', 'wave', 'point', 'celebrate', 'think', 'sleep', 'perk', 'blink',
      'curious', 'focus', 'nod', 'present', 'proud', 'read', 'support', 'welcome',
    ];
    let flaggedCount = 0;
    for (const tier of tiers) {
      for (const pose of poses) {
        const p = path.join(CASEY, tier, `${pose}.png`);
        if (checkFile(p).flagged) flaggedCount++;
      }
    }
    assert.equal(flaggedCount, 0);
  });
});
