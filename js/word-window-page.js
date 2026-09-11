/* ============================================================
   주보에 실린 말씀의 창 — 목록과 본문 보기
   word-window.html?y=2020&n=3 처럼 붙이면 그 글이 열립니다.
   내용은 js/word-window.js 에서 읽어옵니다.
   ============================================================ */
(function () {
  var host = document.getElementById("wwBody");
  if (!host) return;

  var years = window.WORD_WINDOW || [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function flat() {
    var all = [];
    years.forEach(function (y) {
      (y.items || []).forEach(function (it) { all.push({ y: y, it: it }); });
    });
    return all;
  }

  function renderList() {
    if (!years.length) {
      host.innerHTML = '<div class="empty-state">아직 올라온 자료가 없습니다.</div>';
      return;
    }
    host.innerHTML = years.map(function (y) {
      return (
        '<section class="ww-year">' +
        "<h2>" + esc(y.label) + ' <span>' + (y.items || []).length + "편</span></h2>" +
        '<ul class="faith-list">' +
        (y.items || []).map(function (it) {
          return (
            '<li><a href="word-window.html?y=' + y.year + "&n=" + it.no + '">' +
            '<span class="faith-no">' + esc(it.dateLabel) + "</span>" +
            '<span class="faith-text"><strong>' + esc(it.title) + "</strong>" +
            (it.ref ? "<em>" + esc(it.ref) + "</em>" : "") + "</span>" +
            '<span class="faith-go" aria-hidden="true">›</span>' +
            "</a></li>"
          );
        }).join("") +
        "</ul></section>"
      );
    }).join("") + '<p class="faith-note">해마다 이어서 올라갑니다.</p>';
  }

  function renderOne(y, it) {
    document.getElementById("wwTitle").textContent = it.title;
    document.getElementById("wwLead").textContent = "주보에 실린 말씀의 창 · " + it.dateLabel;
    document.title = it.title + " — 안산상록교회";

    var all = flat();
    var i = -1;
    all.forEach(function (e, k) { if (e.y.year === y.year && e.it.no === it.no) i = k; });
    var prev = all[i - 1], next = all[i + 1];

    function link(e, label) {
      return '<a class="btn btn-outline" href="word-window.html?y=' + e.y.year + "&n=" + e.it.no + '">' + label + "</a>";
    }

    host.innerHTML =
      '<article class="lec">' +
      '<header class="lec-head">' +
      '<p class="lec-kicker">주보에 실린 말씀의 창 · ' + esc(it.dateLabel) + "</p>" +
      "<h2>" + esc(it.title) + "</h2>" +
      (it.ref ? '<p class="lec-meta">본문 ' + esc(it.ref) + "</p>" : "") +
      "</header>" +
      '<div class="faith-intro">' +
      (it.paras || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") +
      "</div></article>" +
      '<nav class="faith-pager">' +
      (prev ? link(prev, "← 이전 글") : "<span></span>") +
      '<a class="btn btn-outline" href="word-window.html">전체 목록</a>' +
      (next ? link(next, "다음 글 →") : "<span></span>") +
      "</nav>";
  }

  var qy = parseInt((location.search.match(/[?&]y=(\d+)/) || [])[1], 10);
  var qn = parseInt((location.search.match(/[?&]n=(\d+)/) || [])[1], 10);
  var year = years.filter(function (y) { return y.year === qy; })[0];
  var item = year && (year.items || []).filter(function (i) { return i.no === qn; })[0];

  if (item) renderOne(year, item);
  else renderList();
})();
