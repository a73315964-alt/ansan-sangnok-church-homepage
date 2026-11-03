/* 예배 및 모임 안내 — 가장 최근 광고(js/news.js 맨 앞)를 부서별 모임 위에 보여줍니다. */
(function () {
  var box = document.getElementById("adText");
  var n = (window.NEWS || [])[0];
  if (!box || !n) return;
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  document.getElementById("adDate").textContent = (n.dateLabel || n.date) + " 주일 광고";
  var raw = String(n.body || "").replace(/<br\s*\/?>/gi, "\n");
  box.innerHTML = raw.split(/\n{2,}/).map(function (b) { return b.trim(); }).filter(Boolean)
    .map(function (b) { return "<p>" + esc(b).replace(/\n/g, "<br>") + "</p>"; }).join("");
})();
