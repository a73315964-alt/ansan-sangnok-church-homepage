/* ============================================================
   1년 성경읽기 — 목사님 관리 화면 (bible-admin.html)
   admin_emails 에 등록된 계정만 데이터가 보입니다. (SQL실행하기/02, 03)
   ============================================================ */
(function () {
  var BR = window.BR;
  var esc = BR.esc;

  var members = [];   // 승인된 성도 (계산값 포함)
  var pending = [];   // 승인 대기
  var startDate = null;
  var idx = 0;
  var openId = null;

  function $(id) { return document.getElementById(id); }

  function notice(html, kind) {
    $("notice").innerHTML = html ? '<div class="notice ' + (kind || "info") + '">' + html + "</div>" : "";
  }

  function daysSince(ts) {
    if (!ts) return Infinity;
    var d = new Date(ts);
    return Math.floor((BR.today() - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  }

  function enrich(m) {
    m.pct = Math.floor((m.chapters_read / BR.TOTAL) * 1000) / 10;
    m.behind = BR.daysBehind(m.chapters_read, idx);
    var idle = daysSince(m.last_read_at);
    m.needsCheck = idx >= 0 && (m.behind > 7 || idle > 7);
    m.onTrack = idx < 0 || m.behind <= 1;
    // 지금 읽고 있는 권 = 기록이 있는 마지막 권
    m.current = null;
    for (var b = 66; b >= 1; b--) {
      if (m.book_counts[b - 1] > 0) { m.current = b; break; }
    }
    return m;
  }

  /* ---------- 불러오기 ---------- */

  async function load() {
    var res = await window.SB.rpc("admin_reading_summary");
    if (res.error) throw res.error;
    var rows = (res.data || []).map(function (r) {
      r.book_counts = r.book_counts || new Array(66).fill(0);
      return r;
    });
    pending = rows.filter(function (r) { return !r.approved; });
    members = rows.filter(function (r) { return r.approved; }).map(enrich);
    renderAll();
  }

  /* ---------- 화면 ---------- */

  function renderTiles() {
    var n = members.length;
    $("tMembers").textContent = n + "명";
    $("tMembersSub").textContent = pending.length ? "승인 대기 " + pending.length + "명" : "승인된 성도";
    var avg = n ? members.reduce(function (s, m) { return s + m.pct; }, 0) / n : 0;
    $("tAvg").textContent = Math.round(avg * 10) / 10 + "%";
    var expected = idx < 0 ? 0 : BR.cum[Math.min(idx, BR.DAYS - 1)];
    $("tAvgSub").textContent = "오늘까지 계획 " + Math.round((expected / BR.TOTAL) * 1000) / 10 + "%";
    $("tOnTrack").textContent = members.filter(function (m) { return m.onTrack; }).length + "명";
    $("tCheck").textContent = members.filter(function (m) { return m.needsCheck; }).length + "명";

    var start = BR.parseDate(startDate);
    if (idx < 0) $("todayLine").textContent = BR.fmtFull(start) + " 시작 예정 (D-" + (-idx) + ")";
    else if (idx >= BR.DAYS) $("todayLine").textContent = "1년 읽기 기간이 끝났습니다.";
    else $("todayLine").textContent = "오늘 " + (idx + 1) + "일째 · " + BR.dayLabel(idx);
  }

  function renderPending() {
    $("pendingPanel").hidden = pending.length === 0;
    $("pendingRows").innerHTML = pending.map(function (p) {
      return "<tr><td>" + esc(p.name) + "</td><td>" + esc(p.email) + "</td><td>" + BR.fmtFull(new Date(p.joined_at)) + "</td>" +
        '<td style="display:flex;gap:6px;"><button class="mini-btn primary" data-approve="' + p.user_id + '">정회원 등록</button>' +
        '<button class="mini-btn" data-reject="' + p.user_id + '">회원관리에서 처리</button></td></tr>';
    }).join("");
  }

  function sortedFiltered() {
    var q = $("searchBox").value.trim().toLowerCase();
    var filter = $("filterSel").value;
    var list = members.filter(function (m) {
      if (q && (m.name + " " + (m.email || "")).toLowerCase().indexOf(q) === -1) return false;
      if (filter === "check") return m.needsCheck;
      if (filter === "ontrack") return m.onTrack;
      return true;
    });
    var sort = $("sortSel").value;
    list.sort(function (a, b) {
      if (sort === "progress") return b.chapters_read - a.chapters_read;
      if (sort === "recent") return daysSince(b.last_read_at) - daysSince(a.last_read_at);
      if (sort === "behind") return b.behind - a.behind || a.name.localeCompare(b.name, "ko");
      return a.name.localeCompare(b.name, "ko");
    });
    return list;
  }

  function renderMembers() {
    var list = sortedFiltered();
    if (!list.length) {
      $("memberRows").innerHTML = '<tr><td colspan="7" class="empty">' +
        (members.length ? "조건에 맞는 성도가 없습니다." : "아직 승인된 성도가 없습니다. 성도들이 회원가입하면 위 '가입 승인 대기'에 나타납니다.") + "</td></tr>";
      return;
    }
    $("memberRows").innerHTML = list.map(function (m) {
      var cur = m.current ? BR.BOOKS[m.current - 1].name + " " + m.book_counts[m.current - 1] + "/" + BR.BOOKS[m.current - 1].chapters : "—";
      var idle = daysSince(m.last_read_at);
      return "<tr>" +
        "<td><b>" + esc(m.name) + '</b><div style="font-size:.76rem;color:var(--muted);">' + esc(m.email) + "</div></td>" +
        '<td class="prog">' + m.pct + '%<div class="bar' + (m.chapters_read === BR.TOTAL ? " done" : "") + '"><span style="width:' + m.pct + '%"></span></div></td>' +
        "<td>" + m.chapters_read + " / " + BR.TOTAL + "</td>" +
        '<td class="' + BR.paceClass(m.behind, idx) + '"><b>' + BR.paceText(m.behind, idx) + "</b></td>" +
        '<td class="' + (idx >= 0 && idle > 7 ? "bad" : "") + '">' + BR.fmtAgo(m.last_read_at) + "</td>" +
        "<td>" + esc(cur) + "</td>" +
        '<td><button class="mini-btn" data-detail="' + m.user_id + '">권별 보기</button></td>' +
        "</tr>";
    }).join("");
  }

  function renderModal() {
    var m = members.find(function (x) { return x.user_id === openId; });
    if (!m) { $("memberModal").classList.remove("open"); openId = null; return; }
    $("mmTitle").textContent = m.name + " 님의 성경별 진도";
    $("mmSub").textContent = m.email + " · " + m.pct + "% (" + m.chapters_read + "/" + BR.TOTAL + "장) · " +
      BR.paceText(m.behind, idx) + " · 마지막 기록 " + BR.fmtAgo(m.last_read_at);
    function items(from, to) {
      var h = "";
      for (var b = from; b <= to; b++) {
        var book = BR.BOOKS[b - 1], n = m.book_counts[b - 1];
        var pct = Math.round((n / book.chapters) * 100);
        h += '<div class="item"><div class="t"><span>' + esc(book.name) + "</span><small>" + n + "/" + book.chapters + "</small></div>" +
          '<div class="bar' + (n === book.chapters ? " done" : "") + '"><span style="width:' + pct + '%"></span></div></div>';
      }
      return h;
    }
    $("mmOT").innerHTML = items(1, 39);
    $("mmNT").innerHTML = items(40, 66);
  }

  function renderAll() {
    renderTiles();
    renderPending();
    renderMembers();
    if (openId) renderModal();
  }

  /* ---------- 동작 ---------- */

  // 승인·거절은 최고 관리자만 — SQL실행하기/08_member_verification.sql 의 함수 사용
  async function setApproved(id, approved) {
    var res = await window.SB.rpc("admin_set_approved", { target: id, approve: approved, link_member: null });
    if (res.error) { alert("변경하지 못했습니다: " + res.error.message); return; }
    await load();
  }

  function reject() {
    location.href = "site-members.html#pending"; // 삭제·정지는 홈페이지 회원관리에서
  }

  async function saveStart() {
    var v = $("startDate").value;
    if (!v) return;
    if (!confirm(v + " 을(를) 1일째로 설정할까요? 모든 성도의 계획이 이 날짜 기준으로 바뀝니다.")) return;
    var res = await window.SB.from("reading_settings").update({ start_date: v, updated_at: new Date().toISOString() }).eq("id", 1);
    if (res.error) { alert("저장하지 못했습니다: " + res.error.message); return; }
    applyStart(v);
    renderAll();
  }

  function applyStart(v) {
    startDate = v;
    idx = BR.dayIndex(startDate);
    $("startDate").value = v;
    $("endLine").textContent = "→ " + BR.fmtFull(BR.addDays(BR.parseDate(v), BR.DAYS - 1)) + " 에 365일째";
    members.forEach(enrich);
  }

  function downloadCsv() {
    var head = ["이름", "이메일", "진도(%)", "읽은 장", "계획 대비", "마지막 기록"].concat(BR.BOOKS.map(function (b) { return b.name; }));
    var lines = [head].concat(sortedFiltered().map(function (m) {
      return [m.name, m.email, m.pct, m.chapters_read, BR.paceText(m.behind, idx),
        m.last_read_at ? BR.toISO(new Date(m.last_read_at)) : ""].concat(m.book_counts);
    }));
    var csv = lines.map(function (row) {
      return row.map(function (v) {
        var s = String(v == null ? "" : v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(",");
    }).join("\r\n");
    // 엑셀에서 한글이 깨지지 않도록 BOM 추가
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "성경읽기_진도_" + BR.toISO(BR.today()) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function bindEvents() {
    $("logoutBtn").addEventListener("click", sbLogout);
    $("searchBox").addEventListener("input", renderMembers);
    $("sortSel").addEventListener("change", renderMembers);
    $("filterSel").addEventListener("change", renderMembers);
    $("saveStartBtn").addEventListener("click", saveStart);
    $("csvBtn").addEventListener("click", downloadCsv);

    $("pendingRows").addEventListener("click", function (e) {
      var a = e.target.getAttribute("data-approve");
      var r = e.target.getAttribute("data-reject");
      if (a) setApproved(a, true);
      if (r) reject(r);
    });
    $("memberRows").addEventListener("click", function (e) {
      var id = e.target.getAttribute("data-detail");
      if (!id) return;
      openId = id;
      renderModal();
      $("memberModal").classList.add("open");
    });
    $("memberModal").addEventListener("click", function (e) {
      if (e.target.id === "memberModal" || e.target.hasAttribute("data-close")) {
        $("memberModal").classList.remove("open");
        openId = null;
      }
    });
    $("mmRevokeBtn").addEventListener("click", function () {
      var m = members.find(function (x) { return x.user_id === openId; });
      if (m && confirm(m.name + " 님의 승인을 취소할까요? 읽은 기록은 남아 있고, 다시 승인하면 이어서 기록할 수 있습니다.")) {
        $("memberModal").classList.remove("open");
        openId = null;
        setApproved(m.user_id, false);
      }
    });
  }

  /* ---------- 시작 ---------- */

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.SB_READY) { notice("Supabase 연결이 설정되지 않았습니다.", "error"); return; }
    var session = await sbRequireAuth();
    if (session === "redirect") return;

    $("whoLine").textContent = session.user.email + " 로 로그인됨";
    if (!(await sbIsAdmin())) {
      notice("이 화면은 목사님(관리자)만 볼 수 있습니다. <a href=\"bible-reading.html\">내 성경읽기로 가기 →</a>", "error");
      $("logoutBtn").addEventListener("click", sbLogout);
      return;
    }

    bindEvents();
    try {
      var settings = await BR.fetchSettings();
      applyStart(settings.start_date);
      await load();
      $("main").hidden = false;
    } catch (err) {
      notice("불러오지 못했습니다: " + esc(err.message || err) + "<br>SQL실행하기/03_bible_reading.sql 이 실행되었는지 확인해 주세요.", "error");
    }
  });
})();
