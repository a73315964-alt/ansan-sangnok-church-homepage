/* ============================================================
   상단 메뉴 / 하단 정보 — CHURCH 설정값으로 자동 생성
   메뉴 구성을 바꾸려면 아래 NAV 를 수정하세요.
     label : 화면에 보이는 이름
     href  : 연결할 주소
     groups: 마우스를 올리면 펼쳐지는 서브메뉴 (제목 + items)
   유튜브 주소는 js/config.js 의 sns.youtube 에 넣으면 자동 반영됩니다.
   ============================================================ */
(function () {
  var C = window.CHURCH || {};
  var page = document.body.getAttribute("data-page") || "";

  var YOUTUBE_URL =
    (C.sns && C.sns.youtube) ||
    "https://www.youtube.com/results?search_query=" + encodeURIComponent(C.name || "안산상록교회");

  var NAV = [
    {
      key: "home", label: "홈", href: "index.html",
      groups: [
        { label: "환영사", href: "index.html#welcome" },
        { label: "주일 설교", href: "sermon.html" },
        { label: "주보", href: "bulletin.html" },
        { label: "성경 속으로", href: "word.html", items: [
          { label: "생명의 삶", href: "word.html#dailyReadingWrap" },
          { label: "성경 읽어주기", href: "word.html#dailyReadingWrap" },
          { label: "묵상의 글", href: "word.html#dawnPrayerWrap" },
          { label: "성경 읽기", href: "word.html#archive" },
          { label: "성경 전권 읽기 안내표", href: "word.html#archive" }
        ] },
        { label: "새가족 등록", href: "worship.html#newcomer" },
        { label: "예배시간 안내", href: "worship.html" }
      ]
    },
    {
      key: "about", label: "교회소개", href: "about.html",
      groups: [
        { label: "인사말", href: "about.html#greeting" },
        { label: "비전", href: "about.html#vision" },
        { label: "섬기는 사람들", href: "about.html#people", items: [
          { label: "담임목사", href: "about.html#pastor" },
          { label: "장로 및 권사", href: "about.html#people" },
          { label: "안수집사", href: "about.html#people" }
        ] },
        { label: "교회와 역사", href: "about.html#history", items: [
          { label: "연혁", href: "about.html#history" },
          { label: "장로교회란?", href: "about.html#presbyterian" }
        ] },
        { label: "예배안내", href: "worship.html", items: [
          { label: "주일 낮", href: "worship.html" },
          { label: "주일 오후", href: "worship.html" },
          { label: "수요예배", href: "worship.html" },
          { label: "금요기도회", href: "worship.html" }
        ] },
        { label: "오시는 길", href: "location.html" },
        { label: "처음 오셨나요", href: "worship.html#newcomer" }
      ]
    },
    {
      key: "sermon", label: "생명의 말씀", href: "sermon.html",
      groups: [
        { label: "주일 낮 설교", href: "sermon.html", items: [
          { label: "유튜브 생방송", href: YOUTUBE_URL, external: true }
        ] },
        { label: "주일 오후 설교", href: "sermon.html" },
        { label: "수요 예배", href: "sermon.html" },
        { label: "세미나", href: "sermon.html#seminar", items: [
          { label: "특강 및 세미나", href: "sermon.html#seminar" },
          { label: "사도신경을 왜 고백하는가", href: "sermon.html#seminar" }
        ] },
        { label: "주보에 실린 말씀의 창", href: "word-window.html", items: [
          { label: "2020년 설교 요약", href: "word-window.html?y=2020" }
        ] },
        { label: "목회자 방", href: "pastor-room.html", items: [
          { label: "설교 방 · 구약", href: "pastor-room.html#ot" },
          { label: "설교 방 · 신약", href: "pastor-room.html#nt" },
          { label: "그 외 자료", href: "pastor-room.html#etc" }
        ] }
      ]
    },
    {
      key: "education", label: "교육과 양육", href: "education.html",
      groups: [
        { label: "새 가족 소개", href: "education.html#newfamily" },
        { label: "새 가족반", href: "education.html#newfamily-class" },
        { label: "양육과정 소개", href: "education.html#training", items: [
          { label: "제자훈련", href: "education.html#training" }
        ] },
        { label: "도서관", href: "library.html", items: [
          { label: "이달의 책", href: "library.html" },
          { label: "디지털 도서", href: "library.html" }
        ] },
        { label: "바른 신앙을 위하여", href: "faith.html" },
        { label: "궁금해요", href: "education.html#qna", items: [
          { label: "성경에 대한 궁금증", href: "education.html#qna" }
        ] }
      ]
    },
    {
      key: "cult", label: "이단 예방과 회복", href: "cult.html",
      groups: [
        { label: "경계해야 할 이단", href: "cult.html#watch", items: [
          { label: "각종 이단에 대한 자료", href: "cult.html#watch" },
          { label: "구원파", href: "cult.html#watch" },
          { label: "신천지", href: "sincheonji.html" },
          { label: "여호와의 증인", href: "cult.html#watch" },
          { label: "안식교", href: "cult.html#watch" },
          { label: "하나님의 교회", href: "cult.html#watch" },
          { label: "JMS(정명석)", href: "cult.html#watch" }
        ] },
        { label: "최근 이단의 동향", href: "cult.html#trend" },
        { label: "안산이단상담소", href: "cult.html#center", items: [
          { label: "소개", href: "cult.html#center" },
          { label: "사역", href: "cult.html#center" },
          { label: "상담안내", href: "cult.html#center" }
        ] },
        { label: "탈퇴자 간증", href: "cult.html#testimony" }
      ]
    },
    {
      key: "community", label: "우리들의 이야기", href: "community.html",
      groups: [
        { label: "금주의 소식", href: "news.html", items: [
          { label: "공지사항", href: "news.html" },
          { label: "중보 기도 제목", href: "news.html" }
        ] },
        { label: "남 전도회", href: "community.html#men", items: [
          { label: "기관 소개", href: "community.html#men" },
          { label: "갤러리", href: "community.html#gallery" }
        ] },
        { label: "1 여전도회", href: "community.html#women1", items: [
          { label: "기관 소개", href: "community.html#women1" }
        ] },
        { label: "2 여전도회", href: "community.html#women2", items: [
          { label: "기관 소개", href: "community.html#women2" },
          { label: "갤러리", href: "community.html#gallery" }
        ] },
        { label: "대학 · 청년부", href: "community.html#youth", items: [
          { label: "기관 소개", href: "community.html#youth" },
          { label: "갤러리", href: "community.html#gallery" }
        ] },
        { label: "내가 만난 하나님(간증)", href: "community.html#testimony", items: [
          { label: "장로님", href: "community.html#testimony" },
          { label: "권사님", href: "community.html#testimony" }
        ] },
        { label: "갤러리", href: "community.html#gallery" }
      ]
    }
  ];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function anchor(node, cls) {
    return (
      '<a href="' + esc(node.href) + '"' +
      (cls ? ' class="' + cls + '"' : "") +
      (node.external ? ' target="_blank" rel="noopener"' : "") +
      ">" + esc(node.label) + "</a>"
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

  function groupHtml(g) {
    var sub = (g.items || []).map(function (it) {
      return "<li>" + anchor(it) + "</li>";
    }).join("");
    return (
      '<div class="mega-group">' +
      anchor(g, "mega-title") +
      (sub ? '<ul class="mega-list">' + sub + "</ul>" : "") +
      "</div>"
    );
  }

  function desktopItemHtml(top) {
    var cls = "nav-item" + (top.key === page ? " active" : "");
    // 항목이 적은 메뉴는 2단, 많으면 3단으로 펼쳐 빈 칸이 생기지 않게 합니다.
    var cols = (top.groups || []).length <= 4 ? 2 : 3;
    var panel = top.groups
      ? '<div class="mega" style="width:min(92vw,' + (cols === 2 ? 400 : 560) + 'px)">' +
        '<div class="mega-inner" style="column-count:' + cols + '">' +
        top.groups.map(groupHtml).join("") +
        "</div></div>"
      : "";
    return (
      '<div class="' + cls + '">' +
      '<a href="' + esc(top.href) + '" class="nav-top">' + esc(top.label) + "</a>" +
      panel +
      "</div>"
    );
  }

  function mobileItemHtml(top, i) {
    var sub = (top.groups || []).map(function (g) {
      var items = (g.items || []).map(function (it) {
        return "<li>" + anchor(it) + "</li>";
      }).join("");
      return (
        '<div class="m-group">' +
        anchor(g, "m-title") +
        (items ? "<ul>" + items + "</ul>" : "") +
        "</div>"
      );
    }).join("");

    return (
      '<div class="m-item' + (top.key === page ? " active" : "") + '">' +
      '<button class="m-top" type="button" aria-expanded="false" data-acc="' + i + '">' +
      esc(top.label) +
      '<span class="m-caret" aria-hidden="true"></span>' +
      "</button>" +
      '<div class="m-panel" data-panel="' + i + '">' +
      '<a class="m-all" href="' + esc(top.href) + '">' + esc(top.label) + " 전체 보기</a>" +
      sub +
      "</div>" +
      "</div>"
    );
  }

  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;

    el.innerHTML =
      '<div class="wrap">' +
      '<a href="index.html" class="brand"><span class="mark">' + markIcon() + "</span>" +
      "<span>" + esc(C.name || "") + "<small>" + esc(C.englishName || "") + "</small></span></a>" +
      '<nav class="nav-desktop">' + NAV.map(desktopItemHtml).join("") + "</nav>" +
      '<div class="header-cta">' +
      '<a class="btn btn-primary" href="worship.html">예배 안내</a>' +
      "</div>" +
      '<button class="nav-toggle" id="navToggle" aria-label="메뉴 열기" aria-expanded="false"><span></span></button>' +
      "</div>" +
      '<nav class="nav-mobile" id="navMobile">' +
      NAV.map(mobileItemHtml).join("") +
      '<a class="m-direct" href="location.html">오시는 길</a>' +
      "</nav>";

    var toggle = document.getElementById("navToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var mobile = document.getElementById("navMobile");
    if (mobile) {
      mobile.addEventListener("click", function (e) {
        var btn = e.target.closest(".m-top");
        if (!btn) return;
        var panel = mobile.querySelector('[data-panel="' + btn.getAttribute("data-acc") + '"]');
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        if (panel) panel.classList.toggle("open", !open);
      });
    }
  }

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;

    var worshipLines = (C.worship || []).slice(0, 5).map(function (w) {
      return "<li>" + esc(w.name) + " · " + esc(w.time) + "</li>";
    }).join("");

    var cols = NAV.map(function (top) {
      var items = (top.groups || []).slice(0, 6).map(function (g) {
        return "<li>" + anchor(g) + "</li>";
      }).join("");
      return "<div><h4>" + anchor(top) + "</h4><ul>" + items + "</ul></div>";
    }).join("");

    el.innerHTML =
      '<div class="wrap">' +
      '<div class="footer-sitemap">' + cols + "</div>" +
      '<div class="footer-grid">' +
      "<div>" +
      '<div class="footer-brand"><span class="mark" style="width:32px;height:32px;">' + markIcon() + "</span>" + esc(C.name || "") + "</div>" +
      "<p>" + esc(C.address || "") + "</p>" +
      "<p>" + (C.phone ? "전화 " + esc(C.phone) : "") + (C.email ? " · " + esc(C.email) : "") + "</p>" +
      "</div>" +
      "<div><h4>예배 시간</h4><ul>" + worshipLines + "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom">' +
      "<span>&copy; " + new Date().getFullYear() + " " + esc(C.name || "") + ". All rights reserved.</span>" +
      "<span>" + esc(C.pastorTitle || "담임목사") + " " + esc(C.pastor || "") + "</span>" +
      "</div>" +
      "</div>";
  }

  renderHeader();
  renderFooter();
})();
