import { wireToggleDemo } from './_demo-utils.js';

const GROUPS = [
  { legend: 'Personal', fields: [['First name','text'],['Last name','text']] },
  { legend: 'Contact',  fields: [['Email','email'],['Phone','tel']] },
];

function formHTML(labelGap, groupGap) {
  return GROUPS.map(g => `
<fieldset style="border:none;padding:0;margin:0 0 ${groupGap}px;">
  <legend style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--casebook-ink-faint);margin-bottom:${labelGap}px;">${g.legend}</legend>
  ${g.fields.map(([label, type]) => `
  <div style="margin-bottom:${labelGap}px;">
    <label style="display:block;font-size:12px;color:var(--casebook-ink-muted);margin-bottom:${labelGap === 16 ? '16' : '4'}px;">${label}</label>
    <input type="${type}" placeholder="${label}" style="width:100%;box-sizing:border-box;padding:7px 10px;border:1px solid var(--casebook-border);border-radius:6px;background:var(--casebook-surface);color:var(--casebook-ink);font-size:13px;">
  </div>`).join('')}
</fieldset>`).join('');
}

export function initDemo(root) {
  function renderBroken(vp) {
    vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">Equal spacing — 16px everywhere. Which label belongs to which field?</p>
${formHTML(16, 16)}
</div>`;
  }

  function renderFixed(vp) {
    vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">Ratio spacing — 4px label↔field, 24px between groups. Grouping is obvious.</p>
${formHTML(4, 24)}
</div>`;
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
