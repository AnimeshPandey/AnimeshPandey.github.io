#!/usr/bin/env node
/**
 * generate-voice-audio.mjs — pre-generates real audio files from
 * casey.json's voice.sections using Piper (open-source neural TTS,
 * github.com/OHF-Voice/piper1-gpl, MIT), instead of relying on the
 * visitor's browser to render speechSynthesis at build/request time.
 *
 * Why: casey-voice.js's only playback path was the Web Speech API, whose
 * voice quality is entirely up to whatever TTS engine the visitor's OS
 * happens to ship — good on some platforms, a harsh robotic fallback on
 * many Windows/Linux/Chrome setups, with zero control from this project.
 * Pre-generating consistent, decent-quality audio at build time and
 * serving it as a normal static asset (this site's existing pattern for
 * everything else) fixes that inconsistency directly.
 *
 * NOT wired into CI — this is a local, one-time-per-content-change step.
 * It depends on two tools this repo doesn't (and shouldn't) install as
 * npm dependencies: the `piper` CLI (`pip install piper-tts`) and
 * `ffmpeg` (for WAV -> MP3). Both are free/open-source but are binary
 * tools, not npm packages, so this script is run by a human locally and
 * the *output* audio files are committed as static assets — same model
 * as the Casey pose PNGs.
 *
 * Setup (one-time, not part of `npm install`):
 *   pip install piper-tts
 *   brew install ffmpeg          # or your platform's equivalent
 *   Download a voice model, e.g.:
 *     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
 *     (+ the matching .onnx.json config, same URL with .json appended)
 *
 * Usage:
 *   PIPER_BIN=/path/to/piper PIPER_MODEL=/path/to/en_US-lessac-medium.onnx \
 *     node scripts/content/generate-voice-audio.mjs [--slug=<slug>] [--force]
 */
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseFlags } from '../social/lib/cli-args.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const CASES_ROOT = resolve(__dir, '../..');
const AUDIO_DIR = resolve(CASES_ROOT, 'src/assets/casey/voice');
const TONES = ['junior', 'mid', 'staff'];
const CHAPTERS = ['hook', 'concept', 'demo', 'takeaway'];

// Piper doesn't support pitch shifting via CLI flag, only speaking rate
// (length_scale is inverse of rate — smaller number, faster speech). This
// mirrors the *intent* of casey-interactions.json's voiceProfiles
// (junior faster/lighter, staff slower/measured) using the one control
// Piper actually exposes, rather than silently dropping tone variation.
const LENGTH_SCALE = { junior: 0.92, mid: 1.0, staff: 1.1 };

function run(slug, force) {
  const caseyPath = resolve(CASES_ROOT, `src/cases/${slug}/casey.json`);
  if (!existsSync(caseyPath)) {
    console.error(`  skip ${slug} — no casey.json`);
    return { generated: 0, skipped: 0 };
  }
  const casey = JSON.parse(readFileSync(caseyPath, 'utf8'));
  const outDir = resolve(AUDIO_DIR, slug);
  mkdirSync(outDir, { recursive: true });

  let generated = 0;
  let skipped = 0;
  for (const chapter of CHAPTERS) {
    const section = (casey.voice?.sections ?? []).find((s) => s.chapter === chapter);
    if (!section) continue;
    for (const tone of TONES) {
      const text = (section[tone] ?? '').trim();
      if (!text) continue;
      const outPath = resolve(outDir, `${chapter}-${tone}.mp3`);
      if (!force && existsSync(outPath)) {
        skipped++;
        continue;
      }
      const tmpWav = resolve(outDir, `${chapter}-${tone}.tmp.wav`);
      execFileSync(
        process.env.PIPER_BIN || 'piper',
        ['-m', process.env.PIPER_MODEL, '-f', tmpWav, '--length-scale', String(LENGTH_SCALE[tone])],
        { input: text, stdio: ['pipe', 'ignore', 'ignore'] }
      );
      execFileSync('ffmpeg', ['-y', '-i', tmpWav, '-codec:a', 'libmp3lame', '-b:a', '48k', outPath], {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      rmSync(tmpWav);
      generated++;
    }
  }
  return { generated, skipped };
}

function main() {
  const { flags, kv } = parseFlags(process.argv.slice(2));
  const force = flags.has('--force');
  const slug = kv.slug;

  if (!process.env.PIPER_MODEL) {
    console.error('error: PIPER_MODEL env var must point to a .onnx voice model file');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(resolve(CASES_ROOT, 'src/_data/manifest.json'), 'utf8'));
  const liveSlugs = manifest.cases.filter((c) => c.status === 'live').map((c) => c.slug);
  const targets = slug ? liveSlugs.filter((s) => s === slug) : liveSlugs;

  if (slug && targets.length === 0) {
    console.error(`error: slug "${slug}" not found among live cases`);
    process.exit(1);
  }

  let totalGenerated = 0;
  let totalSkipped = 0;
  for (const s of targets) {
    const { generated, skipped } = run(s, force);
    console.log(`${s}: ${generated} generated, ${skipped} skipped (already existed)`);
    totalGenerated += generated;
    totalSkipped += skipped;
  }
  console.log(`\nDone. ${totalGenerated} generated, ${totalSkipped} skipped across ${targets.length} case(s).`);
}

main();
