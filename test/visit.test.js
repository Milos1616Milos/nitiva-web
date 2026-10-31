'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var visit = require('../visit.js');

var NOW = new Date('2026-10-31T08:00:00.000Z');

function payload(extra) {
  var input = {
    pathname: '/',
    search: '?utm_source=meta&utm_medium=paid&utm_campaign=kontrola&utm_content=ad1&utm_term=web',
    referrer: '',
    viewportWidth: 1280,
    now: NOW
  };
  Object.keys(extra || {}).forEach(function (key) { input[key] = extra[key]; });
  return visit.buildPayload(input);
}

assert.strictEqual(visit.ENDPOINT, 'https://n8n.178-105-83-205.sslip.io/webhook/nitiva-visit');

assert.strictEqual(visit.shouldReport(''), false);
assert.strictEqual(visit.shouldReport('?fbclid=abc'), false);
assert.strictEqual(visit.shouldReport('?utm_source='), false);
assert.strictEqual(visit.shouldReport('?utm_source=%20'), false);
assert.strictEqual(visit.shouldReport('?xutm_source=meta'), false);
assert.strictEqual(visit.shouldReport('?utm_source=meta'), true);
assert.strictEqual(visit.shouldReport('?utm_campaign=jarni'), true);
assert.strictEqual(visit.shouldReport('?gclid=1&utm_term=chatbot'), true);

var home = payload({
  pathname: '/',
  search: '?utm_source=meta&utm_medium=paid&utm_campaign=kontrola&utm_content=ad1&utm_term=web',
  referrer: 'https://l.facebook.com/l.php?u=https%3A%2F%2Fnitiva.cz%2F%3Futm_source%3Dmeta',
  viewportWidth: 390
});
assert.deepStrictEqual(home, {
  path: '/',
  utm_source: 'meta',
  utm_medium: 'paid',
  utm_campaign: 'kontrola',
  utm_content: 'ad1',
  utm_term: 'web',
  referrer: 'l.facebook.com',
  timestamp: '2026-10-31T08:00:00.000Z',
  device: 'mobile'
});

var chatbot = payload({
  pathname: '/ai-chatbot/',
  search: '?utm_source=meta&utm_medium=cpc&utm_campaign=chatbot&utm_content=video&utm_term=ai',
  referrer: '',
  viewportWidth: 768
});
assert.strictEqual(chatbot.path, '/ai-chatbot/');
assert.strictEqual(chatbot.device, 'desktop');
assert.strictEqual(chatbot.referrer, '');
assert.strictEqual(chatbot.utm_campaign, 'chatbot');

assert.strictEqual(payload({ viewportWidth: 767 }).device, 'mobile');
assert.strictEqual(payload({ viewportWidth: 0 }).device, 'desktop');
assert.strictEqual(payload({ referrer: 'not a url' }).referrer, '');
assert.strictEqual(payload({ pathname: '' }).path, '/');

var longCampaign = new Array(400).join('a');
assert.strictEqual(payload({ search: '?utm_source=meta&utm_campaign=' + longCampaign }).utm_campaign.length, 300);

function install(view) {
  visit.install(view);
}

var calls = [];
var homeView = {
  location: { pathname: '/', search: '?utm_source=meta&utm_medium=paid&utm_campaign=kontrola', hash: '#kontrola' },
  document: { referrer: 'https://lm.facebook.com/l.php?u=secret-path' },
  innerWidth: 375,
  fetch: function (url, opts) {
    calls.push({ url: url, opts: opts });
    return Promise.resolve();
  },
  navigator: { sendBeacon: function () { throw new Error('sendBeacon should not be primary'); } }
};
install(homeView);
assert.strictEqual(calls.length, 1);
assert.strictEqual(calls[0].url, visit.ENDPOINT);
assert.strictEqual(calls[0].opts.method, 'POST');
assert.strictEqual(calls[0].opts.keepalive, true);
assert.strictEqual(calls[0].opts.mode, 'cors');
assert.strictEqual(calls[0].opts.credentials, 'omit');
assert.deepStrictEqual(calls[0].opts.headers, { 'Content-Type': 'application/json' });
var sent = JSON.parse(calls[0].opts.body);
assert.strictEqual(sent.path, '/');
assert.strictEqual(sent.utm_source, 'meta');
assert.strictEqual(sent.utm_medium, 'paid');
assert.strictEqual(sent.utm_campaign, 'kontrola');
assert.strictEqual(sent.utm_content, '');
assert.strictEqual(sent.utm_term, '');
assert.strictEqual(sent.referrer, 'lm.facebook.com');
assert.strictEqual(sent.device, 'mobile');
assert.ok(sent.timestamp);
install(homeView);
assert.strictEqual(calls.length, 1, 'a second include on the same page must not send again');

var chatCalls = [];
install({
  location: { pathname: '/ai-chatbot/', search: '?utm_source=ig&utm_medium=paid', hash: '' },
  document: { referrer: '' },
  innerWidth: 1100,
  fetch: function (url, opts) {
    chatCalls.push(JSON.parse(opts.body));
    return Promise.reject(new Error('network'));
  },
  navigator: { sendBeacon: function () { throw new Error('failed fetch must not fall through to a second send'); } }
});
assert.strictEqual(chatCalls.length, 1);
assert.strictEqual(chatCalls[0].path, '/ai-chatbot/');
assert.strictEqual(chatCalls[0].device, 'desktop');

var organic = 0;
install({
  location: { pathname: '/', search: '', hash: '#kontrola' },
  document: { referrer: 'https://www.google.com/search?q=nitiva' },
  innerWidth: 400,
  fetch: function () { organic += 1; return Promise.resolve(); },
  navigator: {}
});
assert.strictEqual(organic, 0);

var beacons = [];
install({
  location: { pathname: '/', search: '?utm_source=meta' },
  document: { referrer: '' },
  innerWidth: 800,
  navigator: {
    sendBeacon: function (url, blob) {
      beacons.push({ url: url, type: blob.type });
      return true;
    }
  }
});
assert.strictEqual(beacons.length, 1);
assert.strictEqual(beacons[0].url, visit.ENDPOINT);
assert.strictEqual(beacons[0].type, 'application/json');

var threw = [];
install({
  location: { pathname: '/', search: '?utm_source=meta' },
  document: { referrer: '' },
  innerWidth: 900,
  fetch: function () { throw new Error('fetch missing'); },
  navigator: {
    sendBeacon: function (url) { threw.push(url); return true; }
  }
});
assert.deepStrictEqual(threw, [visit.ENDPOINT]);

var vm = require('vm');
var browserCalls = [];
var browser = {
  document: { referrer: 'https://www.instagram.com/reel/abc?igsh=secret' },
  location: { pathname: '/', search: '?utm_source=meta&utm_campaign=kontrola', hash: '#kontrola' },
  innerWidth: 390,
  navigator: { sendBeacon: function () { throw new Error('browser entry must use fetch'); } },
  fetch: function (url, opts) {
    browserCalls.push({ url: url, body: JSON.parse(opts.body), headers: opts.headers, credentials: opts.credentials });
    return Promise.resolve();
  }
};
browser.window = browser;
browser.URL = URL;
browser.URLSearchParams = URLSearchParams;
browser.Blob = Blob;
browser.Date = Date;
browser.JSON = JSON;
browser.Promise = Promise;
browser.Object = Object;
browser.Number = Number;
browser.String = String;
browser.isFinite = isFinite;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'visit.js'), 'utf8'), browser);
assert.strictEqual(browserCalls.length, 1);
assert.strictEqual(browserCalls[0].url, visit.ENDPOINT);
assert.strictEqual(browserCalls[0].credentials, 'omit');
assert.strictEqual(browserCalls[0].headers['Content-Type'], 'application/json');
assert.strictEqual(browserCalls[0].body.path, '/');
assert.strictEqual(browserCalls[0].body.utm_campaign, 'kontrola');
assert.strictEqual(browserCalls[0].body.referrer, 'www.instagram.com');
assert.strictEqual(browserCalls[0].body.device, 'mobile');
assert.ok(!Object.prototype.hasOwnProperty.call(browserCalls[0].body, 'hash'));

var src = fs.readFileSync(path.join(__dirname, '..', 'visit.js'), 'utf8');
assert.ok(!/localStorage|sessionStorage|document\.cookie|indexedDB|fingerprint|canvas\.toDataURL/i.test(src));
assert.strictEqual(src.split(visit.ENDPOINT).length - 1, 1);

function walk(dir, found) {
  fs.readdirSync(dir).forEach(function (name) {
    if (name === '.git' || name === 'node_modules') return;
    var full = path.join(dir, name);
    var stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, found);
    else if (name.endsWith('.html')) found.push(full);
  });
  return found;
}

var root = path.join(__dirname, '..');
var htmlFiles = walk(root, []);
assert.ok(htmlFiles.length > 30);
htmlFiles.forEach(function (file) {
  var rel = path.relative(root, file);
  var html = fs.readFileSync(file, 'utf8');
  if (rel === 'google2067fb7c4703a82e.html') {
    assert.ok(html.indexOf('visit.js') === -1);
    return;
  }
  assert.ok(html.indexOf('<script src="/visit.js" defer></script>') !== -1, rel + ' is missing the beacon');
});

['index.html', 'ai-chatbot/index.html', '404.html'].forEach(function (rel) {
  var html = fs.readFileSync(path.join(root, rel), 'utf8');
  assert.ok(html.indexOf('<script src="/visit.js" defer></script>') !== -1, rel);
  assert.ok(html.indexOf('consent.js') !== -1, rel + ' must keep the consent script');
});

console.log('visit beacon tests ok (' + htmlFiles.length + ' html files)');
