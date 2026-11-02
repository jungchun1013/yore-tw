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
