'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var code = fs.readFileSync(path.join(__dirname, '..', 'lead-source.js'), 'utf8');

function run(search, referrer, pathname, stored) {
  var store = {};
  if (stored) store.nitivaEntry = JSON.stringify(stored);
  var win = {};
  var ctx = {
    window: win,
    location: { search: search, pathname: pathname || '/', hostname: 'nitiva.cz', origin: 'https://nitiva.cz', href: 'https://nitiva.cz' + (pathname || '/') + search },
    document: { referrer: referrer, querySelectorAll: function () { return []; } },
    sessionStorage: { getItem: function (k) { return store[k] || null; }, setItem: function (k, v) { store[k] = v; } },
    URLSearchParams: URLSearchParams,
    URL: URL,
    JSON: JSON,
    String: String
  };
  vm.runInNewContext(code, ctx);
  return win;
}

function label(search, referrer) { return run(search, referrer).nitivaLeadSource(); }

// Existing sources keep their labels.
assert.strictEqual(label('', ''), 'priamo');
assert.strictEqual(label('', 'https://www.google.com/search?q=x'), 'google');
assert.strictEqual(label('', 'https://search.seznam.cz/?q=x'), 'seznam');
assert.strictEqual(label('', 'https://l.facebook.com/l.php'), 'meta');
assert.strictEqual(label('', 'https://example.org/page'), 'jiny-web');
assert.strictEqual(label('', 'https://nitiva.cz/ponuka/'), '');
assert.strictEqual(label('?utm_source=meta&utm_campaign=kontrola', 'https://l.facebook.com/'), 'meta-kontrola');

// Real AI referrers.
assert.strictEqual(label('', 'https://chatgpt.com/'), 'ai-chatgpt');
assert.strictEqual(label('', 'https://chat.openai.com/c/1'), 'ai-chatgpt');
assert.strictEqual(label('', 'https://www.perplexity.ai/search/x'), 'ai-perplexity');
assert.strictEqual(label('', 'https://gemini.google.com/app'), 'ai-gemini');
assert.strictEqual(label('', 'https://claude.ai/chat/1'), 'ai-claude');
assert.strictEqual(label('', 'https://copilot.microsoft.com/'), 'ai-copilot');
assert.strictEqual(label('', 'https://grok.com/'), 'ai-grok');
assert.strictEqual(label('', 'https://grok.x.ai/'), 'ai-grok');
// Google search must not be mistaken for Gemini.
assert.strictEqual(label('', 'https://www.google.com/'), 'google');

// utm_source=chatgpt.com in the address is not a real referrer.
assert.strictEqual(label('?utm_source=chatgpt.com', ''), 'chatgpt.com');
assert.strictEqual(label('?utm_source=chatgpt.com', 'https://l.facebook.com/'), 'chatgpt.com');
// ...and when the referrer is really ChatGPT as well, both are visible.
assert.strictEqual(label('?utm_source=chatgpt.com', 'https://chatgpt.com/'), 'chatgpt.com+ai-chatgpt');

// Message carries the label and the landing page.
var w = run('', 'https://claude.ai/chat/1', '/ai-chatbot/');
assert.strictEqual(w.nitivaLeadMessage('Ahoj'), 'Zdroj návštěvy: ai-claude, vstupní stránka: /ai-chatbot/\n\nAhoj');

console.log('lead-source tests ok');
