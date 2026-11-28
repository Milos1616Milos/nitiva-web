(function () {
  'use strict';
  function clean(value) { value = String(value || '').toLowerCase(); return /^[a-z0-9][a-z0-9_.-]{0,59}$/.test(value) ? value : ''; }
  var q = new URLSearchParams(location.search);
  var source = clean(q.get('utm_source')), campaign = clean(q.get('utm_campaign')), medium = clean(q.get('utm_medium'));
  // Zdroj bez UTM: z referreru (jen hrubá kategorie, žádné cookies), spolu se vstupní stránkou.
  var KEY = 'nitivaEntry';
  function referrerSource() {
    var ref = document.referrer || '';
    if (!ref) return 'priamo';
    var host = '';
    try { host = new URL(ref).hostname.toLowerCase(); } catch (e) { return 'priamo'; }
    if (host === location.hostname || host.slice(-('.' + location.hostname).length) === '.' + location.hostname) return '';
    // Skutečný odkaz z AI nástroje (referrer). Štítek ai-… se liší od utm_source=chatgpt.com v adrese.
    if (/(^|\.)(chatgpt\.com|openai\.com)$/.test(host)) return 'ai-chatgpt';
    if (/(^|\.)perplexity\.ai$/.test(host)) return 'ai-perplexity';
    if (/(^|\.)(gemini|bard)\.google\.com$/.test(host)) return 'ai-gemini';
    if (/(^|\.)claude\.ai$/.test(host)) return 'ai-claude';
    if (/(^|\.)(copilot\.microsoft\.com|copilot\.com)$/.test(host)) return 'ai-copilot';
    if (/(^|\.)(grok\.com|x\.ai)$/.test(host)) return 'ai-grok';
    if (/(^|\.)google\./.test(host)) return 'google';
    if (/(^|\.)seznam\.cz$/.test(host)) return 'seznam';
    if (/(^|\.)bing\.com$/.test(host)) return 'bing';
    if (/(^|\.)duckduckgo\.com$/.test(host)) return 'duckduckgo';
    if (/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/.test(host)) return 'meta';
    if (/(^|\.)linkedin\.com$/.test(host)) return 'linkedin';
    if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return 'youtube';
    return 'jiny-web';
  }
  var entry = null;
  try { entry = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!entry) {
    var ref = referrerSource();
    entry = { s: source || ref, p: (location.pathname || '/').slice(0, 80) };
    // Skutečný referrer z AI nástroje si pamatujeme i tehdy, když je v adrese utm_source.
    if (source && /^ai-/.test(ref)) entry.a = ref;
    try { sessionStorage.setItem(KEY, JSON.stringify(entry)); } catch (e) {}
  } else if (source && entry.s !== source) {
    entry.s = source;
    try { sessionStorage.setItem(KEY, JSON.stringify(entry)); } catch (e) {}
  }
  function label() {
    if (source) {
      var base = [source, campaign].filter(Boolean).join('-');
      return (entry && entry.a ? base + '+' + entry.a : base).slice(0, 60);
    }
    return entry && entry.s ? String(entry.s).slice(0, 60) : '';
  }
  window.nitivaLeadSource = label;
  window.nitivaLeadMessage = function (message) {
    var s = label();
    var page = entry && entry.p ? ', vstupní stránka: ' + entry.p : '';
    return (s ? 'Zdroj návštěvy: ' + s + page + '\n\n' : '') + String(message || '');
  };
  if (!source) return;
  document.querySelectorAll('a[href]').forEach(function (a) {
    try {
      var u = new URL(a.getAttribute('href'),location.href);
      if(u.origin!==location.origin || /\.[a-z0-9]+$/i.test(u.pathname.replace(/\/$/,'')) && !/\.html$/i.test(u.pathname)) return;
      if (u.searchParams.has('utm_source')) return;
      u.searchParams.set('utm_source',source);
      if(medium)u.searchParams.set('utm_medium',medium);
      if(campaign)u.searchParams.set('utm_campaign',campaign);
      a.setAttribute('href',u.pathname+u.search+u.hash);
    } catch (e) {}
  });
})();
