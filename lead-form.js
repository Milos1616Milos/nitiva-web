(function (root) {
  'use strict';

  // Empty string hides every WhatsApp button. wa.me digits only, no plus or spaces.
  var WHATSAPP_NUMBER = '420736284023';
  var WHATSAPP_TEXT = 'Dobrý den, mám zájem o nezávaznou konzultaci.';
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function clean(value, max) {
    var text = String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, '').trim().replace(/\s+/g, ' ');
    if (max && text.length > max) text = text.slice(0, max);
    return text;
  }

  function whatsappUrl(number) {
    var n = arguments.length ? number : WHATSAPP_NUMBER;
    if (!n) return '';
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(WHATSAPP_TEXT);
  }

  function parseContact(value) {
    var contact = clean(value, 120);
    if (!contact) return { ok: false };
    if (contact.indexOf('@') !== -1) {
      if (!EMAIL.test(contact)) return { ok: false };
      return { ok: true, kind: 'email', contact: contact, phone: '' };
    }
    if (/[a-zA-Z]/.test(contact)) return { ok: false };
    var compact = contact.replace(/[\s()./-]/g, '');
    if (!/^\+?\d{9,15}$/.test(compact)) return { ok: false };
    return { ok: true, kind: 'phone', contact: contact, phone: compact.replace(/^\+/, '') };
  }

  function withMeta(payload, metaEventId) {
    if (metaEventId) payload.meta_event_id = metaEventId;
    return payload;
  }

  // email stays filled with whatever the visitor typed, so older n8n templates
  // that only print email still show a phone number. contact repeats that
  // value. phone is digits only, and empty when the value is an email.
  function buildHandoffPayload(input) {
    var parsed = parseContact(input && input.contact);
    if (!parsed.ok) return null;
    return withMeta({
      sid: (input && input.sid) || 'web',
      name: clean(input && input.name, 80),
      email: parsed.contact,
      contact: parsed.contact,
      phone: parsed.phone,
      message: input && input.message != null ? String(input.message) : '',
      web: input && input.web != null ? String(input.web) : '',
      page: input && input.page != null ? String(input.page) : ''
    }, input && input.metaEventId);
  }

  function buildCheckPayload(input) {
    var url = clean(input && input.url, 200);
    var parsed = parseContact(input && input.contact);
    if (!url || !parsed.ok) return null;
    return withMeta({
      url: url,
      email: parsed.contact,
      contact: parsed.contact,
      phone: parsed.phone,
      note: clean(input && input.note, 400),
      hp: input && input.hp != null ? String(input.hp) : '',
      consent: true,
      src: input && input.src != null ? String(input.src) : ''
    }, input && input.metaEventId);
  }

  function contactThanks(kind) {
    if (kind === 'email') return 'Děkuji, zpráva je odeslaná. Ozvu se vám e-mailem.';
    return 'Děkuji, zpráva je odeslaná. Ozvu se vám na uvedené číslo.';
  }

  function checkFollowup(kind) {
    if (kind === 'email') {
      return 'Kopii jsem vám poslal i e-mailem. Jde o automatickou orientační kontrolu, rád ji s vámi projdu osobně: milos@nitiva.cz.';
    }
    return 'Jde o automatickou orientační kontrolu. Ozvu se vám na uvedené číslo. Rád ji s vámi projdu i osobně: milos@nitiva.cz.';
  }

  function hasFloat(doc) {
    if (doc.querySelector) {
      var found = doc.querySelector('.wa-float');
      if (found) return true;
    }
    var children = doc.body && doc.body.children;
    if (!children) return false;
    var i;
    for (i = 0; i < children.length; i++) {
      if (children[i].className === 'wa-float') return true;
    }
    return false;
  }

  function slotFilled(slot) {
    if (slot.children && slot.children.length) return true;
    if (slot.childElementCount) return true;
    return false;
  }

  function makeLink(doc, href, className) {
    var link = doc.createElement('a');
    link.className = className;
    link.textContent = 'Napsat na WhatsApp';
    if (link.setAttribute) {
      link.setAttribute('href', href);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    } else {
      link.href = href;
    }
    return link;
  }

  function ensureStyle(doc) {
    if (!doc.getElementById || !doc.createElement || !doc.head) return;
    if (doc.getElementById('nitiva-wa-style')) return;
    var style = doc.createElement('style');
    if (style.setAttribute) style.setAttribute('id', 'nitiva-wa-style');
    else style.id = 'nitiva-wa-style';
    style.textContent = '.wa-float{display:none}@media(max-width:820px){.wa-float{display:inline-flex;align-items:center;position:fixed;z-index:45;left:16px;bottom:16px;background:#D9FF6F;color:#0E1727;font-weight:800;font-size:15px;line-height:1.2;text-decoration:none;padding:14px 16px;border-radius:999px;box-shadow:0 10px 24px -12px rgba(14,23,39,.65);min-height:48px}body:has(.wa-float){padding-bottom:80px}}[data-whatsapp-slot]:empty{display:none}[data-whatsapp-slot] .btn{width:100%}';
    doc.head.appendChild(style);
  }

  function installWhatsApp(doc, opts) {
    if (!doc || !doc.querySelectorAll) return;
    var number = opts && Object.prototype.hasOwnProperty.call(opts, 'number') ? opts.number : WHATSAPP_NUMBER;
    if (!number) return;
    var href = whatsappUrl(number);
    if (!href) return;
    ensureStyle(doc);
    var slots = doc.querySelectorAll('[data-whatsapp-slot]');
    var i;
    for (i = 0; i < slots.length; i++) {
      if (slotFilled(slots[i])) continue;
      slots[i].appendChild(makeLink(doc, href, 'btn g'));
    }
    if (doc.body && !hasFloat(doc)) doc.body.appendChild(makeLink(doc, href, 'wa-float'));
  }

  var api = {
    WHATSAPP_NUMBER: WHATSAPP_NUMBER,
    WHATSAPP_TEXT: WHATSAPP_TEXT,
    whatsappUrl: whatsappUrl,
    parseContact: parseContact,
    buildHandoffPayload: buildHandoffPayload,
    buildCheckPayload: buildCheckPayload,
    contactThanks: contactThanks,
    checkFollowup: checkFollowup,
    installWhatsApp: installWhatsApp
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.nitivaLeadForm = api;
    if (root.document) installWhatsApp(root.document);
  }
})(typeof window !== 'undefined' ? window : undefined);
