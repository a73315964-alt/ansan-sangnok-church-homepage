/* ============================================================
   생명의 말씀 (sermon.html) — 유튜브, 각 권 설교란(탭), 주일 설교문
   ============================================================ */
(function () {
  var activeBook = "전체";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* 금주의 말씀 — 맨 앞(최신) 설교를 제목·본문과 함께 전문으로 보여줍니다 */
  function renderThisWeek() {
    var host = document.getElementById("thisWeekBox");
    if (!host) return;
    var s = (window.SERMONS || [])[0];
    if (!s) {
      host.innerHTML = '<div class="empty-state">등록된 설교가 없습니다.</div>';
      return;
    }

    var body = "";
    if (s.manuscript) {
      body = s.manuscript.split("\n").map(function (line) {
        var t = line.trim();
        if (!t) return "";
        // 서론 / 결론 / "1." 로 시작하는 줄은 소제목으로 봅니다
        if (/^(서\s*론|결\s*론)$/.test(t) || /^\d+\.\s/.test(t)) {
          return '<h3 class="tw-head">' + esc(t) + "</h3>";
        }
        return "<p>" + esc(t) + "</p>";
      }).join("");
    } else {
      body = "<p>설교문은 준비 중입니다.</p>";
    }

    host.innerHTML =
      '<article class="lec">' +
      '<header class="lec-head">' +
      '<p class="lec-kicker">' + esc(s.dateLabel) + " · " + esc(s.series || "주일예배") + "</p>" +
      "<h2>" + esc(s.title) + "</h2>" +
      '<p class="lec-meta">본문 ' + esc(s.scripture) + " &nbsp;·&nbsp; " + esc(s.preacher) + "</p>" +
      "</header>" +
      (s.summary ? '<div class="lec-goal"><p>' + esc(s.summary) + "</p></div>" : "") +
      '<div class="faith-intro">' + body + "</div>" +
      "</article>";
  }

  function renderYoutube() {
    var host = document.getElementById("ytFeature");
    if (!host) return;
    var list = window.SERMONS || [];
    var latest = list.length ? list[0] : null;
    var C = window.CHURCH || {};
    var channelUrl = (C.sns && C.sns.youtube) ||
      "https://www.youtube.com/results?search_query=" + encodeURIComponent(C.name || "안산상록교회");

    var videoHtml = latest && latest.youtube
      ? '<div class="video-frame"><iframe src="https://www.youtube.com/embed/' + esc(latest.youtube) +
        '" title="' + esc(latest.title) + '" allowfullscreen loading="lazy"></iframe></div>'
      : '<div class="video-frame"><div class="video-empty">🎥 최신 설교 영상은 준비 중입니다</div></div>';

    host.innerHTML =
      '<div class="yt-section">' +
      videoHtml +
      '<div class="yt-side">' +
      "<h3>" + esc(C.name || "") + " 유튜브 채널</h3>" +
      "<p>지난 설교와 교회 소식을 유튜브에서도 만나보실 수 있습니다.</p>" +
      '<a class="btn btn-primary" target="_blank" rel="noopener" href="' + channelUrl + '">유튜브 채널 바로가기 →</a>' +
      "</div>" +
      "</div>";
  }

  function bookList() {
    var set = [];
    (window.SERMONS || []).forEach(function (s) {
      var b = s.book || "기타";
      if (set.indexOf(b) === -1) set.push(b);
    });
    return set;
  }

  function renderTabs() {
    var host = document.getElementById("bookTabs");
    if (!host) return;
    var books = ["전체"].concat(bookList());
    host.innerHTML = books.map(function (b) {
      return '<button type="button" class="tab-btn' + (b === activeBook ? " active" : "") +
        '" data-book="' + esc(b) + '">' + esc(b) + "</button>";
    }).join("");
    host.querySelectorAll(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeBook = btn.getAttribute("data-book");
        renderTabs();
        renderArchive();
      });
    });
  }

  function renderArchive() {
    var host = document.getElementById("sermonArchive");
    if (!host) return;
    var list = window.SERMONS || [];
    var filtered = activeBook === "전체" ? list : list.filter(function (s) { return (s.book || "기타") === activeBook; });

    if (!filtered.length) {
      host.innerHTML = '<div class="empty-state">등록된 설교가 없습니다.</div>';
      return;
    }

    host.innerHTML = filtered.map(function (s, i) {
      var mid = "ms-" + i;
      var manuscriptHtml = s.manuscript
        ? '<div class="manuscript-inner">' + esc(s.manuscript) + "</div>"
        : '<div class="manuscript-inner">설교문이 아직 등록되지 않았습니다.</div>';
      return (
        '<div class="card sermon-archive-item">' +
        '<div class="meta">' + esc(s.dateLabel) + " · " + esc(s.series || "주일예배") + "</div>" +
        "<h3>" + esc(s.title) + "</h3>" +
        '<div class="scripture">' + esc(s.scripture) + " · " + esc(s.preacher) + "</div>" +
        (s.summary ? "<p>" + esc(s.summary) + "</p>" : "") +
        '<button class="manuscript-toggle" data-ms="' + mid + '" type="button">' +
        '<span class="arrow">▾</span> 설교문 보기</button>' +
        '<div class="manuscript" id="' + mid + '">' + manuscriptHtml + "</div>" +
        "</div>"
      );
    }).join("");

    host.querySelectorAll(".manuscript-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var body = document.getElementById(btn.getAttribute("data-ms"));
        if (!body) return;
        var open = body.classList.toggle("open");
        btn.classList.toggle("open", open);
        btn.innerHTML = '<span class="arrow">▾</span> ' + (open ? "설교문 접기" : "설교문 보기");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderThisWeek();
    renderYoutube();
    renderTabs();
    renderArchive();
  });
})();
