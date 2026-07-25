#!/usr/bin/env node
/**
 * check-pose-stray.mjs — flags Casey pose PNGs with stray opaque-ish
 * pixels outside the character's own silhouette: small isolated blobs
 * (as small as a few px, arranged in a loose grid in the files this was
 * found on) scattered across what should be a fully blank, fully
 * transparent field. Found on 2026-07-25 doing a follow-up visual sweep
 * after the matte-rectangle (check-pose-alpha.mjs) and enclosed-hole
 * (check-pose-holes.mjs) fixes — a third, independent defect from the
 * same source art. Likely origin: Casey's poses were captured over the
 * site's own decorative dot-grid background and an imperfect background
 * removal pass left individual dots behind as small "foreground" islands
 * (a regular grid, high local contrast — exactly what a saliency-based
 * matting model keeps rather than a smooth gradient it would erase).
 *
 * Detection: label all connected components of "meaningfully opaque"
 * pixels (alpha >= LOW_ALPHA_THRESHOLD, 4-connectivity). The character is
 * always the single largest component by a wide margin (tens of
 * thousands of px vs. a few hundred for the largest stray blob, per the
 * 2026-07-25 audit) — anything not in that component is stray.
 *
 * Usage:
 *   node check-pose-stray.mjs <file.png> [file2.png ...]
 *   node check-pose-stray.mjs --json <file.png> ...   (machine-readable)
 *
 * Exit code 1 if any file has stray pixels, 0 otherwise.
 */
import fs from 'node:fs';
import path from 'node:path';
import { decodePNG } from './png-alpha.mjs';

const LOW_ALPHA_THRESHOLD = 40;

export function findStrayPixels(rgba, width, height) {
  const isCandidate = (x, y) => rgba[(y * width + x) * 4 + 3] >= LOW_ALPHA_THRESHOLD;
  const labels = new Int32Array(width * height); // 0 = not a candidate, >0 = component id
  const idx = (x, y) => y * width + x;
  let nextLabel = 1;
  const componentSizes = [0]; // index 0 unused

  for (let sy = 0; sy < height; sy++) {
    for (let sx = 0; sx < width; sx++) {
      if (!isCandidate(sx, sy) || labels[idx(sx, sy)] !== 0) continue;
      const label = nextLabel++;
      componentSizes.push(0);
      const queue = [sx, sy];
      labels[idx(sx, sy)] = label;
      let head = 0;
      while (head < queue.length) {
        const x = queue[head];
        const y = queue[head + 1];
        head += 2;
        componentSizes[label]++;
        const neighbors = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (!isCandidate(nx, ny) || labels[idx(nx, ny)] !== 0) continue;
          labels[idx(nx, ny)] = label;
          queue.push(nx, ny);
        }
      }
    }
  }

  if (nextLabel === 1) {
    return { flagged: false, strayPixels: 0, bbox: null, mainComponentSize: 0 };
  }

  let mainLabel = 1;
  for (let l = 2; l < nextLabel; l++) {
    if (componentSizes[l] > componentSizes[mainLabel]) mainLabel = l;
  }

  let strayPixels = 0;
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const l = labels[idx(x, y)];
      if (l !== 0 && l !== mainLabel) {
        strayPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return {
    flagged: strayPixels > 0,
    strayPixels,
    bbox: strayPixels > 0 ? [minX, minY, maxX, maxY] : null,
    mainComponentSize: componentSizes[mainLabel],
  };
}

export function checkFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const { width, height, rgba } = decodePNG(buf);
  const result = findStrayPixels(rgba, width, height);
  return { file: filePath, width, height, ...result };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const files = args.filter((a) => a !== '--json');

  if (files.length === 0) {
    console.error('Usage: check-pose-stray.mjs [--json] <file.png> [file2.png ...]');
    process.exit(2);
  }

  const results = files.map((f) => {
    try {
      return checkFile(f);
    } catch (err) {
      return { file: f, error: err.message };
    }
  });

  const flagged = results.filter((r) => r.flagged);
  const errored = results.filter((r) => r.error);

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const r of results) {
      if (r.error) {
        console.log(`ERROR  ${path.relative(process.cwd(), r.file)} — ${r.error}`);
      } else if (r.flagged) {
        console.log(
          `FLAGGED  ${path.relative(process.cwd(), r.file)} — ${r.strayPixels} stray px outside main silhouette (${r.mainComponentSize} px), bbox x[${r.bbox[0]},${r.bbox[2]}] y[${r.bbox[1]},${r.bbox[3]}]`
        );
      } else {
        console.log(`clean    ${path.relative(process.cwd(), r.file)}`);
      }
    }
    console.log(
      `\n${flagged.length} flagged, ${errored.length} errored, ${results.length - flagged.length - errored.length} clean (of ${results.length})`
    );
  }

  process.exit(flagged.length > 0 || errored.length > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
