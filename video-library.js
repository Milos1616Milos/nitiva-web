/* Progressive enhancement: all videos and links remain available without JS. */
(function () {
  'use strict';
  var strip = document.getElementById('video-strip');
  var tools = document.getElementById('video-tools');
  if (!strip || !tools) return;
  var search = document.getElementById('video-search');
  var status = document.getElementById('video-results');
  var empty = document.getElementById('video-empty');
  var reset = document.getElementById('video-reset');
  var buttons = Array.from(tools.querySelectorAll('[data-video-topic]'));
  var topic = 'all';
  function normalize(text) {
    return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function inferTopics(text) {
    var topics = [];
    if (/\bweb|poptav|formular|strank/.test(text)) topics.push('web');
    if (/chatbot|asistent|umela inteligence/.test(text)) topics.push('chatbot');
    if (/automat|opakovan|termin/.test(text)) topics.push('automatizace');
    if (/social|instagram|facebook|prisp[e]?v|reels/.test(text)) topics.push('socialni-site');
    if (/grafik|banner|logo|vizual/.test(text)) topics.push('grafika');
    return topics;
  }
  // New cards may declare topics and keywords. Older publishing flows still work:
  // infer categories from each new card's visible title and player label.
  var cards = Array.from(strip.querySelectorAll('figure')).map(function (element) {
    var video = element.querySelector('video');
    var text = normalize(element.textContent + ' ' + (video ? video.getAttribute('aria-label') : '') + ' ' + (element.dataset.keywords || ''));
    var topics = element.dataset.topics ? element.dataset.topics.split(/\s+/) : inferTopics(text);
    return { element: element, text: text, topics: topics };
  });
  buttons.forEach(function (button) {
    var value = button.dataset.videoTopic;
    button.hidden = value !== 'all' && !cards.some(function (card) { return card.topics.indexOf(value) !== -1; });
    button.addEventListener('click', function () { topic = value; apply(); });
  });
  function apply() {
    var words = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    var count = 0;
    cards.forEach(function (card) {
      var matches = (topic === 'all' || card.topics.indexOf(topic) !== -1) && words.every(function (word) { return card.text.indexOf(word) !== -1; });
      card.element.hidden = !matches;
      var player = card.element.querySelector('video');
      if (!matches && player && !player.paused) player.pause();
      if (matches) count++;
    });
    buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.videoTopic === topic)); });
    status.textContent = 'Zobrazeno ' + count + ' z ' + cards.length + ' videí';
    empty.hidden = count !== 0;
    reset.hidden = topic === 'all' && words.length === 0;
    strip.scrollLeft = 0;
  }
  search.addEventListener('input', apply);
  reset.addEventListener('click', function () { topic = 'all'; search.value = ''; apply(); search.focus(); });
  tools.hidden = false;
  apply();
})();
