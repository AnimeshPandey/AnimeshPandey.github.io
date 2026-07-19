/**
 * Shared CLI arg parsing for the social scripts — was duplicated ad hoc
 * across 5 files with a bug (`.split('=')` truncated any value containing
 * its own `=`, e.g. a URL query string) that got fixed in 5 different
 * places instead of once, and one of those 5 fixes regressed tolerance
 * for a flag passed without its `--` prefix. One implementation now.
 */

/**
 * Splits args into boolean flags (`--force`) and key=value flags
 * (`--tone=junior`). A `--`-prefixed arg with no `=` is a boolean flag,
 * kept exactly as written (e.g. `--force`) for `flags.has('--force')`
 * checks. Any arg containing `=` is parsed as key/value — the `--` prefix
 * is stripped if present but not required, matching this codebase's
 * original tolerant behavior. Splits only on the FIRST `=` so a value may
 * safely contain its own `=` (a query string, a base64 fragment, etc.).
 */
export function parseFlags(args) {
  const flags = new Set(args.filter((a) => a.startsWith('--') && !a.includes('=')));
  const kv = Object.fromEntries(
    args
      .filter((a) => a.includes('='))
      .map((a) => {
        const stripped = a.replace(/^--/, '');
        const eq = stripped.indexOf('=');
        return [stripped.slice(0, eq), stripped.slice(eq + 1)];
      }),
  );
  return { flags, kv };
}
