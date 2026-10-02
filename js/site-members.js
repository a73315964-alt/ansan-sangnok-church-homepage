/* ============================================================
   홈페이지 회원관리 (site-members.html)
   - 정회원 인증: 가입 때 성명·생년월일이 교적과 일치하면 자동 (DB 트리거)
   - 최고 관리자: 정회원 등록(교적 연결 선택), 승인 취소, 정지·해제, 삭제, 관리자 임명·해제, 교적 연결 변경
   - 관리자: 목록 보기
   DB 함수: SQL실행하기/05_admin_roles.sql, 08_member_verification.sql
   ============================================================ */
(function () {
  var ROLE_LABEL = { super: "최고 관리자", admin: "관리자" };
  var TOTAL_CHAPTERS = 1189;

  var users = [];
  var members = [];   // 교적 (연결용)
  var myRole = null;
  var myEmail = "";
  var approving = null; // { user, mode: "approve" | "link" }

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
  function fmtD(s) { if (!s) return ""; var p = String(s).split("-"); return p[0] + ". " + +p[1] + ". " + +p[2]; }
  function notice(html, kind) {
    $("notice").innerHTML = html ? '<div class="notice ' + (kind || "info") + '">' + html + "</div>" : "";
  }
  function isSuper() { return myRole === "super"; }
  function isSelf(u) { return u.email && u.email.toLowerCase() === myEmail; }

  function statusBadge(u) {
    if (!u.user_id) return '<span class="badge off">가입 전</span>';
    if (u.suspended) return '<span class="badge stop">정지</span>';
    if (!u.approved) return '<span class="badge wait">승인 대기</span>';
    return '<span class="badge ok">정회원 · ' + (u.verify_method === "auto" ? "교적 인증" : "관리자 등록") + "</span>";
  }

  /* ---------- 화면 ---------- */

  function renderTiles() {
    var joined = users.filter(function (u) { return u.user_id; });
    var full = joined.filter(function (u) { return u.approved && !u.suspended; });
    $("tAll").textContent = joined.length + "명";
    $("tAllSub").textContent = "관리자 " + users.filter(function (u) { return u.role; }).length + "명 포함";
    $("tFull").textContent = full.length + "명";
    $("tFullSub").textContent = "교적 인증 " + full.filter(function (u) { return u.verify_method === "auto"; }).length +
      " · 관리자 등록 " + full.filter(function (u) { return u.verify_method !== "auto"; }).length;
    $("tPending").textContent = joined.filter(function (u) { return !u.approved && !u.suspended; }).length + "명";
    $("tStopped").textContent = joined.filter(function (u) { return u.suspended; }).length + "명";
  }

  function filtered() {
    var q = $("searchBox").value.trim().toLowerCase();
    var f = $("filterSel").value;
    return users.filter(function (u) {
      if (q && (u.name + " " + u.email + " " + (u.member_name || "")).toLowerCase().indexOf(q) === -1) return false;
      if (f === "pending") return u.user_id && !u.approved && !u.suspended;
      if (f === "full") return u.approved && !u.suspended;
      if (f === "unlinked") return u.approved && !u.suspended && !u.member_id;
      if (f === "stopped") return u.suspended;
      if (f === "admins") return !!u.role;
      return true;
    });
  }

  function actionsFor(u) {
    if (!isSuper() || !u.user_id) {
      if (isSuper() && !u.user_id && u.role === "admin") return '<button class="mini-btn" data-act="revoke" data-email="' + esc(u.email) + '">관리자 해제</button>';
      return "";
    }
    var b = [];
    var protectedRow = u.role === "super" || isSelf(u);
    if (!u.suspended) {
      if (!u.approved) b.push('<button class="mini-btn primary" data-act="approve" data-id="' + u.user_id + '">승인 (정회원 등록)</button>');
      else if (!u.role) b.push('<button class="mini-btn" data-act="unapprove" data-id="' + u.user_id + '">승인 취소</button>');
      b.push('<button class="mini-btn" data-act="link" data-id="' + u.user_id + '">교적 연결</button>');
    }
    if (!protectedRow) {
      b.push(u.suspended
        ? '<button class="mini-btn primary" data-act="unsuspend" data-id="' + u.user_id + '">정지 해제</button>'
        : '<button class="mini-btn danger" data-act="suspend" data-id="' + u.user_id + '">정지</button>');
      if (u.role === "admin") b.push('<button class="mini-btn" data-act="revoke" data-email="' + esc(u.email) + '">관리자 해제</button>');
      else if (!u.suspended) b.push('<button class="mini-btn" data-act="appoint" data-email="' + esc(u.email) + '">관리자 임명</button>');
      b.push('<button class="mini-btn danger" data-act="delete" data-id="' + u.user_id + '">삭제</button>');
    }
    return b.join("");
  }

  function renderRows() {
    var list = filtered();
    $("countBadge").textContent = list.length + "명";
    if (!list.length) {
      $("rows").innerHTML = '<tr><td colspan="9" class="empty">' + (users.length ? "조건에 맞는 회원이 없습니다." : "아직 가입한 회원이 없습니다.") + "</td></tr>";
      return;
    }
    $("rows").innerHTML = list.map(function (u) {
      var pct = Math.floor((u.chapters_read / TOTAL_CHAPTERS) * 1000) / 10;
      var link = u.member_id
        ? esc(u.member_name) + (u.member_position ? " " + esc(u.member_position) : "") + '<div class="muted">' + fmtD(u.member_birth) + "</div>"
        : (u.user_id ? '<span class="muted">미연결</span>' : "");
      return '<tr class="' + (u.suspended ? "is-suspended" : "") + '">' +
        "<td><b>" + esc(u.name || "—") + "</b>" + (isSelf(u) ? ' <span class="muted">(나)</span>' : "") +
          (u.birth_date ? '<div class="muted">' + fmtD(u.birth_date) + "</div>" : "") + "</td>" +
        "<td>" + esc(u.email) + "</td>" +
        '<td><span class="badge ' + (u.role || "member") + '">' + (ROLE_LABEL[u.role] || "회원") + "</span></td>" +
        "<td>" + statusBadge(u) + "</td>" +
        "<td>" + link + "</td>" +
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
      window.SB.from("members").select("id,name,birth_date,position").order("name"),
    ]);
    if (res[0].error) throw res[0].error;
    users = (res[0].data || []).map(function (u) {
      u.name = u.name || "";
      u.email = u.email || "";
      u.chapters_read = u.chapters_read || 0;
      return u;
    });
    members = res[1].error ? [] : res[1].data || [];
    renderTiles();
    renderRows();
  }

  /* ---------- 정회원 등록 / 교적 연결 ---------- */

  function openApprove(u, mode) {
    approving = { user: u, mode: mode };
    $("amTitle").textContent = mode === "approve" ? "정회원 등록" : "교적 연결";
    $("amSaveBtn").textContent = mode === "approve" ? "정회원 등록" : "연결 저장";
    $("amWho").innerHTML = "<b>" + esc(u.name || "—") + "</b> · " + esc(u.email) +
      (u.birth_date ? "<br>가입 때 적은 생년월일: " + fmtD(u.birth_date) : "<br>가입 때 생년월일을 적지 않았습니다.");
    var linkedElsewhere = new Set(users.filter(function (x) { return x.member_id && x.user_id !== u.user_id; }).map(function (x) { return x.member_id; }));
    var norm = function (s) { return String(s || "").replace(/\s/g, ""); };
    var choices = members.filter(function (m) { return !linkedElsewhere.has(m.id); });
    // 이름이 같은 교인을 맨 위에
    choices.sort(function (a, b) {
      var sa = norm(a.name) === norm(u.name) ? 0 : 1, sb = norm(b.name) === norm(u.name) ? 0 : 1;
      return sa - sb || a.name.localeCompare(b.name, "ko");
    });
    $("amMember").innerHTML = '<option value="">— 연결하지 않음 (교적에 없음) —</option>' + choices.map(function (m) {
      var same = norm(m.name) === norm(u.name);
      return '<option value="' + m.id + '"' + (m.id === u.member_id ? " selected" : "") + ">" + (same ? "★ " : "") + esc(m.name) +
        (m.birth_date ? " (" + fmtD(m.birth_date) + ")" : "") + (m.position ? " " + esc(m.position) : "") + "</option>";
    }).join("");
    $("approveModal").classList.add("open");
  }

  async function saveApprove() {
    if (!approving) return;
    var u = approving.user;
    var memberId = $("amMember").value || null;
    var res = approving.mode === "approve"
      ? await window.SB.rpc("admin_set_approved", { target: u.user_id, approve: true, link_member: memberId })
      : await window.SB.rpc("admin_link_member", { target: u.user_id, link_member: memberId });
    if (res.error) { alert("처리하지 못했습니다: " + res.error.message); return; }
    $("approveModal").classList.remove("open");
    approving = null;
    await load();
  }

  /* ---------- 동작 ---------- */

  async function act(btn) {
    var a = btn.getAttribute("data-act");
    var id = btn.getAttribute("data-id");
    var email = btn.getAttribute("data-email");
    var u = id ? users.find(function (x) { return x.user_id === id; }) : users.find(function (x) { return x.email === email; });
    var who = u ? (u.name || u.email) : (email || "");
    var res;

    if (a === "approve" || a === "link") { openApprove(u, a); return; }
    if (a === "unapprove") {
      if (!confirm(who + " 님의 정회원 승인을 취소할까요?\n성경 본문과 읽기 기록을 쓸 수 없게 됩니다.")) return;
      res = await window.SB.rpc("admin_set_approved", { target: id, approve: false, link_member: null });
    } else if (a === "suspend") {
      if (!confirm(who + " 님을 정지할까요?\n바로 로그인이 막히고, 로그인된 기기에서도 곧 로그아웃됩니다.\n(기록은 그대로 남고, 정지 해제하면 다시 쓸 수 있습니다)")) return;
      res = await window.SB.rpc("admin_set_suspended", { target: id, suspend: true });
    } else if (a === "unsuspend") {
      res = await window.SB.rpc("admin_set_suspended", { target: id, suspend: false });
    } else if (a === "appoint") {
      if (!confirm(who + " 님을 관리자로 임명할까요?\n교적부(개인정보)와 성경읽기 관리를 볼 수 있게 됩니다.")) return;
      res = await window.SB.rpc("admin_set_role", { target_email: email, new_role: "admin" });
    } else if (a === "revoke") {
      if (!confirm(who + " 님의 관리자 권한을 해제할까요?")) return;
      res = await window.SB.rpc("admin_set_role", { target_email: email, new_role: null });
    } else if (a === "delete") {
      if (!confirm(who + " 님의 홈페이지 계정을 삭제할까요?\n로그인 계정과 성경읽기 기록이 함께 지워지며 되돌릴 수 없습니다.\n(교적부 자료는 지워지지 않습니다)")) return;
      res = await window.SB.rpc("admin_delete_user", { target: id });
    } else {
      return;
    }
    if (res.error) { alert("처리하지 못했습니다: " + res.error.message); return; }
    await load();
  }

  function downloadCsv() {
    var head = ["성명", "생년월일", "이메일", "권한", "상태", "교적 연결", "가입일", "마지막 로그인", "성경읽기(장)"];
    var lines = [head].concat(filtered().map(function (u) {
      var st = !u.user_id ? "가입 전" : u.suspended ? "정지" : !u.approved ? "승인 대기" : "정회원(" + (u.verify_method === "auto" ? "교적 인증" : "관리자 등록") + ")";
      return [u.name, u.birth_date || "", u.email, ROLE_LABEL[u.role] || "회원", st, u.member_name || "", fmt(u.joined_at), fmt(u.last_sign_in_at), u.chapters_read];
    }));
    var csv = lines.map(function (row) {
      return row.map(function (v) { var s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(",");
    }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "홈페이지회원_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
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
      notice("홈페이지 회원관리는 관리자만 볼 수 있습니다. <a href=\"dashboard.html\">나의 대시보드로 →</a>", "error");
      return;
    }
    $("roleDesc").textContent = isSuper()
      ? "최고 관리자: 정회원 등록(승인)·승인 취소, 정지·정지 해제, 삭제, 교적 연결, 관리자 임명을 할 수 있습니다."
      : "관리자는 목록만 볼 수 있습니다. 승인·정지·삭제는 최고 관리자가 합니다.";
    $("appointForm").hidden = !isSuper();

    $("searchBox").addEventListener("input", renderRows);
    $("filterSel").addEventListener("change", renderRows);
    $("csvBtn").addEventListener("click", downloadCsv);
    $("rows").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (btn) act(btn);
    });
    $("amSaveBtn").addEventListener("click", saveApprove);
    $("approveModal").addEventListener("click", function (e) {
      if (e.target.id === "approveModal" || e.target.hasAttribute("data-close")) $("approveModal").classList.remove("open");
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
    if (location.hash === "#pending") $("filterSel").value = "pending";

    try {
      await load();
      $("main").hidden = false;
    } catch (err) {
      notice("불러오지 못했습니다: " + esc(err.message || err), "error");
    }
  });
})();
