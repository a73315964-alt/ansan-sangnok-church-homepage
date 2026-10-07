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
      b.addEventListener("click", function () { select(b.getAttribute("data-room")); });
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

  function listHtml(rows) {
    if (!rows.length) return '<div class="share-empty">아직 나눔이 없습니다. 첫 은혜를 나눠 주세요.</div>';
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
    if (!me) {
      notice("나눔방은 로그인한 성도만 볼 수 있습니다.",
        '<a class="btn btn-primary" href="login.html?next=' + encodeURIComponent("word.html") + '">로그인하고 나누기</a>');
      return;
    }
    if (!canWrite && !isAdmin) {
      notice("정회원 인증이 끝나면 나눔방에 참여할 수 있습니다.", '<a class="btn btn-outline" href="mypage.html">내 정보 보기</a>');
      return;
    }
    var current = room;
    panel((canWrite ? formHtml() : "") + '<div id="shareList"><div class="share-empty">불러오는 중…</div></div>');
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
    list.innerHTML = listHtml(res.data || []);
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
      load();
    });
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

  async function init() {
    host = document.getElementById("devotionShare");
    var today = (window.DAWN_PRAYER || [])[0];
    if (!host || !today || !window.SB_READY) return;
    day = today.date;
    shell();
    room = savedRoom();
    var session = await sbCurrentSession();
    if (session) {
      me = session.user;
      var results = await Promise.all([sbMyProfile(), sbIsAdmin()]);
      var profile = results[0];
      isAdmin = results[1];
      canWrite = !!(profile && profile.approved && !profile.suspended);
    }
    select(room);
  }

  init();
})();
