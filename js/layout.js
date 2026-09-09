/* ============================================================
   상단 메뉴 / 하단 정보 — CHURCH 설정값으로 자동 생성
   메뉴 구성을 바꾸려면 아래 NAV_LINKS 를 수정하세요.
   유튜브 주소는 js/config.js 의 sns.youtube 에 넣으면 자동 반영됩니다.
   ============================================================ */
(function () {
  var C = window.CHURCH || {};
  var page = document.body.getAttribute("data-page") || "";

  // 유튜브 채널 주소 — config.js 의 sns.youtube 가 비어 있으면 유튜브 검색으로 연결됩니다.
  var YOUTUBE_URL =
    (C.sns && C.sns.youtube) ||
    "https://www.youtube.com/results?search_query=" + encodeURIComponent(C.name || "안산상록교회");

  function youtubeIcon() {
    return (
      '<svg class="yt-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
      '<path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/>' +
      "</svg>"
    );
  }

  var NAV_LINKS = [
    { href: "index.html", label: "홈", key: "home" },
    { href: "about.html", label: "교회소개", key: "about" },
    { href: "worship.html", label: "예배안내", key: "worship" },
    { href: "location.html", label: "오시는길", key: "location" },
    { href: "bulletin.html", label: "주보", key: "bulletin" },
    { href: "sermon.html", label: "생명의 말씀", key: "sermon" },
    { href: "word.html", label: "성경속으로", key: "word" },
    { href: "library.html", label: "도서관", key: "library" },
    { href: "news.html", label: "공지사항", key: "news" },
  ];
  // 유튜브는 상단 메뉴 대신 "생명의 말씀"(sermon.html) 페이지 안에 임베드되어 있습니다.
  // 다시 상단 메뉴에 노출하려면 아래 줄의 주석을 해제하세요.
  // NAV_LINKS.splice(6, 0, { href: YOUTUBE_URL, label: "유튜브", key: "youtube", external: true, icon: youtubeIcon });

  function navLinkHtml(l, extraClass) {
    var cls = [];
    if (l.key === page) cls.push("active");
    if (l.external) cls.push("nav-youtube");
    if (extraClass) cls.push(extraClass);
    return (
      '<a href="' + l.href + '"' +
      (cls.length ? ' class="' + cls.join(" ") + '"' : "") +
      (l.external ? ' target="_blank" rel="noopener"' : "") +
      ">" + (l.icon ? l.icon() : "") + l.label + "</a>"
    );
  }

  function markIcon() {
    return (
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' +
      '<polygon points="0,0 58,0 46,50 58,100 0,100" fill="#29b6f6"/>' +
      '<polygon points="100,0 58,0 46,50 58,100 100,100" fill="#8bc34a"/>' +
      '<rect x="43" y="12" width="14" height="76" fill="#ffffff"/>' +
      '<rect x="22" y="43" width="56" height="14" fill="#ffffff"/>' +
      "</svg>"
    );
  }

  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;
    var links = NAV_LINKS.map(function (l) { return navLinkHtml(l); }).join("");

    el.innerHTML =
      '<div class="wrap">' +
      '<a href="index.html" class="brand"><span class="mark">' + markIcon() + '</span>' +
      "<span>" + C.name + "<small>" + (C.englishName || "") + "</small></span></a>" +
      '<nav class="nav-desktop">' + links + "</nav>" +
      '<div class="header-cta">' +
      '<a class="btn btn-outline" href="location.html">오시는 길</a>' +
      '<a class="btn btn-primary" href="worship.html">예배 안내</a>' +
      "</div>" +
      '<button class="nav-toggle" id="navToggle" aria-label="메뉴 열기"><span></span></button>' +
      "</div>" +
      '<nav class="nav-mobile" id="navMobile">' + links + '<a href="location.html">오시는 길</a></nav>';

    var toggle = document.getElementById("navToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        document.body.classList.toggle("nav-open");
      });
    }
  }

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    var worshipLines = (C.worship || []).slice(0, 4).map(function (w) {
      return "<li>" + w.name + " · " + w.time + "</li>";
    }).join("");

    el.innerHTML =
      '<div class="wrap">' +
      '<div class="footer-grid">' +
      "<div>" +
      '<div class="footer-brand"><span class="mark" style="width:32px;height:32px;">' + markIcon() + "</span>" + C.name + "</div>" +
      "<p>" + (C.address || "") + "</p>" +
      "<p>" + (C.phone ? "전화 " + C.phone : "") + (C.email ? " · " + C.email : "") + "</p>" +
      "</div>" +
      "<div><h4>바로가기</h4><ul>" +
      NAV_LINKS.map(function (l) { return "<li>" + navLinkHtml(l) + "</li>"; }).join("") +
      "</ul></div>" +
      "<div><h4>예배 시간</h4><ul>" + worshipLines + "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom">' +
      "<span>&copy; " + new Date().getFullYear() + " " + C.name + ". All rights reserved.</span>" +
      "<span>" + (C.pastorTitle || "담임목사") + " " + (C.pastor || "") + "</span>" +
      "</div>" +
      "</div>";
  }

  renderHeader();
  renderFooter();
})();
