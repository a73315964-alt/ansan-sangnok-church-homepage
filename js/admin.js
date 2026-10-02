/* ============================================================
   관리자 대시보드 (admin.html) — 요약 + 회원관리
   관리자(admin)    : 회원 승인 / 승인 취소
   최고 관리자(super): + 관리자 임명·해제, 회원 계정 삭제
   DB 함수: SQL실행하기/05_admin_roles.sql
   ============================================================ */
(function () {
  var ROLE_LABEL = { super: "최고 관리자", admin: "관리자" };
  var TOTAL_CHAPTERS = 1189;

  var users = [];
  var myRole = null;
  var myEmail = "";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    return d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate();
  }
  function notice(html, kind) {
    $("notice").innerHTML = html ? '<div class="notice ' + (kind || "info") + '">' + html + "</div>" : "";
  }

  function status(u) {
    if (!u.user_id) return '<span class="badge off">가입 전</span>';
    if (!u.email_confirmed) return '<span class="badge off">메일 확인 안 됨</span>';
    return u.approved ? '<span class="badge ok">승인</span>' : '<span class="badge wait">승인 대기</span>';
  }

  /* ---------- 화면 ---------- */

  function renderTiles(memberCount) {
    var joined = users.filter(function (u) { return u.user_id; });
    var pending = joined.filter(function (u) { return !u.approved; });
    var admins = users.filter(function (u) { return u.role; });
    $("tUsers").textContent = joined.length + "명";
    $("tUsersSub").textContent = "관리자 " + admins.length + "명 포함";
    $("tPending").textContent = pending.length + "명";
    if (memberCount != null) $("tMembers").textContent = memberCount + "명";
    var readers = joined.filter(function (u) { return u.approved; });
    var avg = readers.length ? readers.reduce(function (s, u) { return s + u.chapters_read; }, 0) / readers.length / TOTAL_CHAPTERS * 100 : 0;
    $("tReading").textContent = Math.round(avg * 10) / 10 + "%";
    $("tReadingSub").textContent = "승인 회원 " + readers.length + "명 기준";
  }

  function filtered() {
    var q = $("searchBox").value.trim().toLowerCase();
    var f = $("filterSel").value;
    return users.filter(function (u) {
      if (q && (u.name + " " + u.email).toLowerCase().indexOf(q) === -1) return false;
      if (f === "pending") return u.user_id && u.email_confirmed && !u.approved;
      if (f === "admins") return !!u.role;
      if (f === "unconfirmed") return u.user_id && !u.email_confirmed;
      return true;
    });
  }

  function actionsFor(u) {
    var isSuper = myRole === "super";
    var self = u.email && u.email.toLowerCase() === myEmail;
    var b = [];
    if (u.user_id && u.role !== "super") {
      if (!u.approved) b.push('<button class="mini-btn primary" data-act="approve" data-id="' + u.user_id + '">승인</button>');
      else if (!u.role) b.push('<button class="mini-btn" data-act="unapprove" data-id="' + u.user_id + '">승인 취소</button>');
    }
    if (isSuper && u.role !== "super") {
      if (u.role === "admin") b.push('<button class="mini-btn" data-act="revoke" data-email="' + esc(u.email) + '">관리자 해제</button>');
      else if (u.user_id) b.push('<button class="mini-btn" data-act="appoint" data-email="' + esc(u.email) + '">관리자 임명</button>');
      if (u.user_id && !self) b.push('<button class="mini-btn danger" data-act="delete" data-id="' + u.user_id + '">삭제</button>');
    }
    return b.join("");
  }

  function renderRows() {
    var list = filtered();
    $("countBadge").textContent = list.length + "명";
    if (!list.length) {
      $("rows").innerHTML = '<tr><td colspan="8" class="empty">' + (users.length ? "조건에 맞는 회원이 없습니다." : "아직 가입한 회원이 없습니다.") + "</td></tr>";
      return;
    }
    $("rows").innerHTML = list.map(function (u) {
      var pct = Math.floor((u.chapters_read / TOTAL_CHAPTERS) * 1000) / 10;
      return "<tr>" +
        "<td><b>" + esc(u.name || "—") + "</b>" + (u.email && u.email.toLowerCase() === myEmail ? ' <span class="muted">(나)</span>' : "") + "</td>" +
        "<td>" + esc(u.email) + "</td>" +
        '<td><span class="badge ' + (u.role || "member") + '">' + (ROLE_LABEL[u.role] || "회원") + "</span></td>" +
        "<td>" + status(u) + "</td>" +
        "<td>" + fmt(u.joined_at) + "</td>" +
        "<td>" + (u.last_sign_in_at ? fmt(u.last_sign_in_at) : '<span class="muted">—</span>') + "</td>" +
        "<td>" + (u.user_id ? u.chapters_read + "장 · " + pct + "%" : "") + "</td>" +
        '<td class="actions">' + actionsFor(u) + "</td>" +
        "</tr>";
    }).join("");
  }

  async function load() {
    var res = await Promise.all([
      window.SB.rpc("admin_list_users"),
      window.SB.from("members").select("id", { count: "exact", head: true }),
    ]);
    if (res[0].error) throw res[0].error;
    users = (res[0].data || []).map(function (u) {
      u.name = u.name || "";
      u.email = u.email || "";
      u.chapters_read = u.chapters_read || 0;
      return u;
    });
    renderTiles(res[1].error ? null : res[1].count);
    renderRows();
  }

  /* ---------- 동작 ---------- */

  function findUser(attr, v) { return users.find(function (u) { return u[attr] === v; }); }

  async function act(btn) {
    var a = btn.getAttribute("data-act");
    var id = btn.getAttribute("data-id");
    var email = btn.getAttribute("data-email");
    var u = id ? findUser("user_id", id) : findUser("email", email);
    var who = u ? (u.name || u.email) : (email || "");
    var res;

    if (a === "approve" || a === "unapprove") {
      res = await window.SB.from("profiles").update({ approved: a === "approve" }).eq("id", id);
    } else if (a === "appoint") {
      if (!confirm(who + " 님을 관리자로 임명할까요?\n교적부(개인정보)와 성경읽기 관리를 볼 수 있게 됩니다.")) return;
      res = await window.SB.rpc("admin_set_role", { target_email: email, new_role: "admin" });
    } else if (a === "revoke") {
      if (!confirm(who + " 님의 관리자 권한을 해제할까요?")) return;
      res = await window.SB.rpc("admin_set_role", { target_email: email, new_role: null });
    } else if (a === "delete") {
      if (!confirm(who + " 님의 회원 계정을 삭제할까요?\n로그인 계정과 성경읽기 기록이 함께 지워지며 되돌릴 수 없습니다.\n(교적부 자료는 지워지지 않습니다)")) return;
      res = await window.SB.rpc("admin_delete_user", { target: id });
    } else {
      return;
    }
    if (res.error) { alert("처리하지 못했습니다: " + res.error.message); return; }
    await load();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    $("logoutBtn").addEventListener("click", sbLogout);
    if (!window.SB_READY) { notice("Supabase 연결이 설정되지 않았습니다.", "error"); return; }
    var session = await sbRequireAuth();
    if (session === "redirect") return;
    myEmail = (session.user.email || "").toLowerCase();

    myRole = await sbMyRole();
    $("whoLine").textContent = session.user.email + " · " + (ROLE_LABEL[myRole] || "회원");
    if (!myRole) {
      notice("관리자 대시보드는 관리자만 볼 수 있습니다. <a href=\"mypage.html\">내 정보로 가기 →</a>", "error");
      return;
    }

    $("roleDesc").textContent = myRole === "super"
      ? "최고 관리자: 가입 승인, 관리자 임명·해제, 회원 계정 삭제를 할 수 있습니다."
      : "관리자: 가입 승인과 승인 취소를 할 수 있습니다. 관리자 임명은 최고 관리자만 할 수 있습니다.";
    $("appointForm").hidden = myRole !== "super";

    $("searchBox").addEventListener("input", renderRows);
    $("filterSel").addEventListener("change", renderRows);
    $("rows").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (btn) act(btn);
    });
    $("appointForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var email = $("appointEmail").value.trim();
      if (!confirm(email + " 을(를) 관리자로 임명할까요?\n교적부(개인정보)와 성경읽기 관리를 볼 수 있게 됩니다.")) return;
      var res = await window.SB.rpc("admin_set_role", { target_email: email, new_role: "admin" });
      if (res.error) { alert("임명하지 못했습니다: " + res.error.message); return; }
      $("appointEmail").value = "";
      await load();
    });

    try {
      await load();
      $("main").hidden = false;
      if (location.hash === "#members") $("members").scrollIntoView();
    } catch (err) {
      notice("불러오지 못했습니다: " + esc(err.message || err), "error");
    }
  });
})();
