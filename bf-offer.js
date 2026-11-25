(function (root) {
  'use strict';

  // Offer is valid through Monday 30 Nov 2026 23:59:59 Europe/Prague (CET, UTC+1).
  var DEADLINE_STAMP = '20261130235959';
  var FALLBACK_END = Date.parse('2026-11-30T23:59:59+01:00');

  // Remaining places. Lower by 1 right after each paid deposit (CZ or SK), never otherwise.
  // This is the only place to edit; the pages read it via [data-bf-spots].
  // When it reaches 0 the whole Black Friday offer is hidden.
  var SPOTS_TOTAL = 5;
  var SPOTS_LEFT = 5;

  function pad(value) {
    value = String(value);
    return value.length < 2 ? '0' + value : value;
  }

  function pragueStamp(date) {
    try {
      var parts = {};
      var i;
      var list = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Prague',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
      }).formatToParts(date);
      for (i = 0; i < list.length; i++) {
        if (list[i].type !== 'literal') parts[list[i].type] = list[i].value;
      }
      if (!parts.year || !parts.month || !parts.day) throw new Error('incomplete stamp');
      return parts.year + pad(parts.month) + pad(parts.day) + pad(parts.hour || '00') + pad(parts.minute || '00') + pad(parts.second || '00');
    } catch (err) {
      return null;
    }
  }

  // The offer is hidden after the deadline and whenever no places are left.
  // spotsLeft is optional (used by tests); by default the SPOTS_LEFT constant decides.
  function isActive(now, spotsLeft) {
    now = now || new Date();
    if ((spotsLeft === undefined ? SPOTS_LEFT : spotsLeft) <= 0) return false;
    var stamp = pragueStamp(now);
    if (stamp) return stamp <= DEADLINE_STAMP;
    return now.getTime() <= FALLBACK_END;
  }

  function each(nodeList, fn) {
    var i;
    for (i = 0; i < nodeList.length; i++) fn(nodeList[i], i);
  }

  function spotsText(lang) {
    if (lang === 'sk') return 'Voľné miesta: ' + SPOTS_LEFT + '\u00a0z\u00a0' + SPOTS_TOTAL + '.';
    return 'Volná místa: ' + SPOTS_LEFT + '\u00a0z\u00a0' + SPOTS_TOTAL + '.';
  }

  function fillSpots(doc) {
    doc = doc || (root && root.document);
    if (!doc || !doc.querySelectorAll) return;
    each(doc.querySelectorAll('[data-bf-spots]'), function (el) {
      var lang = el.getAttribute('data-bf-spots') || 'cs';
      el.textContent = spotsText(lang);
    });
  }

  function apply(doc, now, spotsLeft) {
    doc = doc || (root && root.document);
    if (!doc || !doc.querySelectorAll) return isActive(now, spotsLeft);
    var on = isActive(now, spotsLeft);
    if (doc.documentElement && doc.documentElement.classList) {
      doc.documentElement.classList.toggle('bf-on', on);
    }
    each(doc.querySelectorAll('[data-bf]'), function (el) {
      el.hidden = !on;
    });
    each(doc.querySelectorAll('[data-bf-hide]'), function (el) {
      el.hidden = on;
    });
    fillSpots(doc);
    return on;
  }

  function preselectPackage(doc, loc) {
    doc = doc || (root && root.document);
    loc = loc || (root && root.location);
    if (!doc || !doc.getElementById || !loc) return;
    var form = doc.getElementById('orderForm') || (doc.getElementById('sk-pkg') || {}).form;
    if (!form || !form.pkg) return;
    var query;
    try {
      query = new URLSearchParams(loc.search).get('balicek');
    } catch (err) {
      query = null;
    }
    if (!query) return;
    var needle = String(query).toLowerCase();
    var options = form.pkg.options;
    var i;
    var chosen = '';
    for (i = 0; i < options.length; i++) {
      if (options[i].hidden || options[i].disabled) continue;
      if (String(options[i].value).toLowerCase().indexOf(needle) >= 0) chosen = options[i].value;
    }
    if (chosen) form.pkg.value = chosen;
  }

  function boot() {
    apply();
    preselectPackage();
  }

  var api = {
    DEADLINE_STAMP: DEADLINE_STAMP,
    SPOTS_TOTAL: SPOTS_TOTAL,
    SPOTS_LEFT: SPOTS_LEFT,
    spotsText: spotsText,
    fillSpots: fillSpots,
    isActive: isActive,
    pragueStamp: pragueStamp,
    apply: apply,
    preselectPackage: preselectPackage
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.nitivaBlackFriday = api;
    if (root.document) {
      if (root.document.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', boot);
      } else {
        boot();
      }
    }
  }
})(typeof window !== 'undefined' ? window : undefined);
