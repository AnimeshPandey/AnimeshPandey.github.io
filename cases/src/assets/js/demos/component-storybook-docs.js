/**
 * demos/component-storybook-docs.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": renders a static comparison of a hand-written
 * markdown doc (frozen, references a prop that was renamed away) against
 * a simulated Storybook-style live controls panel (reflects the real,
 * current props). Both panels are static illustrative markup — no real
 * component or Storybook instance runs behind this.
 */
import { wireToggleDemo } from './_demo-utils.js';

function setupBroken(vp) {
  vp.innerHTML = `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">✗ docs/components/button.md — last edited 3 months ago, before the prop rename</p>
    <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:12px 14px;background:var(--casebook-surface-2);font-size:12.5px;line-height:1.7;">
      <strong>&lt;Button&gt;</strong>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;">
        <tr style="border-bottom:1px solid var(--casebook-border);"><td style="padding:4px 8px 4px 0;color:var(--casebook-ink-faint);">Prop</td><td style="padding:4px 0;color:var(--casebook-ink-faint);">Type</td></tr>
        <tr><td style="padding:4px 8px 4px 0;"><code>size</code></td><td style="padding:4px 0;">"small" | "large"</td></tr>
        <tr><td style="padding:4px 8px 4px 0;"><code>onClick</code></td><td style="padding:4px 0;">function</td></tr>
      </table>
      <p style="margin:10px 0 0;color:var(--casebook-ink-faint);">Usage: <code>&lt;Button size="large"&gt;Continue&lt;/Button&gt;</code></p>
    </div>
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;">Reality: size was renamed to variant 3 months ago. This prop is silently ignored — no warning, no error, the doc just lies confidently.</p>
  `;
}

function setupFixed(vp) {
  vp.innerHTML = `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">✓ Button.stories.tsx — controls generated from Button's real prop types, every render</p>
    <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:12px 14px;background:var(--casebook-surface-2);font-size:12.5px;line-height:1.7;">
      <strong>Button</strong> <span style="color:var(--casebook-ink-faint);font-size:11px;">— live controls, from Button.tsx's real props</span>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;">
        <tr style="border-bottom:1px solid var(--casebook-border);"><td style="padding:4px 8px 4px 0;color:var(--casebook-ink-faint);">Control</td><td style="padding:4px 0;color:var(--casebook-ink-faint);">Value</td></tr>
        <tr><td style="padding:4px 8px 4px 0;"><code>variant</code></td><td style="padding:4px 0;">select: primary | secondary</td></tr>
        <tr><td style="padding:4px 8px 4px 0;"><code>onClick</code></td><td style="padding:4px 0;">action logger</td></tr>
      </table>
      <p style="margin:10px 0 0;color:var(--casebook-accent);">size doesn't appear — there's no prop type to generate it from anymore.</p>
    </div>
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;">Rendered live from the real Button component, this panel can't show a prop that no longer exists.</p>
  `;
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
