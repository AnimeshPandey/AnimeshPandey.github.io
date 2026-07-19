/**
 * git-dates.js — real, build-time "last modified" date for a source file,
 * read from git history rather than hand-typed.
 *
 * design-backlog idea #27 ("Real git-based case last-updated stamp"): a case
 * page's "last updated" fact should be the actual date its content file was
 * last committed, not a guess or a copy of publishedAt. This only works if
 * the build has real git history to query — a shallow (--depth=1) checkout
 * would return the checkout commit's date for every file regardless of when
 * that file actually last changed, which is worse than showing nothing.
 * static-pages.yml's checkout step sets `fetch-depth: 0` specifically so
 * this stays a real fact in CI, not a decorative one.
 */
const { execFileSync } = require('child_process');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');

/** Returns an ISO date string (YYYY-MM-DD) for the last commit touching
 * `absoluteFilePath`, or null if git is unavailable / the file has no
 * history yet (e.g. staged-but-uncommitted in local dev). Uses execFileSync
 * with an argument array (no shell) so a file path never gets interpolated
 * into a shell command string. */
function lastCommitDate(absoluteFilePath) {
  try {
    const out = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', absoluteFilePath],
      { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    if (!out) return null;
    return out.slice(0, 10);
  } catch (e) {
    return null;
  }
}

module.exports = { lastCommitDate };
