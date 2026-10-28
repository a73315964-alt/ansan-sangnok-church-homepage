/* 홈 화면 "오늘의 3구절" 슬라이드
   · 하루에 3구절씩 (2026-10-28 = 1~3번) 한국시간 0시에 바뀌고, 300구절이 끝나면 처음부터 다시 돕니다.
   · 한 구절씩 4초마다 자동으로 넘어가고, 손가락으로 밀거나 ‹ › 점을 눌러도 됩니다.
   · 로그인한 정회원이 보면 구절 본문(개역개정)도 함께 보입니다. 데이터: js/verses300.js */
(function () {
  var host = document.getElementById("verseSlider");
  var all = window.VERSES300;
  if (!host || !all || all.length < 3) return;

  var EPOCH = Date.UTC(2026, 9, 28); // 2026-10-28 → 첫 3구절
  var kst = new Date(Date.now() + 9 * 3600 * 1000);
  var dayNo = Math.floor((Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - EPOCH) / 86400000);
  var groups = Math.floor(all.length / 3);
  var g = ((dayNo % groups) + groups) % groups;
  var items = all.slice(g * 3, g * 3 + 3);
  var cur = 0, timer = null, bodies = {};

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  host.innerHTML =
    '<div class="vs-head"><span class="vs-title">오늘의 암송 성구</span><span class="vs-count" id="vsCount"></span></div>' +
    '<div class="vs-stage" id="vsStage" aria-live="polite">' +
    items.map(function (v, i) {
      return '<figure class="vs-slide' + (i === 0 ? " on" : "") + '" data-i="' + i + '">' +
        '<span class="vs-part">' + esc(v[3]) + '</span>' +
        '<blockquote class="vs-body" id="vsBody' + i + '">' + esc(v[2]) + '</blockquote>' +
        '<figcaption class="vs-ref">' + esc(v[1]) + "</figcaption></figure>";
    }).join("") + "</div>" +
    '<div class="vs-nav"><button type="button" class="vs-arrow" id="vsPrev" aria-label="이전 구절">‹</button>' +
    '<span class="vs-dots" id="vsDots">' + items.map(function (_, i) {
      return '<button type="button" class="vs-dot' + (i === 0 ? " on" : "") + '" data-i="' + i + '" aria-label="' + (i + 1) + '번째 구절"></button>';
    }).join("") + '</span><button type="button" class="vs-arrow" id="vsNext" aria-label="다음 구절">›</button></div>';

  function show(i) {
    cur = (i + items.length) % items.length;
    host.querySelectorAll(".vs-slide").forEach(function (s, k) { s.classList.toggle("on", k === cur); });
    host.querySelectorAll(".vs-dot").forEach(function (d, k) { d.classList.toggle("on", k === cur); });
    document.getElementById("vsCount").textContent = (cur + 1) + " / " + items.length;
  }
  function play() {
    stop();
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = setInterval(function () { show(cur + 1); }, 4000);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  document.getElementById("vsPrev").addEventListener("click", function () { show(cur - 1); play(); });
  document.getElementById("vsNext").addEventListener("click", function () { show(cur + 1); play(); });
  document.getElementById("vsDots").addEventListener("click", function (e) {
    var i = e.target.getAttribute("data-i");
    if (i != null) { show(+i); play(); }
  });
  var stage = document.getElementById("vsStage"), x0 = null;
  stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (x0 != null) {
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    }
    x0 = null; play();
  }, { passive: true });
  host.addEventListener("mouseenter", stop);
  host.addEventListener("mouseleave", play);
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else play(); });
  show(0);
  play();

  /* ---- 로그인한 정회원에게는 구절 본문도 보여 줌 (성경 본문은 회원 전용) ---- */
  function hasSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) return true;
      }
    } catch (e) {}
    return false;
  }
  function load(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
  }
  async function withText() {
    if (!hasSession()) return;
    try {
      await load("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js");
      await load("js/auth.js");
      await load("js/bible-plan.js");
      if (!window.SB_READY) return;
      var p = await sbMyProfile();
      if (!p || !p.approved || p.suspended) return;
      var names = window.BIBLE_BOOKS.map(function (b) { return b.name; });
      for (var i = 0; i < items.length; i++) {
        var m = /^(.+?)\s+(\d+):(\d+)$/.exec(items[i][1]);
        if (!m) continue;
        var book = names.indexOf(m[1]) + 1;
        if (!book) continue;
        var res = await window.SB.from("bible_verses").select("body").eq("book", book).eq("chapter", +m[2]).eq("verse", +m[3]).maybeSingle();
        var el = document.getElementById("vsBody" + i);
        if (el && res.data && res.data.body) el.textContent = res.data.body;
      }
    } catch (e) {}
  }
  withText();
})();
