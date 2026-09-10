/* ============================================================
   목회자 방 — 성경 각 권별 설교와 자료
   글 내용은 data/pastor-room/ 폴더의 파일에서 읽어옵니다.
   (index.json = 성경 각 권 목록, cat-번호.json = 그 권의 설교 전문)
   ============================================================ */
(function () {
  var DATA = "data/pastor-room/";
  var tabsEl = document.getElementById("prTabs");
  var booksEl = document.getElementById("prBooks");
  var panelEl = document.getElementById("prPanel");
  var panelBody = document.getElementById("prPanelBody");
  var backBtn = document.getElementById("prBack");
  var noteEl = document.getElementById("prNote");
  if (!tabsEl || !booksEl) return;

  var index = null;
  var activeGroup = null;
  var cache = {};

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function showBooks() {
    panelEl.hidden = true;
    booksEl.hidden = false;
    tabsEl.hidden = false;
  }

  function showPanel() {
    booksEl.hidden = true;
    tabsEl.hidden = true;
    panelEl.hidden = false;
    panelEl.scrollIntoView({ block: "start" });
  }

  function renderTabs() {
    tabsEl.innerHTML = index.groups.map(function (g) {
      return '<button type="button" class="pr-tab' + (g.id === activeGroup ? " active" : "") +
        '" data-group="' + g.id + '">' + esc(g.label) +
        ' <span>' + g.total + "</span></button>";
    }).join("");
  }

  function renderBooks() {
    var g = index.groups.filter(function (x) { return x.id === activeGroup; })[0];
    if (!g) return;
    booksEl.innerHTML = g.books.map(function (b) {
      if (!b.count) {
        return '<span class="pr-book empty">' + esc(b.name) + "</span>";
      }
      return '<button type="button" class="pr-book" data-no="' + b.no + '">' +
        esc(b.name) + '<span class="pr-count">' + b.count + "</span></button>";
    }).join("");
  }

  function load(no) {
    if (cache[no]) return Promise.resolve(cache[no]);
    return fetch(DATA + "cat-" + no + ".json")
      .then(function (r) {
        if (!r.ok) throw new Error("불러오지 못했습니다");
        return r.json();
      })
      .then(function (d) { cache[no] = d; return d; });
  }

  function renderList(d) {
    panelBody.innerHTML =
      '<h2 class="pr-title">' + esc(d.name) + ' <span>' + d.posts.length + "편</span></h2>" +
      '<ul class="pr-list">' +
      d.posts.map(function (p, i) {
        return '<li><button type="button" class="pr-post" data-i="' + i + '">' +
          '<span class="pr-post-title">' + esc(p.title) + "</span>" +
          '<span class="pr-post-date">' + esc(p.date) + "</span>" +
          "</button></li>";
      }).join("") +
      "</ul>";
    panelBody.setAttribute("data-view", "list");
  }

  function renderPost(d, i) {
    var p = d.posts[i];
    var prev = d.posts[i - 1], next = d.posts[i + 1];
    panelBody.innerHTML =
      '<article class="pr-article">' +
      '<p class="pr-kicker">' + esc(d.name) + "</p>" +
      "<h2>" + esc(p.title) + "</h2>" +
      '<p class="pr-date">' + esc(p.date) + "</p>" +
      p.paras.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") +
      "</article>" +
      '<div class="pr-pager">' +
      (prev ? '<button type="button" class="btn btn-outline" data-go="' + (i - 1) + '">← 이전 글</button>' : "<span></span>") +
      '<button type="button" class="btn btn-outline" data-go="list">' + esc(d.name) + " 목록</button>" +
      (next ? '<button type="button" class="btn btn-outline" data-go="' + (i + 1) + '">다음 글 →</button>' : "<span></span>") +
      "</div>";
    panelBody.setAttribute("data-view", "post");
    panelEl.scrollIntoView({ block: "start" });
  }

  tabsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".pr-tab");
    if (!b) return;
    activeGroup = b.getAttribute("data-group");
    renderTabs();
    renderBooks();
  });

  booksEl.addEventListener("click", function (e) {
    var b = e.target.closest(".pr-book[data-no]");
    if (!b) return;
    var no = b.getAttribute("data-no");
    panelBody.innerHTML = '<p class="pr-loading">불러오는 중입니다…</p>';
    showPanel();
    load(no).then(function (d) {
      panelEl.setAttribute("data-no", no);
      renderList(d);
    }).catch(function () {
      panelBody.innerHTML = '<p class="pr-loading">자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
    });
  });

  panelBody.addEventListener("click", function (e) {
    var no = panelEl.getAttribute("data-no");
    var d = cache[no];
    if (!d) return;
    var post = e.target.closest(".pr-post");
    if (post) { renderPost(d, Number(post.getAttribute("data-i"))); return; }
    var go = e.target.closest("[data-go]");
    if (go) {
      var v = go.getAttribute("data-go");
      if (v === "list") renderList(d);
      else renderPost(d, Number(v));
    }
  });

  backBtn.addEventListener("click", function () {
    if (panelBody.getAttribute("data-view") === "post") {
      var d = cache[panelEl.getAttribute("data-no")];
      if (d) { renderList(d); return; }
    }
    showBooks();
  });

  fetch(DATA + "index.json")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      index = d;
      var hash = (location.hash || "").replace("#", "");
      var match = d.groups.filter(function (g) { return g.id === hash; })[0];
      activeGroup = match ? match.id : d.groups[0].id;
      renderTabs();
      renderBooks();
      noteEl.textContent = "글 " + d.total + "편 · " + d.updated + " 기준";
    })
    .catch(function () {
      booksEl.innerHTML = '<p class="pr-loading">자료를 불러오지 못했습니다.</p>';
    });
})();
