(function () {
  'use strict';

  var STORAGE_KEY = 'nitiva_cookie_consent';
  var PIXEL_ID = '164438667301853';
  var PIXEL_SRC = 'https://connect.facebook.net/en_US/fbevents.js';
  var LEAD_NAMES = { kontrola_webu: 1, kontakt: 1, objednavka: 1 };
  var firedLeads = Object.create(null);
  var pixelStarted = false;
  var pageViewSent = false;
  var banner = null;

  function isEnglish() {
    var path = location.pathname || '/';
    return path === '/en' || path.indexOf('/en/') === 0;
  }

  function readChoice() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      if (value === 'accepted' || value === 'rejected') return value;
    } catch (e) {}
    return null;
  }

  function writeChoice(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch (e) {}
  }

  function eventId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
    } catch (e) {}
    var bytes = new Uint8Array(16);
    var i;
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      window.crypto.getRandomValues(bytes);
    } else {
      for (i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = [];
    for (i = 0; i < 16; i++) hex.push((bytes[i] + 256).toString(16).slice(1));
    return hex.slice(0, 4).join('') + '-' + hex.slice(4, 6).join('') + '-' + hex.slice(6, 8).join('') + '-' + hex.slice(8, 10).join('') + '-' + hex.slice(10, 16).join('');
  }

  function expireCookie(name) {
    var host = location.hostname || '';
    var domains = ['', host];
    if (host.indexOf('.') > 0) domains.push('.' + host);
    var parts = host.split('.');
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    var seen = Object.create(null);
    domains.forEach(function (domain) {
      if (seen[domain]) return;
      seen[domain] = 1;
      document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
    });
  }

  function clearMetaCookies() {
    expireCookie('_fbp');
    expireCookie('_fbc');
  }

  function loadPixel() {
    if (readChoice() !== 'accepted' || pixelStarted) return;
    pixelStarted = true;
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      t.onload = function () {
        if (readChoice() !== 'accepted' || pageViewSent) {
          if (readChoice() !== 'accepted') {
            try { f.fbq('consent', 'revoke'); } catch (err) {}
          }
          return;
        }
        pageViewSent = true;
        f.fbq('track', 'PageView');
      };
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) s.parentNode.insertBefore(t, s);
      else (b.head || b.documentElement).appendChild(t);
    })(window, document, 'script', PIXEL_SRC);
    window.fbq.disablePushState = true;
    window.fbq('set', 'autoConfig', false, PIXEL_ID);
    window.fbq('init', PIXEL_ID);
  }

  function grantAgain() {
    if (!pixelStarted || typeof window.fbq !== 'function') return;
    try { window.fbq('consent', 'grant'); } catch (e) {}
    if (!pageViewSent && window.fbq.callMethod) {
      pageViewSent = true;
      window.fbq('track', 'PageView');
    }
  }

  function revokePixel() {
    if (typeof window.fbq === 'function') {
      try { window.fbq('consent', 'revoke'); } catch (e) {}
    }
    clearMetaCookies();
  }

  window.nitivaMetaEventId = function () {
    if (readChoice() !== 'accepted') return '';
    return eventId();
  };

  window.nitivaFireLead = function (contentName, id) {
    if (readChoice() !== 'accepted') return;
    if (!LEAD_NAMES[contentName] || !id || firedLeads[id]) return;
    firedLeads[id] = 1;
    loadPixel();
    if (typeof window.fbq !== 'function') return;
    window.fbq('track', 'Lead', { content_name: contentName }, { eventID: id });
  };

  function text() {
    if (isEnglish()) {
      return {
        label: 'Cookie consent',
        body: 'We turn on marketing cookies (Meta Pixel) only if you accept them. They measure how well our ads work. Without consent they stay off, and we do not send form details to Meta.',
        policy: 'Privacy policy',
        policyHref: '/en/privacy/',
        accept: 'Accept',
        reject: 'Reject',
        settings: 'Cookie settings',
        accepted: 'Current choice: accepted.',
        rejected: 'Current choice: rejected.'
      };
    }
    return {
      label: 'Souhlas s cookies',
      body: 'Marketingové cookies (Meta Pixel) zapneme jen když je přijmete. Slouží k měření účinnosti reklamy. Bez souhlasu se nespustí a do Meta neposíláme údaje z formulářů.',
      policy: 'Zásady ochrany osobních údajů',
      policyHref: '/ochrana-udaju/',
      accept: 'Přijmout',
      reject: 'Odmítnout',
      settings: 'Nastavení cookies',
      accepted: 'Aktuální volba: přijato.',
      rejected: 'Aktuální volba: odmítnuto.'
    };
  }

  function ensureStyle() {
    if (document.getElementById('nitiva-consent-style')) return;
    var style = document.createElement('style');
    style.id = 'nitiva-consent-style';
    style.textContent = [
      '#nitiva-consent{position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px;margin:0 auto;max-width:720px;box-sizing:border-box;background:#0E1727;color:#F7F5F0;border-radius:16px;padding:18px 18px 16px;box-shadow:0 18px 50px rgba(14,23,39,.35);font:16px/1.45 Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}',
      '#nitiva-consent[hidden]{display:none}',
      '#nitiva-consent p{margin:0 0 10px}',
      '#nitiva-consent a{color:#D9FF6F}',
      '#nitiva-consent .nitiva-consent-status{min-height:0;margin:0 0 12px;font-size:14px;color:#D9FF6F}',
      '#nitiva-consent .nitiva-consent-status:empty{display:none}',
      '#nitiva-consent .nitiva-consent-actions{display:flex;gap:10px}',
      '#nitiva-consent .nitiva-consent-btn{flex:1 1 0;min-width:0;appearance:none;border:0;cursor:pointer;background:#F7F5F0;color:#0E1727;font:inherit;font-weight:800;font-size:16px;line-height:1.2;padding:12px 16px;border-radius:12px;text-align:center}',
      '#nitiva-consent .nitiva-consent-btn:hover,#nitiva-consent .nitiva-consent-btn:focus-visible{background:#D9FF6F}',
      '#nitiva-consent .nitiva-consent-btn:focus-visible{outline:3px solid #D9FF6F;outline-offset:2px}',
      'button.nitiva-cookie-settings{appearance:none;background:transparent;border:0;padding:0;margin:0;font:inherit;font-weight:800;color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer}',
      '.nitiva-cookie-settings-row{margin:12px 0 0}',
      '@media (max-width:640px){#nitiva-consent{left:8px;right:8px;bottom:8px;padding:16px}#nitiva-consent .nitiva-consent-actions{flex-direction:column}#nitiva-consent .nitiva-consent-btn{width:100%}}'
    ].join('');
    document.head.appendChild(style);
  }

  function hideBanner() {
    if (banner) banner.hidden = true;
  }

  function showBanner(fromSettings) {
    var copy = text();
    ensureStyle();
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'nitiva-consent';
      banner.setAttribute('role', 'region');
      banner.tabIndex = -1;
      var body = document.createElement('p');
      body.id = 'nitiva-consent-text';
      body.textContent = copy.body + (isEnglish() ? ' Details: ' : ' Podrobnosti: ');
      var link = document.createElement('a');
      link.href = copy.policyHref;
      link.textContent = copy.policy;
      body.appendChild(link);
      body.appendChild(document.createTextNode('.'));
      var status = document.createElement('p');
      status.className = 'nitiva-consent-status';
      status.id = 'nitiva-consent-status';
      var actions = document.createElement('div');
      actions.className = 'nitiva-consent-actions';
      ['accepted', 'rejected'].forEach(function (choice) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'nitiva-consent-btn';
        button.setAttribute('data-choice', choice);
        button.textContent = choice === 'accepted' ? copy.accept : copy.reject;
        button.addEventListener('click', function () { choose(choice); });
        actions.appendChild(button);
      });
      banner.appendChild(body);
      banner.appendChild(status);
      banner.appendChild(actions);
      document.body.insertBefore(banner, document.body.firstChild);
    }
    banner.setAttribute('aria-label', copy.label);
    var current = readChoice();
    var statusEl = document.getElementById('nitiva-consent-status');
    statusEl.textContent = fromSettings && current === 'accepted' ? copy.accepted : fromSettings && current === 'rejected' ? copy.rejected : '';
    banner.hidden = false;
    if (fromSettings) banner.focus();
  }

  function choose(choice) {
    writeChoice(choice);
    hideBanner();
    if (choice === 'accepted') {
      grantAgain();
      loadPixel();
    } else {
      revokePixel();
    }
  }

  function bindSettings(button) {
    if (!button || button.getAttribute('data-nitiva-bound') === '1') return;
    button.setAttribute('data-nitiva-bound', '1');
    button.addEventListener('click', function (event) {
      event.preventDefault();
      showBanner(true);
    });
  }

  function ensureSettingsLink() {
    var copy = text();
    Array.prototype.forEach.call(document.querySelectorAll('.nitiva-cookie-settings'), bindSettings);
    if (document.querySelector('.nitiva-cookie-settings')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'nitiva-cookie-settings';
    button.textContent = copy.settings;
    bindSettings(button);
    var footer = document.querySelector('footer');
    var row = document.createElement('p');
    row.className = 'nitiva-cookie-settings-row';
    row.appendChild(button);
    if (footer) footer.appendChild(row);
    else document.body.appendChild(row);
  }

  function ready() {
    ensureStyle();
    ensureSettingsLink();
    if (!readChoice()) showBanner(false);
  }

  if (readChoice() === 'accepted') loadPixel();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
