/**
 * Permanently (and repeatedly) exclude a build/test-output dir from iCloud
 * Drive sync. On a machine where this repo lives under ~/Documents (an
 * iCloud Desktop & Documents synced folder), rapid rebuild/rerun cycles
 * delete-and-recreate these churny output dirs — so a one-time xattr
 * doesn't stick, it has to be re-applied after every build/test run, or the
 * sync daemon races the next rewrite and leaves "conflict copy N" junk
 * files behind.
 *
 * Best-effort only: no-op on non-macOS, and failures (missing `xattr`
 * binary, path already escaped to somewhere unsynced like /tmp via
 * DEPLOY_DIR/ELEVENTY_OUTPUT_DIR) are swallowed — this is pure hygiene,
 * never load-bearing for the build or test run itself.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';

export function excludeFromICloudSync(dir) {
  if (process.platform !== 'darwin' || !fs.existsSync(dir)) return;
  try {
    spawnSync('xattr', ['-w', 'com.apple.fileprovider.ignore#P', '1', dir], { stdio: 'ignore' });
  } catch {
    /* best-effort */
  }
}
