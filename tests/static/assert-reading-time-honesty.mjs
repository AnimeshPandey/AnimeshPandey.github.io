#!/usr/bin/env node
/** Delegates to casebook assert-reading-time-honesty against cases/_site */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(ROOT, 'cases/scripts/assert-reading-time-honesty.mjs');
const r = spawnSync(process.execPath, [script], { stdio: 'inherit', cwd: path.join(ROOT, 'cases') });
process.exit(r.status ?? 1);
