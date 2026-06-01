import { wireToggleDemo } from './_demo-utils.js';

const ALL_FIELDS = ['First name','Last name','Username','Email','Password','Job title','Company','Country','Language','Newsletter'];

const CHUNKS = [
  { legend: 'Account',     fields: ['Username','Email','Password'] },
  { legend: 'Profile',     fields: ['First name','Last name','Job title','Company'] },
  { legend: 'Preferences', fields: ['Country','Language','Newsletter'] },
];

function inputEl(label) {
  const type = label === 'Email' ? 'email' : label === 'Password' ? 'password' : 'text';
  return `<div style="margin-bottom:10px;">
  <label style="display:block;font-size:12px;color:var(--casebook-ink-muted);margin-bottom:3px;">${label}</label>
  <input type="${type}" placeholder="${label}" style="width:100%;box-sizing:border-box;padding:7px 10px;border:1px solid var(--casebook-border);border-radius:6px;background:var(--casebook-surface);color:var(--casebook-ink);font-size:13px;">
</div>`;
}

export function initDemo(root) {
  function renderBroken(vp) {
    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 12px;">Single page — all ${ALL_FIELDS.length} fields at once</p>
${ALL_FIELDS.map(inputEl).join('')}
</div>`;
  }

  function renderFixed(vp) {
    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 12px;">Chunked — 3 groups of ≤4 fields</p>
${CHUNKS.map(c => `
<fieldset style="border:1px solid var(--casebook-border);border-radius:8px;padding:12px;margin-bottom:14px;">
  <legend style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--casebook-ink-faint);padding:0 6px;">${c.legend}</legend>
  ${c.fields.map(inputEl).join('')}
</fieldset>`).join('')}
</div>`;
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
