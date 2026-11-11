// language: every page exists twice, Traditional Chinese at /zh/ and English at /en/ (built by build.cjs).
// The header toggle is a plain link to the other tree; a click is remembered, and a remembered
// choice redirects the other tree's pages. Nothing is sniffed from the browser, so crawlers see the real page.
(function () {
  var page = (document.documentElement.lang || '').indexOf('zh') === 0 ? 'zh' : 'en';
  document.documentElement.setAttribute('data-lang', page);
  var saved = null; try { saved = localStorage.getItem('yore.lang'); } catch (e) {}
  if (saved && saved !== page) {
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + (saved === 'zh' ? 'zh-Hant' : 'en') + '"]');
    if (alt) { location.replace(alt.getAttribute('href').replace(/^https?:\/\/[^/]+/, '') + location.hash); return; }
  }
  document.addEventListener('DOMContentLoaded', function () {
    var a = document.getElementById('lang');
    if (!a) return;
    a.addEventListener('click', function () {
      try { localStorage.setItem('yore.lang', page === 'zh' ? 'en' : 'zh'); } catch (e) {}
    });
  });
})();

// display ads: every .ad-slot gets one AdSense unit once <meta name="yore-ad-slot"> holds an ad unit id; empty = nothing shown
document.addEventListener('DOMContentLoaded', function () {
  var m = document.querySelector('meta[name="yore-ad-slot"]'), id = m && m.content.trim();
  if (!id) return;
  var boxes = document.querySelectorAll('.ad-slot');
  for (var i = 0; i < boxes.length; i++) {
    boxes[i].innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-2972514108022599" data-ad-slot="' + id + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    boxes[i].classList.add('on');
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }
});
