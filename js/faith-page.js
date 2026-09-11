/* ============================================================
   바른 신앙의 길잡이 — 목록과 본문 보기
   faith.html?n=2 처럼 번호를 붙이면 그 과의 본문이 열립니다.
   교육과 양육 페이지에서는 목록만 보여줍니다.
   내용은 js/faith.js 에서 읽어옵니다.
   ============================================================ */
(function () {
  var host = document.getElementById("faithBody");   // faith.html
  var index = document.getElementById("faithIndex"); // education.html
  if (!host && !index) return;

  var lessons = window.FAITH_LESSONS || [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function paras(arr) {
    return (arr || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
  }

  function listHtml() {
    if (!lessons.length) return '<div class="empty-state">아직 올라온 자료가 없습니다.</div>';
    return (
      '<ul class="faith-list">' +
      lessons.map(function (l) {
        return (
          "<li><a href=\"faith.html?n=" + l.no + "\">" +
          '<span class="faith-no">제 ' + l.no + " 과</span>" +
          '<span class="faith-text"><strong>' + esc(l.title) + "</strong>" +
          (l.subtitle ? "<em>" + esc(l.subtitle) + "</em>" : "") + "</span>" +
          '<span class="faith-go" aria-hidden="true">›</span>' +
          "</a></li>"
        );
      }).join("") +
      "</ul>"
    );
  }

  function renderLesson(l) {
    var titleEl = document.getElementById("faithTitle");
    var leadEl = document.getElementById("faithLead");
    if (titleEl) titleEl.textContent = l.title;
    if (leadEl) leadEl.textContent = "바른 신앙의 길잡이 · 제 " + l.no + " 과";
    document.title = l.title + " — 안산상록교회";

    var i = lessons.indexOf(l);
    var prev = lessons[i - 1], next = lessons[i + 1];

    host.innerHTML =
      '<article class="lec">' +
      '<header class="lec-head">' +
      '<p class="lec-kicker">바른 신앙의 길잡이 · 제 ' + l.no + " 과</p>" +
      "<h2>" + esc(l.title) + "</h2>" +
      (l.subtitle ? '<p class="lec-meta">' + esc(l.subtitle) + "</p>" : "") +
      "</header>" +
      (l.intro && l.intro.length ? '<div class="faith-intro">' + paras(l.intro) + "</div>" : "") +
      (l.sections || []).map(function (s) {
        return (
          '<section class="faith-sec">' +
          "<h3><span>" + esc(s.no) + "</span>" + esc(s.head) + "</h3>" +
          paras(s.body) +
          "</section>"
        );
      }).join("") +
      (l.closing
        ? '<div class="faith-closing"><p class="faith-closing-label">' + esc(l.closing.label) + "</p>" +
          paras(l.closing.body) + "</div>"
        : "") +
      "</article>" +
      '<nav class="faith-pager">' +
      (prev ? '<a class="btn btn-outline" href="faith.html?n=' + prev.no + '">← 제 ' + prev.no + " 과</a>" : "<span></span>") +
      '<a class="btn btn-outline" href="faith.html">전체 목록</a>' +
      (next ? '<a class="btn btn-outline" href="faith.html?n=' + next.no + '">제 ' + next.no + " 과 →</a>" : "<span></span>") +
      "</nav>";
  }

  if (index) index.innerHTML = listHtml();

  if (host) {
    var n = parseInt((location.search.match(/[?&]n=(\d+)/) || [])[1], 10);
    var found = lessons.filter(function (l) { return l.no === n; })[0];
    if (found) renderLesson(found);
    else host.innerHTML = listHtml() + '<p class="faith-note">자료는 한 과씩 이어서 올라갑니다.</p>';
  }
})();
