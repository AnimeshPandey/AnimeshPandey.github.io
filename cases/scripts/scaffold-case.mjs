#!/usr/bin/env node
/**
 * scaffold-case.mjs — turns "add a new Casebook case" from a 6-file,
 * error-prone manual assembly into one command plus content-writing.
 *
 * Subcommands:
 *   new                  Interactive: define a brand-new case (adds a
 *                        manifest.json entry AND scaffolds its directory).
 *   promote <slug>       Non-interactive: scaffold the directory for a
 *                        case that's already an `idea`-status manifest
 *                        entry (the common case — most of the 198 planned
 *                        cases already have every field decided; this
 *                        reads them as the source of truth instead of
 *                        re-prompting a human to retype the same facts).
 *   check <slug>         Scoped validation for one case: JSON validity,
 *                        manifest<->front-matter parity, boilerplate-hint
 *                        detection, and the permalink:false safety
 *                        invariant for any non-live case.
 *
 * Deliberately does not generate hint or chapter-body content via any
 * API — all content here is TODO-marked for hand-authoring, per this
 * project's standing decision that Casey's voice is written by a human,
 * not generated on the fly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import {
  slugify,
  deriveEnums,
  validateNewCaseInput,
  buildManifestEntry,
  buildIndexNjk,
  buildDataFile,
  buildCaseyJson,
} from './lib/scaffold-templates.mjs';
import { findBoilerplateSlots } from './content/lib/boilerplate.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'src/_data/manifest.json');
const CASES_DIR = path.join(ROOT, 'src/cases');

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

function recomputeStats(manifest) {
  const cases = manifest.cases;
  manifest.stats = {
    total: cases.length,
    free: cases.filter((c) => c.tier === 'free').length,
    pro: cases.filter((c) => c.tier === 'pro').length,
    flagship: cases.filter((c) => c.flagship).length,
    warStory: cases.filter((c) => c.storyType === 'war-story').length,
  };
}

function caseDir(slug) {
  return path.join(CASES_DIR, slug);
}

function writeCaseFiles(entry) {
  const dir = caseDir(entry.slug);
  if (fs.existsSync(dir)) {
    throw new Error(`${dir} already exists — refusing to overwrite`);
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.njk'), buildIndexNjk(entry));
  fs.writeFileSync(path.join(dir, 'casey.json'), buildCaseyJson(entry.slug));
  fs.writeFileSync(path.join(dir, `${entry.slug}.11tydata.js`), buildDataFile(entry.slug));
  return dir;
}

async function promptNew() {
  const manifest = loadManifest();
  const enums = deriveEnums(manifest);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const title = (await rl.question('Title: ')).trim();
    const slug = slugify(title);
    if (manifest.cases.some((c) => c.slug === slug)) {
      throw new Error(`slug "${slug}" (from title "${title}") already exists in manifest.json`);
    }

    console.log(`Tracks: ${enums.tracks.join(', ')}`);
    const track = (await rl.question('Track: ')).trim();

    const tier = ((await rl.question(`Tier (${enums.tiers.join('/')}) [free]: `)).trim() || 'free');
    const waveRaw = (await rl.question(`Wave (${enums.waves.join('/')}) [2]: `)).trim();
    const wave = waveRaw ? Number(waveRaw) : 2;
    const principle = (await rl.question('Principle (one line): ')).trim();
    const demoType = ((await rl.question(`Demo type (${enums.demoTypes.join('/')}) [toggle]: `)).trim() || 'toggle');
    const storyType = ((await rl.question(`Story type (${enums.storyTypes.join('/')}) [generic]: `)).trim() || 'generic');
    const flagshipRaw = (await rl.question('Flagship case? (y/N): ')).trim().toLowerCase();
    const flagship = flagshipRaw === 'y' || flagshipRaw === 'yes';
    const readMinRaw = (await rl.question('Read minutes [10]: ')).trim();
    const readMin = readMinRaw ? Number(readMinRaw) : 10;

    const input = { title, track, tier, wave, principle, demoType, storyType, flagship, readMin };
    const errors = validateNewCaseInput(input, enums);
    if (errors.length) {
      throw new Error('Invalid input:\n  - ' + errors.join('\n  - '));
    }

    const entry = buildManifestEntry({ slug, ...input });
    manifest.cases.push(entry);
    recomputeStats(manifest);
    saveManifest(manifest);
    const dir = writeCaseFiles(entry);

    console.log(`\n✓ Slug: ${slug}`);
    console.log(`✓ manifest.json entry appended (${manifest.cases.length} total, status: idea)`);
    console.log(`✓ ${path.relative(ROOT, dir)}/index.njk, casey.json, ${slug}.11tydata.js created`);
    console.log(`\nNext: author the chapter prose and casey.json hints (all TODO-marked), then run:`);
    console.log(`  node scripts/scaffold-case.mjs check ${slug}`);
  } finally {
    rl.close();
  }
}

function promote(slug) {
  const manifest = loadManifest();
  const entry = manifest.cases.find((c) => c.slug === slug);
  if (!entry) {
    throw new Error(`"${slug}" not found in manifest.json`);
  }
  if (entry.status === 'live') {
    throw new Error(`"${slug}" is already live — nothing to scaffold`);
  }
  const dir = writeCaseFiles(entry);
  console.log(`✓ Scaffolded ${path.relative(ROOT, dir)}/ from the existing manifest entry (status stays "${entry.status}")`);
  console.log(`  track: ${entry.track} | tier: ${entry.tier} | demoType: ${entry.demoType} | principle: ${entry.principle}`);
  console.log(`\nNext: author the chapter prose and casey.json hints (all TODO-marked), then run:`);
  console.log(`  node scripts/scaffold-case.mjs check ${slug}`);
}

function check(slug) {
  const manifest = loadManifest();
  const entry = manifest.cases.find((c) => c.slug === slug);
  if (!entry) {
    throw new Error(`"${slug}" not found in manifest.json`);
  }
  const dir = caseDir(slug);
  const indexPath = path.join(dir, 'index.njk');
  const caseyPath = path.join(dir, 'casey.json');
  const problems = [];

  if (!fs.existsSync(indexPath)) {
    problems.push(`no index.njk found at ${path.relative(ROOT, indexPath)}`);
  } else {
    const raw = fs.readFileSync(indexPath, 'utf8');
    const fmBlock = raw.match(/^---([\s\S]*?)---/);
    if (!fmBlock) {
      problems.push('front-matter block not found in index.njk');
    } else {
      const fm = fmBlock[1];
      for (const field of ['principle', 'demoType', 'flagship']) {
        const re = new RegExp(`^${field}:\\s*(.+)$`, 'm');
        const match = fm.match(re);
        const fmValue = match ? match[1].trim() : undefined;
        const manifestValue = entry[field] === undefined ? undefined : String(entry[field]);
        if (fmValue !== manifestValue) {
          problems.push(`"${field}" mismatch — manifest has ${JSON.stringify(manifestValue)}, front matter has ${JSON.stringify(fmValue)}`);
        }
      }
      // Safety invariant: any non-live case must not have a working permalink.
      if (entry.status !== 'live') {
        const permalinkMatch = fm.match(/^permalink:\s*(.+)$/m);
        const permalinkValue = permalinkMatch ? permalinkMatch[1].replace(/#.*$/, '').trim() : undefined;
        if (permalinkValue !== 'false') {
          problems.push(
            `status is "${entry.status}" but permalink is ${JSON.stringify(permalinkValue)}, not "false" — this case would be built and deployed to a real URL despite not being published. Use confirm-publish.py to flip this, never by hand.`
          );
        }
      }
    }
  }

  if (!fs.existsSync(caseyPath)) {
    problems.push(`no casey.json found at ${path.relative(ROOT, caseyPath)}`);
  } else {
    let casey;
    try {
      casey = JSON.parse(fs.readFileSync(caseyPath, 'utf8'));
    } catch (err) {
      problems.push(`casey.json is not valid JSON: ${err.message}`);
    }
    if (casey) {
      const slots = findBoilerplateSlots(casey);
      if (slots.length) {
        problems.push(
          `${slots.length} concept/fe-depth hint slot(s) still need real content: ${slots.map((s) => `${s.chapter}/${s.tone}`).join(', ')}`
        );
      }
    }
  }

  if (problems.length) {
    console.log(`✗ ${slug} — ${problems.length} issue(s):`);
    problems.forEach((p) => console.log(`  - ${p}`));
    process.exit(1);
  }
  console.log(`✓ ${slug} — manifest/front-matter parity OK, no boilerplate hint slots remain, permalink safety OK`);
}

async function main() {
  const [, , cmd, arg] = process.argv;
  try {
    if (cmd === 'new') {
      await promptNew();
    } else if (cmd === 'promote') {
      if (!arg) throw new Error('usage: scaffold-case.mjs promote <slug>');
      promote(arg);
    } else if (cmd === 'check') {
      if (!arg) throw new Error('usage: scaffold-case.mjs check <slug>');
      check(arg);
    } else {
      console.error('usage: scaffold-case.mjs <new|promote|check> [slug]');
      process.exit(2);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
