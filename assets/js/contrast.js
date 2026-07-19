/**
 * contrast.js — shared WCAG 2.1 relative-luminance / contrast-ratio math.
 *
 * Design-backlog idea #4 (theme contrast audit) needs to *compute* real
 * contrast ratios from the live CSS custom properties in theme.css, not
 * retype the hand-written ratios already sitting in that file's comments —
 * comments drift the moment someone tweaks a color and forgets to redo the
 * arithmetic. Idea #49 then wants a Playwright check that verifies the
 * audit page's on-screen numbers against an independent computation. Both
 * call this same module so there is exactly one implementation of the
 * formula to keep correct, not two that can quietly disagree.
 *
 * Plain functions, no dependencies. Works as a browser <script> (attaches
 * to window.ContrastUtils) and as a CommonJS module (`require()`d from a
 * Playwright/Node test).
 */
(function (factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.ContrastUtils = api;
  }
})(function () {
  'use strict';

  /** Parses "#rgb", "#rrggbb", "rgb(...)" or "rgba(...)" into {r,g,b,a}
   * (0-255 channels, a in 0-1). Returns null for anything else (e.g. an
   * unresolved "var(--x)" string that the caller didn't pre-resolve). */
  function parseColor(str) {
    if (!str) return null;
    str = String(str).trim();

    var hexMatch = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      var hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map(function (c) { return c + c; })
          .join('');
      }
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }

    var rgbMatch = str.match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
    );
    if (rgbMatch) {
      return {
        r: parseFloat(rgbMatch[1]),
        g: parseFloat(rgbMatch[2]),
        b: parseFloat(rgbMatch[3]),
        a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
      };
    }

    return null;
  }

  /** Flattens a translucent foreground over an opaque backdrop using the
   * standard "over" alpha-compositing formula, so a color like theme.css's
   * `--sage-bg: rgba(45,122,79,.12)` gets a real, comparable solid value
   * instead of being treated as opaque at face value. */
  function compositeOver(fg, backdrop) {
    if (!fg) return backdrop;
    if (fg.a >= 1) return fg;
    var a = fg.a;
    return {
      r: fg.r * a + backdrop.r * (1 - a),
      g: fg.g * a + backdrop.g * (1 - a),
      b: fg.b * a + backdrop.b * (1 - a),
      a: 1,
    };
  }

  function channelLuminance(c) {
    var v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  /** WCAG 2.1 relative luminance of an opaque {r,g,b} color. */
  function relativeLuminance(color) {
    return (
      0.2126 * channelLuminance(color.r) +
      0.7152 * channelLuminance(color.g) +
      0.0722 * channelLuminance(color.b)
    );
  }

  /** Real WCAG 2.1 contrast ratio between two color strings. Either may be
   * translucent (rgba); `backdropStr` (default white) is what it gets
   * composited over first — pass the actual page/surface color behind it
   * for a meaningful number, matching how the color is really rendered. */
  function contrastRatio(colorAStr, colorBStr, backdropStr) {
    var backdrop = parseColor(backdropStr) || { r: 255, g: 255, b: 255, a: 1 };
    var a = parseColor(colorAStr);
    var b = parseColor(colorBStr);
    if (!a || !b) return null;
    a = compositeOver(a, backdrop);
    b = compositeOver(b, backdrop);
    var lA = relativeLuminance(a);
    var lB = relativeLuminance(b);
    var lighter = Math.max(lA, lB);
    var darker = Math.min(lA, lB);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /** WCAG AA threshold: 3:1 for large text (18pt+/14pt+bold) or UI
   * components, 4.5:1 otherwise. */
  function passesAA(ratio, isLarge) {
    if (ratio == null) return false;
    return ratio >= (isLarge ? 3 : 4.5);
  }

  return {
    parseColor: parseColor,
    compositeOver: compositeOver,
    relativeLuminance: relativeLuminance,
    contrastRatio: contrastRatio,
    passesAA: passesAA,
  };
});
