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
        ? '<span class="badge ok">정회원</span><span class="desc" style="margin:0;">' + (profile.verify_method === "auto" ? "교적 정보로 인증됨" : "관리자 등록") + "</span>"
        : '<span class="badge wait">승인 대기</span><span class="desc" style="margin:0;">교적에서 확인되지 않았습니다. 아래에서 다시 대조하거나 관리자 등록을 기다려 주세요.</span>';
      $("verifyPanel").hidden = !!(profile && profile.approved);
      if (profile) {
        $("vName").value = profile.name || "";
        $("vBirth").value = profile.birth_date || "";
      }
      $("joinedText").textContent = fmt(session.user.created_at);

      var n = reads.count || 0;
      var pct = Math.floor((n / TOTAL_CHAPTERS) * 1000) / 10;
      $("readingLine").textContent = "지금까지 " + n + " / " + TOTAL_CHAPTERS + "장 읽음 (" + pct + "%)";
      $("readingBar").style.width = pct + "%";

      if (role) {
        $("adminPanel").hidden = false;
        $("pwPanel").hidden = false;
        $("adminDesc").textContent = role === "super"
          ? "최고 관리자는 정회원 등록, 회원 정지·삭제, 관리자 임명까지 할 수 있습니다."
          : "관리자는 교적부와 성경읽기 관리를 할 수 있습니다.";
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

    $("verifyForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var msg = $("verifyMsg");
      var res = await window.SB.rpc("verify_me", { p_name: $("vName").value.trim(), p_birth: $("vBirth").value || null });
      if (res.error) { msg.textContent = "확인 실패: " + res.error.message; msg.className = "desc bad"; return; }
      if (res.data === true) {
        msg.textContent = "교적에서 확인되어 정회원으로 인증되었습니다.";
        msg.className = "desc good";
        setTimeout(function () { location.reload(); }, 1000);
      } else {
        msg.textContent = "교적에서 일치하는 분을 찾지 못했습니다. 성명·생년월일을 확인하시거나 교회 사무실에 문의해 주세요.";
        msg.className = "desc bad";
      }
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
