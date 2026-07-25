#!/usr/bin/env node
/**
 * check-pose-alpha.mjs — flags Casey pose PNGs with a matte-rectangle
 * artifact: a run of consecutive rows whose opaque-region left/right edge
 * is pixel-identical (not just similar) and wide (>=50% of canvas width).
 *
 * Organic character silhouettes vary by at least a few px per row even on
 * a smooth torso; a genuine drawn/leftover rectangle repeats the exact
 * same edge for dozens of rows straight. This is the exact signature
 * found across 45 of 48 live pose assets during the 2026-07-22 visual
 * audit — see the deferred-work plan for the full writeup.
 *
 * Complements, not duplicates, the three existing tests/static/assert-
 * casey-{fur,no-checker,floor-matte}.mjs checks — each of those fights a
 * *previous* asset-corruption incident and is color-based: fur checks for
 * too little white (opposite direction from this bug, which adds white,
 * not removes it); no-checker explicitly excludes near-white pixels via
 * its own isWarmFur() as legitimate fur, which is exactly this bug's
 * color, so it's invisible to it; floor-matte only scans the bottom 25%
 * of the canvas, while this defect sits around the head/face. This
 * script is shape-based (geometric rectangularity, not color) and scans
 * the whole canvas, which is why it catches what those three structurally
 * can't.
 *
 * Usage:
 *   node check-pose-alpha.mjs <file.png> [file2.png ...]
 *   node check-pose-alpha.mjs --json <file.png> ...   (machine-readable)
 *
 * Exit code 1 if any file is flagged, 0 otherwise — safe to wire into a
 * pre-merge check once new pose art (SVG or re-matted PNG) ships.
 */
import fs from 'node:fs';
import path from 'node:path';
import { decodePNG } from './png-alpha.mjs';

const OPAQUE_THRESHOLD = 200; // alpha value above which a pixel counts as "opaque"
const MIN_RUN_ROWS = 30; // consecutive identical-edge rows to flag as a rectangle
const MIN_SPAN_FRACTION = 0.5; // rectangle must span at least this much of the canvas width

export function findRectArtifact(rgba, width, height) {
  const edges = new Array(height);
  for (let y = 0; y < height; y++) {
    let left = -1;
    let right = -1;
    const rowBase = y * width * 4;
    for (let x = 0; x < width; x++) {
      const alpha = rgba[rowBase + x * 4 + 3];
      if (alpha > OPAQUE_THRESHOLD) {
        if (left === -1) left = x;
        right = x;
      }
    }
    edges[y] = left === -1 ? null : [left, right];
  }

  let maxRun = 0;
  let maxRunSpan = null;
  let maxRunStart = null;
  let curSpan = null;
  let curRun = 0;
  let curStart = 0;

  const flushIfWide = () => {
    if (curSpan && curSpan[1] - curSpan[0] >= width * MIN_SPAN_FRACTION && curRun > maxRun) {
      maxRun = curRun;
      maxRunSpan = curSpan;
      maxRunStart = curStart;
    }
  };

  for (let y = 0; y < height; y++) {
    const span = edges[y];
    const sameAsCur = span && curSpan && span[0] === curSpan[0] && span[1] === curSpan[1];
    if (sameAsCur) {
      curRun += 1;
    } else {
      flushIfWide();
      curSpan = span;
      curRun = 1;
      curStart = y;
    }
  }
  flushIfWide();

  return {
    flagged: maxRun >= MIN_RUN_ROWS,
    runRows: maxRun,
    span: maxRunSpan,
    startRow: maxRunStart,
  };
}

export function checkFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const { width, height, rgba } = decodePNG(buf);
  const result = findRectArtifact(rgba, width, height);
  return { file: filePath, width, height, ...result };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const files = args.filter((a) => a !== '--json');

  if (files.length === 0) {
    console.error('Usage: check-pose-alpha.mjs [--json] <file.png> [file2.png ...]');
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
          `FLAGGED  ${path.relative(process.cwd(), r.file)} — ${r.runRows}-row rectangle at x[${r.span[0]},${r.span[1]}] starting row ${r.startRow}`
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
