(function (root) {
  'use strict';

  // Only place the webhook URL lives. Campaign visits are posted here.
  var ENDPOINT = 'https://n8n.178-105-83-205.sslip.io/webhook/nitiva-visit';
  var MOBILE_MAX_WIDTH = 768;
  var MAX_FIELD = 300;

  function clean(value) {
    if (value == null) return '';
    var text = String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim();
    return text.length > MAX_FIELD ? text.slice(0, MAX_FIELD) : text;
  }

  function paramsFrom(search) {
    var query = search || '';
    if (query.charAt(0) === '?') query = query.slice(1);
    return new URLSearchParams(query);
  }

  function shouldReport(search) {
    try {
      var found = false;
      paramsFrom(search).forEach(function (value, key) {
        if (!found && key.indexOf('utm_') === 0 && clean(value)) found = true;
      });
      return found;
    } catch (e) {
      return false;
    }
  }

  function referrerHost(referrer) {
    if (!referrer) return '';
    try {
      return clean(new URL(referrer).hostname);
    } catch (e) {
      return '';
    }
  }

  function deviceType(width) {
    var n = Number(width);
    if (!isFinite(n) || n <= 0) return 'desktop';
    return n < MOBILE_MAX_WIDTH ? 'mobile' : 'desktop';
  }

  function buildPayload(input) {
    input = input || {};
    var params = paramsFrom(input.search);
    var now = input.now instanceof Date ? input.now : new Date();
    var stamp = '';
    try { stamp = now.toISOString(); } catch (e) {}
    var path = clean(input.pathname || '/');
    if (!path || path.charAt(0) !== '/') path = '/' + path;
    return {
      path: path,
      utm_source: clean(params.get('utm_source')),
      utm_medium: clean(params.get('utm_medium')),
      utm_campaign: clean(params.get('utm_campaign')),
      utm_content: clean(params.get('utm_content')),
      utm_term: clean(params.get('utm_term')),
      referrer: referrerHost(input.referrer),
      timestamp: stamp,
      device: deviceType(input.viewportWidth)
    };
  }

  // fetch is primary. sendBeacon cannot send application/json cross-origin
  // because that content type is not CORS-safelisted and Chrome drops it.
  function sendVisit(json, deps) {
    deps = deps || {};
    var fetchFn = Object.prototype.hasOwnProperty.call(deps, 'fetch') ? deps.fetch : (typeof fetch === 'function' ? fetch : null);
    var beacon = Object.prototype.hasOwnProperty.call(deps, 'sendBeacon') ? deps.sendBeacon : (typeof navigator !== 'undefined' && navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null);
    try {
      if (typeof fetchFn === 'function') {
        var pending = fetchFn(ENDPOINT, {
          method: 'POST',
          keepalive: true,
          mode: 'cors',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: json
        });
        if (pending && typeof pending.catch === 'function') pending.catch(function () {});
        return;
      }
    } catch (e) {}
    try {
      if (typeof beacon === 'function') beacon(ENDPOINT, new Blob([json], { type: 'application/json' }));
    } catch (e) {}
  }

  function install(view) {
    try {
      if (!view || view.__nitivaVisitSent) return;
      var loc = view.location;
      if (!loc || !shouldReport(loc.search || '')) return;
      view.__nitivaVisitSent = 1;
      var referrer = '';
      try { referrer = (view.document && view.document.referrer) || ''; } catch (e) {}
      var width = 0;
      try { width = view.innerWidth; } catch (e) {}
      var fetchFn = null;
      var beaconFn = null;
      try { if (typeof view.fetch === 'function') fetchFn = view.fetch.bind(view); } catch (e) {}
      try {
        if (view.navigator && typeof view.navigator.sendBeacon === 'function') {
          beaconFn = view.navigator.sendBeacon.bind(view.navigator);
        }
      } catch (e) {}
      sendVisit(JSON.stringify(buildPayload({
        pathname: loc.pathname || '/',
        search: loc.search || '',
        referrer: referrer,
        viewportWidth: width,
        now: new Date()
      })), { fetch: fetchFn, sendBeacon: beaconFn });
    } catch (e) {}
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = {
      ENDPOINT: ENDPOINT,
      MOBILE_MAX_WIDTH: MOBILE_MAX_WIDTH,
      shouldReport: shouldReport,
      buildPayload: buildPayload,
      sendVisit: sendVisit,
      install: install
    };
  }

  if (root && root.document) install(root);
})(typeof window !== 'undefined' ? window : undefined);
