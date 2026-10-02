/* ============================================================
   관리자 대시보드 (admin.html) — 요약 + 승인 대기 목록
   회원 승인·정지·삭제는 홈페이지 회원관리(site-members.html)에서 합니다.
   ============================================================ */
(function () {
  var ROLE_LABEL = { super: "최고 관리자", admin: "관리자" };
  var TOTAL_CHAPTERS = 1189;

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

  async function load() {
    var res = await Promise.all([
      window.SB.rpc("admin_list_users"),
      window.SB.from("members").select("id", { count: "exact", head: true }),
    ]);
    if (res[0].error) throw res[0].error;
    var users = (res[0].data || []).filter(function (u) { return u.user_id; });
    var full = users.filter(function (u) { return u.approved && !u.suspended; });
    var pending = users.filter(function (u) { return !u.approved && !u.suspended; });

    $("tUsers").textContent = users.length + "명";
    $("tUsersSub").textContent = "정회원 " + full.length + "명 · 정지 " + users.filter(function (u) { return u.suspended; }).length + "명";
    $("tPending").textContent = pending.length + "명";
    if (!res[1].error) $("tMembers").textContent = res[1].count + "명";
    var avg = full.length ? full.reduce(function (s, u) { return s + (u.chapters_read || 0); }, 0) / full.length / TOTAL_CHAPTERS * 100 : 0;
    $("tReading").textContent = Math.round(avg * 10) / 10 + "%";
    $("tReadingSub").textContent = "정회원 " + full.length + "명 기준";

    $("rows").innerHTML = pending.length
      ? pending.map(function (u) {
          return "<tr><td><b>" + esc(u.name || "—") + "</b></td><td>" + fmtD(u.birth_date) + "</td><td>" + esc(u.email) + "</td><td>" + fmt(u.joined_at) + "</td></tr>";
        }).join("")
      : '<tr><td colspan="4" class="empty">승인 대기 중인 가입자가 없습니다.</td></tr>';
  }

  document.addEventListener("DOMContentLoaded", async function () {
    $("logoutBtn").addEventListener("click", sbLogout);
    if (!window.SB_READY) { notice("Supabase 연결이 설정되지 않았습니다.", "error"); return; }
    var session = await sbRequireAuth();
    if (session === "redirect") return;

    var role = await sbMyRole();
    $("whoLine").textContent = session.user.email + " · " + (ROLE_LABEL[role] || "회원");
    if (!role) {
      notice("관리자 대시보드는 관리자만 볼 수 있습니다. <a href=\"dashboard.html\">나의 대시보드로 →</a>", "error");
      return;
    }
    try {
      await load();
      $("main").hidden = false;
    } catch (err) {
      notice("불러오지 못했습니다: " + esc(err.message || err), "error");
    }
  });
})();
