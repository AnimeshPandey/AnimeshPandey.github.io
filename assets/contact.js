/**
 * contact.js — Contact form handler for anmshpndy.com
 *
 * Handles:
 *   1. Client-side validation (same aria-invalid pattern as original)
 *   2. POST to Web3Forms (records submission + emails animeshpandey1909@gmail.com)
 *   3. Loading / success / error UI states
 *   4. mailto: fallback if fetch fails or JS is unavailable
 *   5. Copy-email button (moved from inline script)
 *
 * ─── SETUP ────────────────────────────────────────────────────────────────
 * 1. Sign up at https://web3forms.com and verify animeshpandey1909@gmail.com
 * 2. Copy your Access Key and replace YOUR_WEB3FORMS_ACCESS_KEY below
 * 3. In the Web3Forms dashboard enable domain restriction:
 *      anmshpndy.com · www.anmshpndy.com · animeshpandey.github.io
 *    The key is intentionally public; domain restriction is the spam guard.
 * 4. View submissions at https://web3forms.com/submissions
 * ──────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ── Config ── */
  var W3F_KEY_EMBED = 'YOUR_WEB3FORMS_ACCESS_KEY'; // CI sed replaces this string only
  var W3F_URL       = 'https://api.web3forms.com/submit';
  var FALLBACK_TO   = 'animeshpandey1909@gmail.com';
  /* Must NOT contain YOUR_WEB3FORMS_ACCESS_KEY — CI sed would break key detection */
  var UNCONFIGURED  = '__WEB3FORMS_KEY_NOT_SET__';

  function isConfiguredKey(key) {
    return !!key && key.indexOf('YOUR_WEB3FORMS') === -1 && key !== UNCONFIGURED;
  }

  function getW3fKey() {
    var meta = document.querySelector('meta[name="web3forms-access-key"]');
    var fromMeta = meta && meta.getAttribute('content');
    if (isConfiguredKey(fromMeta)) return fromMeta.trim();
    if (isConfiguredKey(W3F_KEY_EMBED)) return W3F_KEY_EMBED.trim();
    return '';
  }

  /* ── DOM refs ── */
  var form      = document.getElementById('contactForm');
  if (!form) return; // not on this page

  var nameEl    = document.getElementById('fname');
  var emailEl   = document.getElementById('femail');
  var msgEl     = document.getElementById('fmsg');
  var submitBtn = form.querySelector('.form-btn');
  var successEl = document.getElementById('formSuccess');
  var origBtnHtml = submitBtn ? submitBtn.innerHTML : '';

  /* ════════════════════════════════════════════
     VALIDATION
  ════════════════════════════════════════════ */
  function setErr(el, errId, show) {
    el.setAttribute('aria-invalid', show ? 'true' : 'false');
    var err = document.getElementById(errId);
    if (err) err.classList.toggle('visible', show);
  }

  function validate() {
    var nameOk  = nameEl.value.trim().length > 0;
    var emailOk = emailEl.validity.valid;
    var msgOk   = msgEl.value.trim().length > 0;
    setErr(nameEl,  'fname-err',  !nameOk);
    setErr(emailEl, 'femail-err', !emailOk);
    setErr(msgEl,   'fmsg-err',   !msgOk);
    if (!nameOk) { nameEl.focus(); }
    else if (!emailOk) { emailEl.focus(); }
    else if (!msgOk)   { msgEl.focus(); }
    return nameOk && emailOk && msgOk;
  }

  /* ════════════════════════════════════════════
     UI STATE HELPERS
  ════════════════════════════════════════════ */
  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
    submitBtn.innerHTML = on
      ? '<span>Sending…</span>'    // "Sending…"
      : origBtnHtml;
  }

  function showResult(msg, cls) {
    if (!successEl) return;
    successEl.className = 'form-success ' + cls;
    successEl.innerHTML = msg;
    successEl.style.display = 'block';
    successEl.focus();
  }

  /* ════════════════════════════════════════════
     MAILTO FALLBACK BUILDER
  ════════════════════════════════════════════ */
  function buildMailto(name, email, msg) {
    var subj = encodeURIComponent('Hello from ' + name);
    var body = encodeURIComponent(msg + '\n\n' + name + '\n' + email);
    return 'mailto:' + FALLBACK_TO + '?subject=' + subj + '&body=' + body;
  }

  /* ════════════════════════════════════════════
     SUBMIT HANDLER
  ════════════════════════════════════════════ */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Reset status */
    if (successEl) { successEl.style.display = 'none'; successEl.className = 'form-success'; }

    if (!validate()) return;

    /* Honeypot guard (client-side; Web3Forms also checks server-side) */
    var bot = form.querySelector('[name="botcheck"]');
    if (bot && bot.checked) return;

    var name  = nameEl.value.trim();
    var email = emailEl.value.trim();
    var msg   = msgEl.value.trim();

    setLoading(true);

    /* If key is still placeholder (local dev / misconfigured deploy):
       show an in-page message — never auto-open the email client. */
    var W3F_KEY = getW3fKey();
    if (!W3F_KEY) {
      setLoading(false);
      console.error('[contact] Web3Forms key not set. Check meta[web3forms-access-key], CI secret W3F_ACCESS_KEY, and hard-refresh (service worker may cache old contact.js).');
      showResult(
        'Form not configured. ' +
        '<a href="' + buildMailto(name, email, msg) + '" class="form-fallback-link">Email me directly →</a>',
        'is-error'
      );
      return;
    }

    fetch(W3F_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: W3F_KEY,
        name:       name,
        email:      email,
        message:    msg,
        subject:    'Portfolio contact - anmshpndy.com',
        from_name:  'Portfolio Contact Form',
        botcheck:   ''   // must be empty string for real submissions
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      setLoading(false);
      if (data.success) {
        form.reset();
        /* Clear any lingering aria-invalid states */
        [nameEl, emailEl, msgEl].forEach(function (el) {
          el.setAttribute('aria-invalid', 'false');
        });
        showResult('✓ Message sent! I’ll get back to you soon.', 'is-success');
      } else {
        var fb = buildMailto(name, email, msg);
        var detail = (data && data.message) ? ' (' + String(data.message).replace(/</g, '&lt;') + ')' : '';
        showResult(
          'Something went wrong' + detail + '. ' +
          '<a href="' + fb + '" class="form-fallback-link">Email me directly →</a>',
          'is-error'
        );
      }
    })
    .catch(function () {
      setLoading(false);
      var fb = buildMailto(name, email, msg);
      showResult(
        'Couldn’t connect. ' +
        '<a href="' + fb + '" class="form-fallback-link">Open email client →</a>',
        'is-error'
      );
    });
  });

  /* ════════════════════════════════════════════
     COPY EMAIL BUTTON
  ════════════════════════════════════════════ */
  var copyBtn = document.getElementById('copyEmailBtn');
  var toast   = document.getElementById('copyToast');
  if (copyBtn && navigator.clipboard) {
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(FALLBACK_TO).then(function () {
        if (toast) {
          toast.textContent = '✓ Email copied!';
          toast.classList.add('show');
          setTimeout(function () { toast.classList.remove('show'); }, 2200);
        }
      });
    });
  }

})();
