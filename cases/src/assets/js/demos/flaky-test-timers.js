/**
 * demos/flaky-test-timers.js
 * Export: initDemo(root, { demoType })
 * demoType "code-only": the broken/fixed comparison is static markup in the
 * case's index.njk (a <pre><code> block), not an interactive toggle — this
 * module only needs to exist so demo-loader.js's dynamic import succeeds and
 * reveals the (already-complete) static content.
 */
export function initDemo() {
  // No interactive state for a code-only demo — the comparison is static.
}
