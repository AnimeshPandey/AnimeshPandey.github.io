/**
 * demos/autocomplete-attributes.js
 * Export: initDemo(root)
 *
 * There's no scriptable browser/password-manager autofill API a public
 * page can trigger, so this simulates the decision autofill actually
 * makes: read each field's autocomplete attribute, fill it if the token
 * is present and specific, skip it (with a reported reason) if it's
 * missing or generic. Same two forms, same labels — only the attribute
 * differs between modes.
 */
import { wireToggleDemo } from './_demo-utils.js';

const SAVED = { email: 'jordan@example.com', password: 'x9!qP2vR#mK7' };

function fieldRow({ id, label, type, autocomplete }) {
  return `
    <div style="margin-bottom:10px;">
      <label for="${id}" style="font-size:12px;color:var(--casebook-ink-muted);display:block;margin-bottom:4px;">${label}</label>
      <input id="${id}" type="${type}" ${autocomplete ? `autocomplete="${autocomplete}"` : ''} style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-bg);color:var(--casebook-ink);font-size:13px;box-sizing:border-box;" />
    </div>`;
}

function buildForm({ emailAutocomplete, passwordAutocomplete }) {
  return `
    ${fieldRow({ id: 'aca-email', label: 'Email', type: 'text', autocomplete: emailAutocomplete })}
    ${fieldRow({ id: 'aca-password', label: 'Password', type: 'password', autocomplete: passwordAutocomplete })}
  `;
}

function simulateAutofill(vp, { emailAutocomplete, passwordAutocomplete }) {
  const email = vp.querySelector('#aca-email');
  const password = vp.querySelector('#aca-password');
  const results = [];

  if (emailAutocomplete === 'email') {
    email.value = SAVED.email;
    results.push('✓ Email field — recognized via autocomplete="email", filled.');
  } else {
    results.push('✗ Email field — no (or generic) autocomplete value, purpose unclear, skipped.');
  }

  if (passwordAutocomplete === 'current-password') {
    password.value = SAVED.password;
    results.push('✓ Password field — recognized via autocomplete="current-password", filled.');
  } else {
    results.push('✗ Password field — no (or generic) autocomplete value, refused to guess, skipped.');
  }

  return results;
}

function renderPanel(vp, { heading, emailAutocomplete, passwordAutocomplete, idPrefix }) {
  vp.innerHTML = `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">${heading}</p>
    ${buildForm({ emailAutocomplete, passwordAutocomplete })}
    <button id="${idPrefix}-fill" style="margin-top:4px;padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;">▶ Simulate autofill</button>
    <div id="${idPrefix}-result" style="font-size:12px;color:var(--casebook-ink-muted);margin-top:10px;min-height:34px;"></div>
  `;
  vp.querySelector(`#${idPrefix}-fill`).addEventListener('click', () => {
    const results = simulateAutofill(vp, { emailAutocomplete, passwordAutocomplete });
    vp.querySelector(`#${idPrefix}-result`).innerHTML = results.join('<br>');
  });
}

function renderBroken(vp) {
  renderPanel(vp, {
    heading: '✗ No autocomplete attribute on either field.',
    emailAutocomplete: null,
    passwordAutocomplete: null,
    idPrefix: 'aca-broken',
  });
}

function renderFixed(vp) {
  renderPanel(vp, {
    heading: '✓ autocomplete="email" and autocomplete="current-password".',
    emailAutocomplete: 'email',
    passwordAutocomplete: 'current-password',
    idPrefix: 'aca-fixed',
  });
}

export function initDemo(root) {
  wireToggleDemo(root, { renderBroken, renderFixed });
}
