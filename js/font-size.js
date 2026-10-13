/* ============================================================
   글자 크기 조절 — 모든 화면 오른쪽 아래의 [가− · 크기 · 가+] 버튼
   사이트 글자는 모두 rem 단위라 맨 위(html) 글자 크기만 바꾸면 화면 전체가 함께 커지고 작아집니다.
   고른 크기는 이 브라우저에 기억해 두었다가 다른 화면에서도 그대로 씁니다.
   <head> 에서 불러야 화면이 그려지기 전에 크기가 먼저 적용됩니다.
   ============================================================ */
(function () {
  var KEY = "site-font-size";
  var STEPS = [14, 16, 18, 20, 22, 24]; // px — 16 이 기본
  var BASE = 16;
  var root = document.documentElement;

  function load() {
    try {
      var v = parseInt(localStorage.getItem(KEY), 10);
      return STEPS.indexOf(v) >= 0 ? v : BASE;
    } catch (e) {
      return BASE;
    }
  }
  function save(v) {
    try {
      if (v === BASE) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(v));
    } catch (e) {}
  }

  var size = load();
  function apply() {
    root.style.fontSize = size === BASE ? "" : size + "px";
    var label = document.querySelector(".fs-ctl .fs-now");
    if (!label) return;
    label.textContent = Math.round((size / BASE) * 100) + "%";
    document.querySelector(".fs-ctl .fs-down").disabled = size === STEPS[0];
    document.querySelector(".fs-ctl .fs-up").disabled = size === STEPS[STEPS.length - 1];
  }
  function step(d) {
    var i = STEPS.indexOf(size) + d;
    if (i < 0 || i >= STEPS.length) return;
    size = STEPS[i];
    save(size);
    apply();
  }
  apply();

  // 다른 탭에서 바꾸면 이 탭도 따라 바뀝니다.
  window.addEventListener("storage", function (e) {
    if (e.key !== KEY) return;
    size = load();
    apply();
  });

  function mount() {
    if (document.querySelector(".fs-ctl")) return;
    var css =
      ".fs-ctl{position:fixed;right:14px;bottom:14px;z-index:150;display:flex;align-items:center;gap:2px;" +
      "padding:4px;border-radius:999px;background:#fff;border:1px solid var(--border,#e2e8e4);" +
      "box-shadow:0 6px 20px rgba(31,39,36,.16);font-family:inherit;font-size:16px;line-height:1}" +
      ".fs-ctl button{border:0;background:transparent;color:var(--accent,#2a4a75);font:inherit;font-weight:700;" +
      "min-width:42px;height:38px;padding:0 8px;border-radius:999px;cursor:pointer}" +
      ".fs-ctl button:hover:not(:disabled){background:var(--accent-light,#e9eef6)}" +
      ".fs-ctl button:disabled{opacity:.35;cursor:default}" +
      ".fs-ctl .fs-down{font-size:14px}.fs-ctl .fs-up{font-size:19px}" +
      ".fs-ctl .fs-now{min-width:52px;font-size:13px;color:var(--ink-soft,#4b5a54);font-weight:600}" +
      "@media (max-width:720px){.fs-ctl{right:10px;bottom:10px}}" +
      "@media print{.fs-ctl{display:none}}";
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var box = document.createElement("div");
    box.className = "fs-ctl";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "글자 크기 조절");
    box.innerHTML =
      '<button type="button" class="fs-down" aria-label="글자 작게" title="글자 작게">가−</button>' +
      '<button type="button" class="fs-now" aria-label="글자 크기 기본으로" title="눌러서 기본 크기로"></button>' +
      '<button type="button" class="fs-up" aria-label="글자 크게" title="글자 크게">가+</button>';
    box.querySelector(".fs-down").addEventListener("click", function () { step(-1); });
    box.querySelector(".fs-up").addEventListener("click", function () { step(1); });
    box.querySelector(".fs-now").addEventListener("click", function () {
      size = BASE;
      save(size);
      apply();
    });
    document.body.appendChild(box);
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
