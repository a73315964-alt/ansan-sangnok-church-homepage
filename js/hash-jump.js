/* 우리들의 이야기 — 메뉴에서 "주제별 빙고"·"성경퀴즈 방"을 누르면 그 방이 맨 위에 바로 보이게 합니다.
   위쪽 사진 등이 늦게 불러와져 화면이 밀려도 몇 번 다시 맞춰 줍니다 (손으로 움직이면 멈춤). */
(function () {
  var IDS = { "bingo": 1, "bible-quiz": 1 }, moved = false;
  ["touchstart", "wheel", "keydown", "mousedown"].forEach(function (ev) {
    window.addEventListener(ev, function () { moved = true; }, { passive: true });
  });
  function jump() {
    var id = decodeURIComponent((location.hash || "").slice(1));
    if (!IDS[id] || moved) return;
    var el = document.getElementById(id);
    if (!el) return;
    var h = document.querySelector("header");
    var bar = h ? h.getBoundingClientRect().height : 0;
    var html = document.documentElement, old = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";                       // 부드럽게 말고 바로 이동
    window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - bar));
    html.style.scrollBehavior = old;
  }
  function run() { moved = false; jump(); [300, 900, 1800, 3500].forEach(function (t) { setTimeout(jump, t); }); }
  window.addEventListener("load", run);
  window.addEventListener("hashchange", run);
  if (document.readyState !== "loading") run();
})();
