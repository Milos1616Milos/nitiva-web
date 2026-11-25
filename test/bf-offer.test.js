'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var bf = require('../bf-offer.js');

function prague(isoLike) {
  // Build a Date that represents this civil time in Europe/Prague.
  // November 2026 is CET (UTC+1).
  return new Date(isoLike);
}

assert.ok(bf.isActive(prague('2026-11-25T08:16:00+01:00')), 'today (25.11. morning Prague) should be active');
assert.ok(bf.isActive(prague('2026-11-30T23:59:59+01:00')), 'deadline second is still active');
assert.ok(bf.isActive(prague('2026-11-30T22:59:59.000Z')), '22:59:59 UTC is 23:59:59 Prague, still active');
assert.strictEqual(bf.isActive(prague('2026-11-30T23:00:00.000Z')), false, '23:00 UTC is 1.12. 00:00 Prague');
assert.strictEqual(bf.isActive(prague('2026-12-01T00:00:00+01:00')), false, '1.12. 00:00 Prague is over');
assert.strictEqual(bf.isActive(prague('2026-12-01T00:00:00Z')), false, '1.12. UTC is over');
assert.ok(bf.isActive(prague('2026-11-26T00:00:00+01:00')));
assert.ok(bf.pragueStamp(prague('2026-11-30T23:59:59+01:00')) <= bf.DEADLINE_STAMP);
assert.ok(bf.pragueStamp(prague('2026-12-01T00:00:00+01:00')) > bf.DEADLINE_STAMP);
assert.strictEqual(bf.pragueStamp(prague('2026-11-30T23:59:59+01:00')), '20261130235959');
assert.strictEqual(bf.pragueStamp(prague('2026-12-01T00:00:00+01:00')), '20261201000000');

function el(attrs) {
  var node = { hidden: !!attrs.hidden, className: attrs.className || '', hasAttribute: function (n) { return n in attrs && attrs[n] !== false; } };
  return node;
}

function fakeDoc(showHidden, hideHidden) {
  var show = el({ hidden: showHidden });
  var hide = el({ hidden: hideHidden });
  var root = { classList: { _on: false, toggle: function (name, on) { if (name === 'bf-on') this._on = !!on; } } };
  return {
    documentElement: root,
    show: show,
    hide: hide,
    querySelectorAll: function (sel) {
      if (sel === '[data-bf]') return [show];
      if (sel === '[data-bf-hide]') return [hide];
      return [];
    }
  };
}

var during = fakeDoc(true, false);
assert.strictEqual(bf.apply(during, prague('2026-11-25T12:00:00+01:00')), true);
assert.strictEqual(during.show.hidden, false);
assert.strictEqual(during.hide.hidden, true);
assert.strictEqual(during.documentElement.classList._on, true);

var after = fakeDoc(true, false);
assert.strictEqual(bf.apply(after, prague('2026-12-01T00:00:00+01:00')), false);
assert.strictEqual(after.show.hidden, true);
assert.strictEqual(after.hide.hidden, false);
assert.strictEqual(after.documentElement.classList._on, false);

// Static HTML contracts: banners start hidden, no BF price in JSON-LD or llms.txt.
var rootDir = path.join(__dirname, '..');
var pages = ['index.html', 'ponuka/index.html', 'sk/index.html', 'objednat/index.html'];
pages.forEach(function (rel) {
  var html = fs.readFileSync(path.join(rootDir, rel), 'utf8');
  if (rel !== 'objednat/index.html') {
    assert.ok(html.indexOf('data-bf') !== -1, rel + ' should contain a BF hook');
    assert.ok(/<aside[^>]*data-bf[^>]*hidden/.test(html) || /<aside[^>]*hidden[^>]*data-bf/.test(html), rel + ' banner must start hidden');
  }
  assert.ok(html.indexOf('bf-offer.js') !== -1, rel + ' should load bf-offer.js');
  assert.ok(html.indexOf('bf-offer.css') !== -1, rel + ' should load bf-offer.css');
  if (html.indexOf('application/ld+json') !== -1) {
    var blocks = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || [];
    blocks.forEach(function (block) {
      assert.ok(block.indexOf('2 450') === -1 && block.indexOf('2&nbsp;450') === -1 && !/"price"\s*:\s*"?2450/.test(block), rel + ' JSON-LD must not contain the sale price');
      assert.ok(block.indexOf('97 €') === -1 && block.indexOf('97&nbsp;€') === -1, rel + ' JSON-LD must not contain 97 €');
    });
  }
});

var llms = fs.readFileSync(path.join(rootDir, 'llms.txt'), 'utf8');
assert.ok(llms.indexOf('2 450') === -1 && llms.indexOf('2450') === -1 && llms.indexOf('BF2026') === -1, 'llms.txt must not contain the sale');

var objednat = fs.readFileSync(path.join(rootDir, 'objednat/index.html'), 'utf8');
assert.ok(objednat.indexOf('BF2026') !== -1, 'CZ form must include BF2026');
assert.ok(objednat.indexOf('1&nbsp;225&nbsp;Kč') !== -1 || objednat.indexOf('1 225 Kč') !== -1, 'CZ form must mention 1 225 Kč deposit');
assert.ok(!/paypal\.com[^"]*[\s\S]{0,200}1\s*225/i.test(objednat) && objednat.indexOf('MCGKTSP2LCCA8') !== -1, 'existing 2 450 Kč PayPal button stays for the regular package');
// BF list item has no PayPal button; the regular 2 450 Kč button stays on the next item.
var bfItem = objednat.match(/<li data-bf hidden>[\s\S]*?<\/li>/);
assert.ok(bfItem, 'CZ form has a hidden BF list item');
assert.ok(bfItem[0].indexOf('paypal.com') === -1, 'BF block on /objednat/ must not include a PayPal button');

var sk = fs.readFileSync(path.join(rootDir, 'sk/index.html'), 'utf8');
assert.ok(sk.indexOf('BF2026') !== -1, 'SK form must mark BF2026');
assert.ok(sk.indexOf('Zálohu 48&nbsp;€ uhradíte cez PayPal, výzvu na platbu pošlem po prijatí správy.') !== -1);
assert.ok(sk.indexOf('Cenníková cena zriadenia je 195&nbsp;€ a platí od 13.&nbsp;11.&nbsp;2026, teda kratšie ako 30 dní.') !== -1);
assert.ok(sk.indexOf('label for="e">E-mail<') !== -1 || sk.indexOf('label for="e">E-mail ') !== -1, 'SK field should be e-mail only');
assert.ok(sk.indexOf('E-mail alebo telefón') === -1, 'SK field no longer accepts phone');
assert.ok(sk.indexOf('type="email"') !== -1, 'SK e-mail input uses type=email');
assert.ok(sk.indexOf('Ozvem sa vám e-mailom') !== -1);
assert.ok(!/paypal\.com/i.test(sk), 'SK page must not have a payment button');

var home = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
assert.ok(home.indexOf('Cena zřízení 4&nbsp;900&nbsp;Kč platí od 3. 10. 2026') !== -1 || home.indexOf('Cena zřízení 4 900 Kč platí od 3. 10. 2026') !== -1);
assert.ok(home.indexOf('Spuštění do 7 dnů od podkladů') !== -1);

var ponuka = fs.readFileSync(path.join(rootDir, 'ponuka/index.html'), 'utf8');
assert.ok(ponuka.indexOf('Cena zřízení 4&nbsp;900&nbsp;Kč platí od 3. 10. 2026') !== -1 || ponuka.indexOf('platí od 3. 10. 2026') !== -1);

assert.strictEqual(bf.isActive(new Date('2026-11-26T10:00:00+01:00'), 5), true);
assert.strictEqual(bf.isActive(new Date('2026-11-26T10:00:00+01:00'), 0), false, 'offer hides at 0 spots');
assert.strictEqual(bf.isActive(new Date('2026-12-01T10:00:00+01:00'), 5), false);
console.log('bf-offer tests ok');

assert.strictEqual(bf.SPOTS_TOTAL, 5);
assert.strictEqual(bf.SPOTS_LEFT, 5);
assert.strictEqual(bf.spotsText('cs'), 'Volná místa: 5\u00a0z\u00a05.');
assert.strictEqual(bf.spotsText('sk'), 'Voľné miesta: 5\u00a0z\u00a05.');

var spot = { textContent: '', getAttribute: function (n) { return n === 'data-bf-spots' ? 'sk' : null; } };
bf.fillSpots({ querySelectorAll: function (sel) { return sel === '[data-bf-spots]' ? [spot] : []; } });
assert.strictEqual(spot.textContent, 'Voľné miesta: 5\u00a0z\u00a05.');

['index.html', 'ponuka/index.html', 'sk/index.html', 'objednat/index.html'].forEach(function (rel) {
  var html = fs.readFileSync(path.join(rootDir, rel), 'utf8');
  assert.ok(html.indexOf('data-bf-spots') !== -1, rel + ' should read spots from one JS constant');
  assert.ok(html.indexOf('Volná místa: 5 z 5') === -1, rel + ' must not hard-code the Czech counter');
  assert.ok(html.indexOf('Voľné miesta: 5 z 5') === -1, rel + ' must not hard-code the Slovak counter');
});

var privacyCs = fs.readFileSync(path.join(rootDir, 'ochrana-osobnich-udaju/index.html'), 'utf8');
var privacySk = fs.readFileSync(path.join(rootDir, 'sk/ochrana-osobnych-udajov/index.html'), 'utf8');
assert.ok(privacyCs.indexOf('application/ld+json') === -1, 'CZ privacy must not add JSON-LD');
assert.ok(privacySk.indexOf('application/ld+json') === -1, 'SK privacy must not add JSON-LD');
assert.ok(privacyCs.indexOf('mail-hetzner.dingopet.cz') !== -1);
assert.ok(privacyCs.indexOf('Google Workspace') === -1, 'mail is forwarded to Gmail, the page must not deny Google');
assert.ok(privacyCs.indexOf('Gmail') !== -1);
assert.ok(privacyCs.indexOf('OpenAI') !== -1);
assert.ok(privacySk.indexOf('Úrad na ochranu osobných údajov Slovenskej republiky') !== -1);
assert.ok(privacySk.indexOf('Gmail') !== -1);
assert.ok(privacyCs.indexOf('164438667301853') !== -1);
assert.ok(privacyCs.indexOf('zi6zov6u2y') !== -1);
assert.ok(privacyCs.indexOf('Hetzner') !== -1);
assert.ok(privacySk.indexOf('dataprotection.gov.sk') !== -1);
assert.ok(llms.indexOf('ochrana-osobnich-udaju') === -1, 'llms.txt must not get the new privacy page');

assert.ok(home.indexOf('Provoz 1&nbsp;490&nbsp;Kč měsíčně, první měsíc zdarma, výpověď kdykoli. Spuštění do 7 dnů od podkladů, nejdříve po úhradě zálohy 50&nbsp;% (1&nbsp;225&nbsp;Kč).') !== -1);
assert.ok(home.indexOf('Provoz 1&nbsp;490&nbsp;Kč měsíčně nejdříve po úhradě zálohy') === -1);
assert.ok(sk.indexOf('Prevádzka 60&nbsp;€ mesačne, prvý mesiac zadarmo, ukončenie kedykoľvek. Spustenie do 7 dní od podkladov, najskôr po úhrade zálohy 50&nbsp;% (48&nbsp;€).') !== -1);
assert.ok(sk.indexOf('Prevádzka 60&nbsp;€ mesačne najskôr po úhrade zálohy') === -1);
assert.ok(sk.indexOf('Objednať za 97&nbsp;€') !== -1);
assert.ok(sk.indexOf('za akciovú cenu') === -1);
assert.ok(privacyCs.indexOf('Cookies Clarity (_clck, _clsk) mají platnost nejdéle 1 rok.') !== -1);
assert.ok(privacySk.indexOf('Cookies Clarity (_clck, _clsk) majú platnosť najviac 1 rok.') !== -1);
assert.ok(privacySk.indexOf('v Česku Úrad pro ochranu osobních údajů') !== -1);
assert.ok(privacySk.indexOf('v Česku na Úřadu') === -1);

function fakeSkForm() {
  var pkg = {
    options: [
      { value: 'sprava', hidden: false, disabled: false },
      { value: 'BF2026', hidden: false, disabled: false }
    ],
    value: 'sprava'
  };
  var form = { pkg: pkg };
  var skPkg = { form: form };
  return {
    form: form,
    getElementById: function (id) {
      if (id === 'orderForm') return null;
      if (id === 'sk-pkg') return skPkg;
      return null;
    }
  };
}
var skDoc = fakeSkForm();
bf.preselectPackage(skDoc, { search: '?balicek=bf2026' });
assert.strictEqual(skDoc.form.pkg.value, 'BF2026', 'SK form must preselect BF2026 from ?balicek=bf2026');
