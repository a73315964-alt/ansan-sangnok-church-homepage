/* ============================================================
   내 정보 (mypage.html) — 로그인한 본인 정보, 이름·비밀번호 변경, 성경읽기 요약
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
  function notice(html, kind) {
    $("notice").innerHTML = html ? '<div class="notice ' + (kind || "info") + '">' + html + "</div>" : "";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    $("logoutBtn").addEventListener("click", sbLogout);
    if (!window.SB_READY) { notice("Supabase 연결이 설정되지 않았습니다.", "error"); return; }
    var session = await sbRequireAuth();
    if (session === "redirect") return;

    try {
      var results = await Promise.all([
        sbMyProfile(),
        sbMyRole(),
        window.SB.from("bible_reads").select("book", { count: "exact", head: true }).eq("user_id", session.user.id),
      ]);
      var profile = results[0], role = results[1], reads = results[2];

      $("whoLine").textContent = session.user.email + " 로 로그인됨";
      $("nameInput").value = (profile && profile.name) || "";
      $("emailText").textContent = session.user.email;
      $("roleText").innerHTML = '<span class="badge ' + (role || "member") + '">' + (ROLE_LABEL[role] || "회원") + "</span>";
      $("approvedText").innerHTML = profile && profile.approved
        ? '<span class="badge ok">승인됨</span>'
        : '<span class="badge wait">승인 대기</span><span class="desc" style="margin:0;">관리자가 승인하면 성경읽기 기록을 시작할 수 있습니다.</span>';
      $("joinedText").textContent = fmt(session.user.created_at);

      var n = reads.count || 0;
      var pct = Math.floor((n / TOTAL_CHAPTERS) * 1000) / 10;
      $("readingLine").textContent = "지금까지 " + n + " / " + TOTAL_CHAPTERS + "장 읽음 (" + pct + "%)";
      $("readingBar").style.width = pct + "%";

      if (role) {
        $("adminPanel").hidden = false;
        $("adminDesc").textContent = role === "super"
          ? "최고 관리자는 관리자 임명·해제와 회원 계정 삭제까지 할 수 있습니다."
          : "관리자는 교적부, 성경읽기 관리, 회원 승인을 할 수 있습니다.";
      }
      $("main").hidden = false;
    } catch (err) {
      notice("불러오지 못했습니다: " + esc(err.message || err), "error");
    }

    $("saveNameBtn").addEventListener("click", async function () {
      var btn = this;
      btn.disabled = true;
      var res = await window.SB.rpc("update_my_name", { new_name: $("nameInput").value });
      btn.disabled = false;
      $("nameMsg").textContent = res.error ? "저장 실패: " + res.error.message : "저장했습니다.";
      $("nameMsg").className = "desc " + (res.error ? "bad" : "good");
      if (!res.error) await window.SB.auth.updateUser({ data: { name: $("nameInput").value.trim() } }); // 상단 메뉴 이름도 갱신
    });

    $("pwForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var msg = $("pwMsg");
      if ($("pw1").value !== $("pw2").value) { msg.textContent = "비밀번호 확인이 일치하지 않습니다."; msg.className = "desc bad"; return; }
      try {
        await sbUpdatePassword($("pw1").value);
        this.reset();
        msg.textContent = "비밀번호를 바꿨습니다.";
        msg.className = "desc good";
      } catch (err) {
        msg.textContent = "변경 실패: " + (err.message || err);
        msg.className = "desc bad";
      }
    });
  });
})();
