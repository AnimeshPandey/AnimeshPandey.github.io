/**
 * Zero-dependency env helpers shared by every post-to-*.mjs and *-oauth-setup.mjs
 * script. No `dotenv` package — matches the rest of the repo, which just reads
 * process.env directly (see send-newsletter.mjs).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DOTENV_PATH = resolve(__dir, '../.env');

/**
 * Optional local convenience: if scripts/social/.env exists, load KEY=VALUE
 * lines into process.env for any key not already set by the real shell
 * environment. Gitignored — never commit real credentials here. CI should
 * keep using GitHub Actions secrets, not this file.
 */
export function loadLocalEnv() {
  if (!existsSync(DOTENV_PATH)) return;
  const text = readFileSync(DOTENV_PATH, 'utf8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/**
 * Read required env vars; exits the process with a clear message listing
 * every missing var at once (rather than failing on the first one) unless
 * `dryRun` is true, in which case missing vars are just warned about.
 */
export function requireEnv(names, { dryRun = false } = {}) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length === 0) {
    return Object.fromEntries(names.map((name) => [name, process.env[name]]));
  }
  if (dryRun) {
    console.warn(`[DRY RUN] missing env vars (would fail on a real run): ${missing.join(', ')}`);
    return Object.fromEntries(names.map((name) => [name, process.env[name] ?? '']));
  }
  console.error(`error: missing required env var${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
  console.error('See scripts/social/README.md for where each one comes from.');
  process.exit(1);
}
