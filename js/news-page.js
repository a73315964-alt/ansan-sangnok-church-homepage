/* ============================================================
   교회 소식 및 게시판 — 날짜 목록만 보여주고, 누르면 내용이 펼쳐집니다.
   소식 내용은 js/news.js 에서 읽어옵니다.
   ============================================================ */
(function () {
  var host = document.getElementById("newsBoard");
  if (!host) return;

  var items = window.NEWS || [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  if (!items.length) {
    host.innerHTML = '<div class="empty-state">등록된 소식이 없습니다.</div>';
    return;
  }

  host.innerHTML =
    '<ul class="nb-list">' +
    items.map(function (n, i) {
      // 소식 본문은 <br> 로 줄을 나눠 적습니다. 줄바꿈만 살리고 나머지는 글자로 처리합니다.
      var raw = String(n.body || "").replace(/<br\s*\/?>/gi, "\n");
      var body = raw.split(/\n{2,}/)
        .map(function (b) { return b.trim(); })
        .filter(Boolean)
        .map(function (b) { return "<p>" + esc(b).replace(/\n/g, "<br>") + "</p>"; })
        .join("");
      return (
        "<li>" +
        '<button type="button" class="nb-row" aria-expanded="false" data-i="' + i + '">' +
        '<span class="nb-date">' + esc(n.dateLabel || n.date) + "</span>" +
        '<span class="nb-title">' + esc(n.title) + "</span>" +
        '<span class="nb-caret" aria-hidden="true"></span>' +
        "</button>" +
        '<div class="nb-body" data-body="' + i + '">' +
        (body || "<p>내용이 없습니다.</p>") +
        "</div>" +
        "</li>"
      );
    }).join("") +
    "</ul>";

  host.addEventListener("click", function (e) {
    var btn = e.target.closest(".nb-row");
    if (!btn) return;
    var body = host.querySelector('[data-body="' + btn.getAttribute("data-i") + '"]');
    var open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", open ? "false" : "true");
    if (body) body.classList.toggle("open", !open);
  });
})();
