/* 새벽기도 말씀 묵상 아래 — 장년부 / 청년부 나눔방
   DB: SQL실행하기/11_devotion_shares.sql */
(function () {
  var ROOMS = [
    { key: "adult", label: "장년부 나눔방" },
    { key: "youth", label: "청년부 나눔방" },
  ];
  var MAX = 500;
  var host, day, room, me = null, isAdmin = false, canWrite = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function when(iso) {
    var d = new Date(iso);
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일 " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function savedRoom() {
    try { return localStorage.getItem("shareRoom") === "youth" ? "youth" : "adult"; } catch (e) { return "adult"; }
  }

  function remember(k) {
    try { localStorage.setItem("shareRoom", k); } catch (e) {}
  }

  function shell() {
    host.innerHTML =
      '<div class="share-head"><h4>은혜 나눔</h4><p>오늘 말씀에서 받은 은혜를 짧게 나눠 주세요.</p></div>' +
      '<div class="share-tabs" role="tablist">' +
      ROOMS.map(function (r) {
        return '<button type="button" role="tab" class="share-tab" data-room="' + r.key + '">' + r.label + "</button>";
      }).join("") +
      "</div>" +
      '<div class="share-panel" role="tabpanel" id="sharePanel"></div>';
    host.querySelectorAll(".share-tab").forEach(function (b) {
      b.addEventListener("click", async function () {
        await refreshUser();
        select(b.getAttribute("data-room"));
      });
    });
  }

  function select(k) {
    room = k;
    remember(k);
    host.querySelectorAll(".share-tab").forEach(function (b) {
      var on = b.getAttribute("data-room") === k;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    load();
  }

  function panel(html) {
    document.getElementById("sharePanel").innerHTML = html;
  }

  function notice(text, link) {
    panel('<div class="share-notice"><p>' + text + "</p>" + (link || "") + "</div>");
  }

  function formHtml() {
    var label = ROOMS.filter(function (r) { return r.key === room; })[0].label;
    return (
      '<form class="share-form" id="shareForm">' +
      '<textarea id="shareText" maxlength="' + MAX + '" rows="3" placeholder="' + label + '에 은혜 받은 것을 남겨 주세요." required></textarea>' +
      '<div class="share-form-foot"><span class="share-count" id="shareCount">0 / ' + MAX + "</span>" +
      '<button type="submit" class="btn btn-primary share-submit">나누기</button></div>' +
      "</form>"
    );
  }

  var hearts = {}, heartsOk = true;
  function heartHtml(r, mine) {
    if (!heartsOk) return "";
    var h = hearts[r.id] || { n: 0, me: false };
    if (mine) return h.n ? '<div class="share-heart-row"><span class="share-heart static">♥ ' + h.n + "</span></div>" : "";
    return '<div class="share-heart-row"><button type="button" class="share-heart' + (h.me ? " on" : "") +
      '" data-id="' + r.id + '" aria-pressed="' + (h.me ? "true" : "false") + '" aria-label="하트">' +
      (h.me ? "♥" : "♡") + (h.n ? " " + h.n : "") + "</button></div>";
  }

  async function loadHearts(rows) {
    rows.forEach(function (r) { hearts[r.id] = { n: 0, me: false }; });
    if (!rows.length) return;
    var hr = await window.SB.from("devotion_share_hearts").select("share_id, user_id")
      .in("share_id", rows.map(function (r) { return r.id; }));
    if (hr.error) { heartsOk = false; return; }
    heartsOk = true;
    (hr.data || []).forEach(function (x) {
      var h = hearts[x.share_id];
      if (!h) return;
      h.n++; if (me && x.user_id === me.id) h.me = true;
    });
  }

  function listHtml(rows) {
    if (!rows.length) return '<div class="share-empty">아직 나눔이 없습니다. 첫 은혜를 나눠 주세요.</div>';
    return '<ul class="share-list">' + rows.map(function (r) {
      var mine = me && r.user_id === me.id;
      return (
        '<li class="share-item">' +
        '<div class="share-meta"><strong>' + esc(r.author_name || "성도") + "</strong><span>" + when(r.created_at) + "</span>" +
        (mine || isAdmin ? '<button type="button" class="share-del" data-id="' + r.id + '">삭제</button>' : "") +
        "</div>" +
        "<p>" + esc(r.content) + "</p>" + heartHtml(r, mine) +
        "</li>"
      );
    }).join("") + "</ul>";
  }

  async function load() {
    if (!me) {
      notice("나눔방은 로그인한 성도만 볼 수 있습니다.",
        '<a class="btn btn-primary" href="login.html?next=' + encodeURIComponent("today-word.html") + '">로그인하고 나누기</a>');
      return;
    }
    if (!canWrite && !isAdmin) {
      notice("정회원 인증이 끝나면 나눔방에 참여할 수 있습니다.", '<a class="btn btn-outline" href="mypage.html">내 정보 보기</a>');
      return;
    }
    var current = room;
    var adminOnly = '<div class="share-notice"><p>정회원 인증이 끝나면 나눔을 쓸 수 있습니다.</p></div>';
    panel((canWrite ? formHtml() : adminOnly) +'<div id="shareList"><div class="share-empty">불러오는 중…</div></div>');
    bindForm();
    var res = await window.SB.from("devotion_shares")
      .select("id, user_id, author_name, content, created_at")
      .eq("devotion_date", day).eq("room", current)
      .order("created_at", { ascending: false });
    if (current !== room) return;
    var list = document.getElementById("shareList");
    if (res.error) {
      list.innerHTML = '<div class="share-empty">나눔방을 준비하고 있습니다.</div>';
      return;
    }
    var rows = res.data || [];
    await loadHearts(rows);
    if (current !== room) return;
    list.innerHTML = listHtml(rows);
    list.querySelectorAll(".share-heart[data-id]").forEach(function (b) {
      b.addEventListener("click", function () { toggleHeart(b); });
    });
    list.querySelectorAll(".share-del").forEach(function (b) {
      b.addEventListener("click", function () { remove(b.getAttribute("data-id")); });
    });
  }

  function bindForm() {
    var form = document.getElementById("shareForm");
    if (!form) return;
    var text = document.getElementById("shareText");
    var count = document.getElementById("shareCount");
    text.addEventListener("input", function () { count.textContent = text.value.length + " / " + MAX; });
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var content = text.value.trim();
      if (!content) return;
      var btn = form.querySelector("button");
      btn.disabled = true;
      var res = await window.SB.from("devotion_shares").insert({ devotion_date: day, room: room, content: content });
      btn.disabled = false;
      if (res.error) {
        alert("나눔을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      window.dispatchEvent(new Event("talent-refresh"));
      load();
    });
  }

  async function toggleHeart(b) {
    if (!canWrite || b.disabled) return;
    var id = +b.getAttribute("data-id");
    var h = hearts[id] || (hearts[id] = { n: 0, me: false });
    b.disabled = true;
    var res = h.me
      ? await window.SB.from("devotion_share_hearts").delete().eq("share_id", id).eq("user_id", me.id)
      : await window.SB.from("devotion_share_hearts").insert({ share_id: id });
    b.disabled = false;
    if (res.error) { alert("하트를 남기지 못했습니다. 잠시 후 다시 시도해 주세요."); return; }
    h.me = !h.me; h.n += h.me ? 1 : -1;
    b.classList.toggle("on", h.me);
    b.setAttribute("aria-pressed", h.me ? "true" : "false");
    b.textContent = (h.me ? "♥" : "♡") + (h.n ? " " + h.n : "");
  }

  async function remove(id) {
    if (!confirm("이 나눔을 삭제할까요?")) return;
    var res = await window.SB.from("devotion_shares").delete().eq("id", id);
    if (res.error) {
      alert("삭제하지 못했습니다.");
      return;
    }
    load();
  }

  // 탭을 누를 때마다 지금 로그인한 사람과 정회원 여부를 새로 확인
  // (같은 폰에서 다른 사람이 로그인했거나 뒤로가기로 돌아온 화면에서도 글쓰기 창이 열리도록)
  async function refreshUser() {
    var session = await sbCurrentSession();
    if (!session) {
      me = null; isAdmin = false; canWrite = false;
      return;
    }
    var results = await Promise.all([sbMyProfile(), sbIsAdmin()]);
    var profile = results[0];
    me = session.user;
    isAdmin = results[1];
    canWrite = !!(profile && profile.approved && !profile.suspended);
  }

  /* ---- 지난 묵상: 그날의 나눔 글 보기 (읽기 + 하트) ---- */
  function mountPast(entry) {
    var body = entry.querySelector(".history-body");
    var date = entry.getAttribute("data-date");
    if (!body || !date || body.querySelector(".share-past")) return;
    var box = document.createElement("div");
    box.className = "share-past";
    box.innerHTML =
      '<div class="share-head"><h4>그날의 은혜 나눔</h4></div>' +
      '<div class="share-tabs">' + ROOMS.map(function (r, i) {
        return '<button type="button" class="share-tab' + (i === 0 ? " active" : "") + '" data-room="' + r.key + '">' + r.label + "</button>";
      }).join("") + '</div><div class="share-past-list"></div>';
    body.appendChild(box);
    var listEl = box.querySelector(".share-past-list");
    async function loadPast(rm) {
      if (!me) {
        listEl.innerHTML = '<div class="share-empty">로그인한 성도만 볼 수 있습니다. <a href="login.html?next=' + encodeURIComponent("today-word.html") + '">로그인</a></div>';
        return;
      }
      if (!canWrite && !isAdmin) { listEl.innerHTML = '<div class="share-empty">정회원 인증이 끝나면 볼 수 있습니다.</div>'; return; }
      listEl.innerHTML = '<div class="share-empty">불러오는 중…</div>';
      var res = await window.SB.from("devotion_shares")
        .select("id, user_id, author_name, content, created_at")
        .eq("devotion_date", date).eq("room", rm).order("created_at", { ascending: true });
      if (res.error) { listEl.innerHTML = '<div class="share-empty">나눔을 불러오지 못했습니다.</div>'; return; }
      var rows = res.data || [];
      await loadHearts(rows);
      listEl.innerHTML = listHtml(rows);
      listEl.querySelectorAll(".share-del").forEach(function (b) { b.remove(); });
      listEl.querySelectorAll(".share-heart[data-id]").forEach(function (b) {
        b.addEventListener("click", function () { toggleHeart(b); });
      });
    }
    box.querySelectorAll(".share-tab").forEach(function (b) {
      b.addEventListener("click", async function () {
        box.querySelectorAll(".share-tab").forEach(function (x) { x.classList.toggle("active", x === b); });
        await refreshUser();
        loadPast(b.getAttribute("data-room"));
      });
    });
    refreshUser().then(function () { loadPast("adult"); });
  }

  async function init() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".history-item");
      if (!btn) return;
      var entry = btn.closest(".history-entry");
      if (entry && window.SB_READY) mountPast(entry);
    });
    host = document.getElementById("devotionShare");
    var today = (window.DAWN_PRAYER || [])[0];
    if (!host || !today || !window.SB_READY) return;
    day = today.date;
    shell();
    room = savedRoom();
    await refreshUser();
    select(room);
    // 로그인한 사람이 바뀌었을 때만 다시 그림 (쓰던 글이 지워지지 않게)
    window.SB.auth.onAuthStateChange(function (event, session) {
      var id = session ? session.user.id : null;
      if (id === (me ? me.id : null)) return;
      setTimeout(function () { refreshUser().then(function () { select(room); }); }, 0);
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) refreshUser().then(function () { select(room); });
    });
  }

  init();
})();
