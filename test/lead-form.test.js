'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var lead = require('../lead-form.js');

var TEXT = 'Dobrý den, mám zájem o nezávaznou konzultaci.';

assert.strictEqual(lead.WHATSAPP_NUMBER, '420736284023');
assert.strictEqual(lead.WHATSAPP_TEXT, TEXT);
assert.strictEqual(lead.whatsappUrl(), 'https://wa.me/420736284023?text=' + encodeURIComponent(TEXT));
assert.strictEqual(lead.whatsappUrl(''), '');
assert.strictEqual(lead.whatsappUrl('420736284023').indexOf('24 hodin'), -1);

var email = lead.parseContact('  Jana@Salon.cz  ');
assert.deepStrictEqual(email, {
  ok: true,
  kind: 'email',
  contact: 'Jana@Salon.cz',
  phone: ''
});

var phone = lead.parseContact('+420 736 284 023');
assert.deepStrictEqual(phone, {
  ok: true,
  kind: 'phone',
  contact: '+420 736 284 023',
  phone: '420736284023'
});

assert.strictEqual(lead.parseContact('736284023').ok, true);
assert.strictEqual(lead.parseContact('736 284 023').kind, 'phone');
assert.strictEqual(lead.parseContact('00420 736 284 023').ok, true);
assert.strictEqual(lead.parseContact('(420) 736-284-023').ok, true);
assert.strictEqual(lead.parseContact('').ok, false);
assert.strictEqual(lead.parseContact('   ').ok, false);
assert.strictEqual(lead.parseContact('ahoj').ok, false);
assert.strictEqual(lead.parseContact('12345').ok, false);
assert.strictEqual(lead.parseContact('not-an-email').ok, false);
assert.strictEqual(lead.parseContact('a@b').ok, false);
assert.strictEqual(lead.parseContact('jana@').ok, false);

var handoff = lead.buildHandoffPayload({
  sid: 'web',
  name: '  ',
  contact: '+420 736 284 023',
  message: 'Zdroj návštěvy: meta\n\n',
  web: '',
  page: 'https://nitiva.cz/#kontakt',
  metaEventId: 'abc'
});
assert.deepStrictEqual(handoff, {
  sid: 'web',
  name: '',
  email: '+420 736 284 023',
  contact: '+420 736 284 023',
  phone: '420736284023',
  message: 'Zdroj návštěvy: meta\n\n',
  web: '',
  page: 'https://nitiva.cz/#kontakt',
  meta_event_id: 'abc'
});

var chatbot = lead.buildHandoffPayload({
  sid: 'ai-chatbot',
  name: 'Jana',
  contact: 'jana@salon.cz',
  message: 'Zájem o nezávaznou konzultaci k AI chatbotu.',
  web: '',
  page: 'https://nitiva.cz/ai-chatbot/'
});
assert.strictEqual(chatbot.sid, 'ai-chatbot');
assert.strictEqual(chatbot.name, 'Jana');
assert.strictEqual(chatbot.email, 'jana@salon.cz');
assert.strictEqual(chatbot.contact, 'jana@salon.cz');
assert.strictEqual(chatbot.phone, '');
assert.strictEqual(Object.prototype.hasOwnProperty.call(chatbot, 'meta_event_id'), false);
assert.strictEqual(lead.buildHandoffPayload({ sid: 'web', contact: 'nope', message: '', page: '/' }), null);
assert.strictEqual(Object.prototype.hasOwnProperty.call(handoff, 'website_url'), false);

var withSite = lead.buildHandoffPayload({
  sid: 'web',
  name: '',
  contact: 'jana@salon.cz',
  message: 'Ahoj',
  web: '',
  website_url: '  mojefirma.cz  ',
  page: 'https://nitiva.cz/#kontakt'
});
assert.strictEqual(withSite.website_url, 'mojefirma.cz');
assert.strictEqual(withSite.web, '');
assert.strictEqual(withSite.email, 'jana@salon.cz');

var withScheme = lead.buildHandoffPayload({
  sid: 'web',
  contact: 'jana@salon.cz',
  message: '',
  web: 'filled-by-bot',
  website_url: 'https://mojefirma.cz/kontakt',
  page: '/'
});
assert.strictEqual(withScheme.website_url, 'https://mojefirma.cz/kontakt');
assert.strictEqual(withScheme.web, 'filled-by-bot');

var blankSite = lead.buildHandoffPayload({
  sid: 'web',
  contact: '736284023',
  message: '',
  web: '',
  website_url: '   ',
  page: '/'
});
assert.strictEqual(blankSite.website_url, '');
assert.strictEqual(blankSite.phone, '736284023');

var check = lead.buildCheckPayload({
  url: '  www.vasefirma.cz ',
  contact: '736 284 023',
  note: ' ceník ',
  hp: '',
  src: 'meta-kontrola',
  metaEventId: 'evt-1'
});
assert.deepStrictEqual(check, {
  url: 'www.vasefirma.cz',
  email: '736 284 023',
  contact: '736 284 023',
  phone: '736284023',
  note: 'ceník',
  hp: '',
  consent: true,
  src: 'meta-kontrola',
  meta_event_id: 'evt-1'
});
assert.strictEqual(lead.buildCheckPayload({ url: '', contact: 'jana@salon.cz', note: '', hp: '', src: '' }), null);
assert.strictEqual(lead.buildCheckPayload({ url: 'www.x.cz', contact: 'xyz', note: '', hp: '', src: '' }), null);
assert.strictEqual(lead.contactThanks('email'), 'Děkuji, zpráva je odeslaná. Odpovím e-mailem nejpozději druhý den.');
assert.strictEqual(lead.contactThanks('phone'), 'Děkuji, zpráva je odeslaná. Ozvu se nejpozději druhý den.');
assert.ok(lead.checkFollowup('email').indexOf('e-mailem') !== -1);
assert.strictEqual(lead.checkFollowup('phone'), 'Jde o automatickou orientační kontrolu. Ozvu se nejpozději druhý den. Dotazy: milos@nitiva.cz.');

function FakeEl() {
  this.children = [];
  this.className = '';
  this.textContent = '';
  this.attrs = {};
}
FakeEl.prototype.setAttribute = function (name, value) { this.attrs[name] = value; };
FakeEl.prototype.appendChild = function (child) { this.children.push(child); return child; };
FakeEl.prototype.querySelector = function () { return null; };

function fakeDoc(slots) {
  var body = new FakeEl();
  var head = new FakeEl();
  return {
    head: head,
    body: body,
    slots: slots,
    getElementById: function () { return null; },
    createElement: function () { return new FakeEl(); },
    querySelector: function () { return null; },
    querySelectorAll: function (sel) { return sel === '[data-whatsapp-slot]' ? slots : []; }
  };
}

var slot = new FakeEl();
var doc = fakeDoc([slot]);
lead.installWhatsApp(doc);
assert.strictEqual(slot.children.length, 1);
assert.strictEqual(slot.children[0].textContent, 'Napsat na WhatsApp');
assert.strictEqual(slot.children[0].attrs.href, lead.whatsappUrl());
assert.strictEqual(slot.children[0].attrs.target, '_blank');
assert.strictEqual(doc.body.children.length, 1);
assert.strictEqual(doc.body.children[0].className, 'wa-float');
assert.strictEqual(doc.body.children[0].attrs.href, lead.whatsappUrl());
lead.installWhatsApp(doc);
assert.strictEqual(slot.children.length, 1);
assert.strictEqual(doc.body.children.length, 1);

var emptySlot = new FakeEl();
var emptyDoc = fakeDoc([emptySlot]);
lead.installWhatsApp(emptyDoc, { number: '' });
assert.strictEqual(emptySlot.children.length, 0);
assert.strictEqual(emptyDoc.body.children.length, 0);

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

function assertContactWebsiteField(html, payloadSnippet) {
  var start = html.indexOf('id="contactForm"');
  var end = html.indexOf('</form>', start);
  assert.ok(start !== -1 && end !== -1);
  var form = html.slice(start, end);
  assert.ok(form.indexOf('novalidate') !== -1 && form.indexOf('novalidate') < form.indexOf('name="contact"'));
  var tag = form.match(/<input\b[^>]*\bname="website_url"[^>]*>/);
  assert.ok(tag, 'contact form is missing website_url');
  assert.ok(tag[0].indexOf('type="url"') !== -1);
  assert.ok(tag[0].indexOf('placeholder="https://…"') !== -1);
  assert.ok(tag[0].indexOf('required') === -1);
  assert.ok(tag[0].indexOf('id="website_url"') !== -1);
  assert.ok(form.indexOf('<label for="website_url">Adresa webu</label>') !== -1);
  var contactAt = form.indexOf('name="contact"');
  var siteAt = form.indexOf('name="website_url"');
  var messageAt = form.indexOf('name="message"');
  var honeyAt = form.indexOf('class="hp" name="web"');
  assert.ok(contactAt !== -1 && contactAt < siteAt);
  assert.ok(siteAt < messageAt);
  assert.ok(messageAt < honeyAt);
  assert.ok(html.indexOf(payloadSnippet) !== -1);
}

var home = read('index.html');
var bot = read('ai-chatbot/index.html');
var offer = read('ponuka/index.html');
var consent = read('consent.js');
var visit = read('visit.js');

assert.ok(home.indexOf('grid-template-areas:"slip" "letter" "ticket"') !== -1);
assert.ok(home.indexOf('E-mail nebo telefon') !== -1);
assert.ok(home.indexOf('name="consent"') === -1);
assert.ok(home.indexOf('getElementById(\'cc\')') === -1);
assert.ok(home.indexOf('Údaje použiji jen k odpovědi na váš dotaz.') !== -1);
assert.ok(home.indexOf('href="/ochrana-osobnich-udaju/"') !== -1);
assert.ok(home.indexOf('id="cu"') !== -1);
assert.ok(home.indexOf('24 hodin') === -1);
assert.ok(home.indexOf('/lead-form.js') !== -1);
assert.ok(home.indexOf('data-whatsapp-slot') !== -1);
assert.ok(home.indexOf('nitiva-handoff') !== -1);
assert.ok(home.indexOf('nitiva-kontrola') !== -1);
assert.ok(home.indexOf("nitivaFireLead('kontakt'") !== -1);
assert.ok(home.indexOf("nitivaFireLead('kontrola_webu'") !== -1);
assert.ok(home.indexOf('for="n"') === -1);
assertContactWebsiteField(home, 'website_url:f.website_url.value');

var slovak = read('sk/index.html');
assertContactWebsiteField(slovak, 'website_url:f.website_url.value');

assert.ok(bot.indexOf('Chci nezávaznou konzultaci') !== -1);
assert.ok(bot.indexOf('Chatbota umím napojit i na Instagram, Messenger a WhatsApp (přes oficiální rozhraní Meta).') !== -1);
assert.ok(bot.indexOf('E-mail nebo telefon') !== -1);
assert.ok(bot.indexOf('Jméno (nepovinné)') !== -1);
assert.ok(bot.indexOf("sid: 'ai-chatbot'") !== -1 || bot.indexOf('sid:\'ai-chatbot\'') !== -1 || bot.indexOf("buildHandoffPayload") !== -1);
assert.ok(bot.indexOf('nitiva-handoff') !== -1);
assert.ok(bot.indexOf("nitivaFireLead('kontakt'") !== -1);
assert.ok(bot.indexOf('Údaje použiji jen k odpovědi na váš dotaz.') !== -1);
assert.ok(bot.indexOf('24 hodin') === -1);
assert.ok(bot.indexOf('Domluvit nezávaznou konzultaci') === -1);
assert.ok(bot.indexOf('>Napište mi<') === -1);
assert.ok(bot.indexOf('/lead-form.js') !== -1);

assert.ok(offer.indexOf('E-mail nebo telefon') !== -1);
assert.ok(offer.indexOf('for="offer-name"') === -1);
assert.ok(offer.indexOf('Údaje použiji jen k odpovědi na váš dotaz.') !== -1);
assert.ok(offer.indexOf('/lead-form.js') !== -1);

assert.strictEqual(consent.indexOf('WHATSAPP_NUMBER'), -1);
assert.strictEqual(visit.indexOf('WHATSAPP_NUMBER'), -1);
assert.ok(consent.indexOf('kontrola_webu: 1, kontakt: 1, objednavka: 1') !== -1);

console.log('lead-form tests ok');
