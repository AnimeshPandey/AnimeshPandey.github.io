import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findStrayPixels, checkFile } from '../../cases/scripts/content/check-pose-stray.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CASEY = path.join(ROOT, 'cases/src/assets/casey');

function blankBuffer(width, height) {
  return Buffer.alloc(width * height * 4);
}

function fillRect(rgba, width, x0, y0, x1, y1, alpha = 255) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      rgba[(y * width + x) * 4 + 3] = alpha;
    }
  }
}

describe('findStrayPixels', () => {
  it('does not flag a fully transparent buffer', () => {
    const rgba = blankBuffer(100, 100);
    const result = findStrayPixels(rgba, 100, 100);
    assert.equal(result.flagged, false);
    assert.equal(result.strayPixels, 0);
  });

  it('does not flag a single solid blob with no other components', () => {
    const rgba = blankBuffer(100, 100);
    fillRect(rgba, 100, 30, 30, 70, 70);
    const result = findStrayPixels(rgba, 100, 100);
    assert.equal(result.flagged, false);
    assert.equal(result.mainComponentSize, 1600);
  });

  it('flags small isolated blobs separate from the main silhouette', () => {
    const rgba = blankBuffer(100, 100);
    fillRect(rgba, 100, 30, 30, 70, 70); // 40x40 = 1600px "character"
    fillRect(rgba, 100, 5, 5, 10, 10); // 5x5 = 25px stray dot, far from character
    fillRect(rgba, 100, 90, 90, 95, 95); // another 5x5 stray dot
    const result = findStrayPixels(rgba, 100, 100);
    assert.equal(result.flagged, true);
    assert.equal(result.strayPixels, 50);
    assert.equal(result.mainComponentSize, 1600);
  });

  it('treats the larger of two disconnected blobs as the character', () => {
    const rgba = blankBuffer(100, 100);
    fillRect(rgba, 100, 0, 0, 20, 20); // 400px
    fillRect(rgba, 100, 50, 50, 90, 90); // 1600px — larger, should be "main"
    const result = findStrayPixels(rgba, 100, 100);
    assert.equal(result.flagged, true);
    assert.equal(result.mainComponentSize, 1600);
    assert.equal(result.strayPixels, 400);
  });
});

describe('checkFile against real repo assets (regression baseline)', () => {
  it('no live pose PNG has stray pixels outside the main silhouette after the 2026-07-25 fix', () => {
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
