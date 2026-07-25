#!/usr/bin/env node
/**
 * check-pose-holes.mjs — flags Casey pose PNGs with enclosed low-alpha
 * "holes": pixels that should be part of the opaque character silhouette
 * (e.g. paw fur) but are transparent or near-transparent, exposing
 * whatever sits behind the image on dark surfaces. Found on 2026-07-25
 * while visually re-checking the matte-rectangle fix — a separate,
 * previously-undetected defect from the same source art, unrelated to
 * check-pose-alpha.mjs's rectangle bug (some rectangle-clean files have
 * heavy hole counts, and vice versa).
 *
 * Detection: flood-fill from the canvas border through low-alpha pixels.
 * Anything low-alpha that is NOT reachable from the border is, by
 * construction, enclosed by opaque content — a true silhouette edge
 * always connects to the real transparent background outside the
 * character, so it's never falsely flagged; only islands fully inside
 * the character are.
 *
 * Complements check-pose-alpha.mjs (rectangular over-opaque artifact) and
 * tests/static/assert-casey-no-checker.mjs (opaque studio-gray pixel
 * count on the 4 hub/coach hero poses) — this one is under-opacity,
 * enclosed-region based, and scans every pose, not just the hero set.
 *
 * Usage:
 *   node check-pose-holes.mjs <file.png> [file2.png ...]
 *   node check-pose-holes.mjs --json <file.png> ...   (machine-readable)
 *
 * Exit code 1 if any file has hole pixels, 0 otherwise.
 */
import fs from 'node:fs';
import path from 'node:path';
import { decodePNG } from './png-alpha.mjs';

const LOW_ALPHA_THRESHOLD = 128;

export function findEnclosedHoles(rgba, width, height) {
  const isLow = (x, y) => rgba[(y * width + x) * 4 + 3] < LOW_ALPHA_THRESHOLD;
  const visited = new Uint8Array(width * height);
  const idx = (x, y) => y * width + x;
  const queue = [];

  const seed = (x, y) => {
    if (isLow(x, y) && !visited[idx(x, y)]) {
      visited[idx(x, y)] = 1;
      queue.push(x, y);
    }
  };
  for (let x = 0; x < width; x++) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seed(0, y);
    seed(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head];
    const y = queue[head + 1];
    head += 2;
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (visited[idx(nx, ny)] || !isLow(nx, ny)) continue;
      visited[idx(nx, ny)] = 1;
      queue.push(nx, ny);
    }
  }

  let holePixels = 0;
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isLow(x, y) && !visited[idx(x, y)]) {
        holePixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return {
    flagged: holePixels > 0,
    holePixels,
    bbox: holePixels > 0 ? [minX, minY, maxX, maxY] : null,
  };
}

export function checkFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const { width, height, rgba } = decodePNG(buf);
  const result = findEnclosedHoles(rgba, width, height);
  return { file: filePath, width, height, ...result };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const files = args.filter((a) => a !== '--json');

  if (files.length === 0) {
    console.error('Usage: check-pose-holes.mjs [--json] <file.png> [file2.png ...]');
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
          `FLAGGED  ${path.relative(process.cwd(), r.file)} — ${r.holePixels} enclosed hole px, bbox x[${r.bbox[0]},${r.bbox[2]}] y[${r.bbox[1]},${r.bbox[3]}]`
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
