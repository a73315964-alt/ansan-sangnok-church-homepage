/* 바른 신앙의 길잡이 각 과 맨 아래 — "은혜 한마디" 버튼과 나눔
   DB: SQL실행하기/15_faith_shares.sql */
(function () {
  var MAX = 500;
  var host, panel, lesson, me = null, isAdmin = false, canWrite = false, ready = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function when(iso) {
    var d = new Date(iso);
    return d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate() + " " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function show(html) {
    panel.innerHTML = html;
  }

  function notice(text, link) {
    show('<div class="share-notice"><p>' + text + "</p>" + (link || "") + "</div>");
  }

  function formHtml() {
    return (
      '<form class="share-form" id="faithShareForm">' +
      '<textarea id="faithShareText" maxlength="' + MAX + '" rows="3" placeholder="이 과를 통해 받은 은혜를 한마디로 남겨 주세요." required></textarea>' +
      '<div class="share-form-foot"><span class="share-count" id="faithShareCount">0 / ' + MAX + "</span>" +
      '<button type="submit" class="btn btn-primary share-submit">남기기</button></div>' +
      "</form>"
    );
  }

  function listHtml(rows) {
    if (!rows.length) return '<div class="share-empty">아직 남겨진 한마디가 없습니다. 첫 은혜를 나눠 주세요.</div>';
    return '<ul class="share-list">' + rows.map(function (r) {
      var mine = me && r.user_id === me.id;
      return (
        '<li class="share-item">' +
        '<div class="share-meta"><strong>' + esc(r.author_name || "성도") + "</strong><span>" + when(r.created_at) + "</span>" +
        (mine || isAdmin ? '<button type="button" class="share-del" data-id="' + r.id + '">삭제</button>' : "") +
        "</div>" +
        "<p>" + esc(r.content) + "</p>" +
        "</li>"
      );
    }).join("") + "</ul>";
  }

  async function load() {
    if (!window.SB_READY) {
      notice("은혜 한마디를 준비하고 있습니다.");
      return;
    }
    if (!me) {
      notice("은혜 한마디는 로그인한 성도만 볼 수 있습니다.",
        '<a class="btn btn-primary" href="login.html?next=' + encodeURIComponent("faith.html?n=" + lesson) + '">로그인하고 남기기</a>');
      return;
    }
    if (!canWrite && !isAdmin) {
      notice("정회원 인증이 끝나면 은혜 한마디를 남길 수 있습니다.", '<a class="btn btn-outline" href="mypage.html">내 정보 보기</a>');
      return;
    }
    show((canWrite ? formHtml() : "") + '<div id="faithShareList"><div class="share-empty">불러오는 중…</div></div>');
    bindForm();
    var res = await window.SB.from("faith_shares")
      .select("id, user_id, author_name, content, created_at")
      .eq("lesson_no", lesson)
      .order("created_at", { ascending: false });
    var list = document.getElementById("faithShareList");
    if (!list) return;
    if (res.error) {
      list.innerHTML = '<div class="share-empty">은혜 한마디를 준비하고 있습니다.</div>';
      return;
    }
    list.innerHTML = listHtml(res.data || []);
    list.querySelectorAll(".share-del").forEach(function (b) {
      b.addEventListener("click", function () { remove(b.getAttribute("data-id")); });
    });
  }

  function bindForm() {
    var form = document.getElementById("faithShareForm");
    if (!form) return;
    var text = document.getElementById("faithShareText");
    var count = document.getElementById("faithShareCount");
    text.addEventListener("input", function () { count.textContent = text.value.length + " / " + MAX; });
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var content = text.value.trim();
      if (!content) return;
      var btn = form.querySelector("button");
      btn.disabled = true;
      var res = await window.SB.from("faith_shares").insert({ lesson_no: lesson, content: content });
      btn.disabled = false;
      if (res.error) {
        alert("은혜 한마디를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      load();
    });
  }

  async function remove(id) {
    if (!confirm("이 한마디를 삭제할까요?")) return;
    var res = await window.SB.from("faith_shares").delete().eq("id", id);
    if (res.error) {
      alert("삭제하지 못했습니다.");
      return;
    }
    load();
  }

  async function whoAmI() {
    if (!window.SB_READY) return;
    var session = await sbCurrentSession();
    if (!session) return;
    me = session.user;
    var results = await Promise.all([sbMyProfile(), sbIsAdmin()]);
    isAdmin = results[1];
    canWrite = !!(results[0] && results[0].approved && !results[0].suspended);
  }

  function init() {
    host = document.getElementById("faithShare");
    if (!host) return;
    lesson = parseInt(host.getAttribute("data-lesson"), 10);
    if (!lesson) return;
    host.innerHTML =
      '<button type="button" class="btn btn-primary faith-share-btn" aria-expanded="false" aria-controls="faithSharePanel">' +
      '<span aria-hidden="true">🙏</span> 은혜 한마디</button>' +
      '<div class="share-panel faith-share-panel" id="faithSharePanel" hidden></div>';
    panel = document.getElementById("faithSharePanel");
    var btn = host.querySelector(".faith-share-btn");
    btn.addEventListener("click", async function () {
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open) return;
      show('<div class="share-empty">불러오는 중…</div>');
      if (!ready) ready = whoAmI();
      await ready;
      load();
    });
  }

  init();
})();
