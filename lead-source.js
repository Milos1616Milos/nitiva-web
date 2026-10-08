(function () {
  'use strict';
  function clean(value) { value = String(value || '').toLowerCase(); return /^[a-z0-9][a-z0-9_.-]{0,59}$/.test(value) ? value : ''; }
  var q = new URLSearchParams(location.search);
  var source = clean(q.get('utm_source')), campaign = clean(q.get('utm_campaign')), medium = clean(q.get('utm_medium'));
  function label() { return source ? [source,campaign].filter(Boolean).join('-').slice(0,60) : ''; }
  window.nitivaLeadSource = label;
  window.nitivaLeadMessage = function (message) { var s=label(); return (s ? 'Zdroj návštěvy: '+s+'\n\n' : '')+String(message||''); };
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
