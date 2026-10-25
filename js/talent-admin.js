/* 관리자 대시보드 — 달란트 월간 통계 (SQL실행하기/17_talents.sql 의 admin_talent_summary) */
(function () {
  var box = document.getElementById("talentAdmin");
  if (!box || !window.SB_READY) return;
  var now = new Date(Date.now() + 9 * 3600 * 1000);
  var ym = now.toISOString().slice(0, 7);
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  async function load() {
    var tb = document.getElementById("talentRows");
    tb.innerHTML = '<tr><td colspan="6" class="empty">불러오는 중…</td></tr>';
    var res = await window.SB.rpc("admin_talent_summary", { p_month: ym + "-01" });
    if (res.error) { tb.innerHTML = '<tr><td colspan="6" class="empty">달란트 기능을 준비하고 있습니다. (SQL 17 실행 필요)</td></tr>'; return; }
    var rows = res.data || [], sum = 0;
    rows.forEach(function (r) { sum += r.total; });
    document.getElementById("talentSum").textContent = "정회원 " + rows.length + "명 · 합계 " + sum + "달란트 · 노란 " + Math.floor(sum / 5) + "개";
    tb.innerHTML = rows.length ? rows.map(function (r, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(r.name) + "</td><td>" + r.bible_days + "일</td><td>" + r.devo_days + "일</td><td>" + r.share_days + "일</td><td><b>" + r.total + "</b> <span class=\"muted\">(노란 " + Math.floor(r.total / 5) + " · 파란 " + (r.total % 5) + ")</span></td></tr>";
    }).join("") : '<tr><td colspan="6" class="empty">이번 달 기록이 없습니다.</td></tr>';
  }

  document.getElementById("talentMonth").value = ym;
  document.getElementById("talentMonth").addEventListener("change", function () { if (this.value) { ym = this.value; load(); } });
  load();
})();
