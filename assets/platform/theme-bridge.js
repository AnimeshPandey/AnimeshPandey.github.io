/**
 * theme-bridge.js — no-op stub retained for backward compatibility.
 * Casebook now uses the shared portfolio 'theme' localStorage key directly
 * (via theme.js), so no bridging is needed.
 */
(function (global) {
  global.ThemeBridge = {};
})(typeof window !== 'undefined' ? window : this);
