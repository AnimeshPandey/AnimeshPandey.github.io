import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findRectArtifact, checkFile } from '../../cases/scripts/content/check-pose-alpha.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CASEY = path.join(ROOT, 'cases/src/assets/casey');

/** Builds a synthetic RGBA buffer: opaque within a centered circle of the given radius. */
function circleBuffer(width, height, radius) {
  const rgba = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inCircle = (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
      const i = (y * width + x) * 4;
      rgba[i + 3] = inCircle ? 255 : 0;
    }
  }
  return rgba;
}

/** Builds a synthetic RGBA buffer: opaque within an axis-aligned rectangle. */
function rectBuffer(width, height, x0, y0, x1, y1) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      rgba[(y * width + x) * 4 + 3] = 255;
    }
  }
  return rgba;
}

describe('findRectArtifact', () => {
  it('does not flag a fully transparent buffer', () => {
    const rgba = Buffer.alloc(100 * 100 * 4);
    const result = findRectArtifact(rgba, 100, 100);
    assert.equal(result.flagged, false);
  });

  it('does not flag an organic circular silhouette', () => {
    const rgba = circleBuffer(200, 200, 60);
    const result = findRectArtifact(rgba, 200, 200);
    assert.equal(result.flagged, false, `expected clean, got a ${result.runRows}-row run`);
  });

  it('flags a wide rectangle held for many consecutive identical-edge rows', () => {
    const rgba = rectBuffer(200, 200, 20, 50, 180, 150); // 160px wide (80% of 200), 100 rows tall
    const result = findRectArtifact(rgba, 200, 200);
    assert.equal(result.flagged, true);
    assert.equal(result.runRows, 100);
    assert.deepEqual(result.span, [20, 179]);
    assert.equal(result.startRow, 50);
  });

  it('does not flag a narrow rectangle below the width-fraction threshold', () => {
    // Only 20% of canvas width — real character features (e.g. a narrow limb)
    // can hold a constant edge for many rows without being a matte artifact.
    const rgba = rectBuffer(200, 200, 90, 50, 130, 150);
    const result = findRectArtifact(rgba, 200, 200);
    assert.equal(result.flagged, false);
  });

  it('does not flag a rectangle held for fewer than the minimum run length', () => {
    const rgba = rectBuffer(200, 200, 20, 50, 180, 65); // wide but only 15 rows tall
    const result = findRectArtifact(rgba, 200, 200);
    assert.equal(result.flagged, false);
  });
});

describe('checkFile against real repo assets (regression baseline)', () => {
  it('flags junior/present.png with the known matte-rectangle span', () => {
    const result = checkFile(path.join(CASEY, 'junior/present.png'));
    assert.equal(result.flagged, true);
    assert.deepEqual(result.span, [56, 454]);
  });

  it('flags mid/idle.png with the known matte-rectangle span', () => {
    const result = checkFile(path.join(CASEY, 'mid/idle.png'));
    assert.equal(result.flagged, true);
    assert.deepEqual(result.span, [41, 470]);
  });

  it('does not flag the 3 files confirmed clean during the 2026-07-22 audit', () => {
    for (const rel of ['junior/idle.png', 'mid/think.png', 'staff/wave.png']) {
      const result = checkFile(path.join(CASEY, rel));
      assert.equal(result.flagged, false, `expected ${rel} to be clean, got a ${result.runRows}-row run`);
    }
  });

  it('current affected count across all 48 pose assets is 45 — update this test when art is fixed', () => {
    const tiers = ['junior', 'mid', 'staff'];
    const poses = ['idle', 'wave', 'point', 'celebrate', 'think', 'sleep', 'perk', 'blink', 'curious', 'focus', 'nod', 'present', 'proud', 'read', 'support', 'welcome'];
    let flaggedCount = 0;
    for (const tier of tiers) {
      for (const pose of poses) {
        const p = path.join(CASEY, tier, `${pose}.png`);
        if (checkFile(p).flagged) flaggedCount++;
      }
    }
    assert.equal(flaggedCount, 45);
  });
});
