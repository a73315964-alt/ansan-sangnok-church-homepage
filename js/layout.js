/* ============================================================
   상단 메뉴 / 하단 정보 — CHURCH 설정값으로 자동 생성
   메뉴 구성을 바꾸려면 아래 NAV_LINKS 를 수정하세요.
   ============================================================ */
(function () {
  var NAV_LINKS = [
    { href: "index.html", label: "홈", key: "home" },
    { href: "about.html", label: "교회소개", key: "about" },
    { href: "worship.html", label: "예배안내", key: "worship" },
    { href: "location.html", label: "오시는길", key: "location" },
    { href: "bulletin.html", label: "주보", key: "bulletin" },
    { href: "sermon.html", label: "설교", key: "sermon" },
    { href: "news.html", label: "공지사항", key: "news" },
  ];

  var C = window.CHURCH || {};
  var page = document.body.getAttribute("data-page") || "";

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
    var links = NAV_LINKS.map(function (l) {
      return '<a href="' + l.href + '" class="' + (l.key === page ? "active" : "") + '">' + l.label + "</a>";
    }).join("");

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
      NAV_LINKS.map(function (l) { return '<li><a href="' + l.href + '">' + l.label + "</a></li>"; }).join("") +
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
