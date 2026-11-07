// language toggle shared by every page: zh-TW by default, English on request, remembered per browser
(function () {
  var saved = null; try { saved = localStorage.getItem('yore.lang'); } catch (e) {}
  var lang = saved || ((navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en');
  document.documentElement.setAttribute('data-lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('lang');
    if (!btn) return;
    var sync = function () { btn.textContent = document.documentElement.getAttribute('data-lang') === 'zh' ? 'EN' : '中文'; };
    sync();
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-lang') === 'zh' ? 'en' : 'zh';
      document.documentElement.setAttribute('data-lang', next);
      document.documentElement.lang = next === 'zh' ? 'zh-TW' : 'en';
      try { localStorage.setItem('yore.lang', next); } catch (e) {}
      sync();
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
