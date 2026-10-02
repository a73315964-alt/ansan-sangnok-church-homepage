/* ============================================================
   나의 1년 성경읽기 (bible-reading.html) — 성도 개인 화면
   읽은 장은 Supabase bible_reads 표에 저장됩니다. (SQL실행하기/03_bible_reading.sql)
   ============================================================ */
(function () {
  var BR = window.BR;
  var esc = BR.esc;

  var state = {
    userId: null,
    approved: false,
    startDate: null,
    idx: 0,              // 오늘이 몇 번째 날인지 (0 = 1일째)
    read: new Set(),     // BR.key(book, chapter)
    lastReadAt: null,
    busy: false,
  };
  var planRendered = false;

  function $(id) { return document.getElementById(id); }

  function notice(html, kind) {
    $("notice").innerHTML = html ? '<div class="notice ' + (kind || "info") + '">' + html + "</div>" : "";
  }

  function isRead(b, c) { return state.read.has(BR.key(b, c)); }
  function bookReadCount(b) {
    var n = 0;
    for (var c = 1; c <= BR.BOOKS[b - 1].chapters; c++) if (isRead(b, c)) n++;
    return n;
  }
  function dayStatus(d) {
    var chs = BR.dayChapters(d);
    var n = chs.filter(function (x) { return isRead(x.book, x.chapter); }).length;
    return n === 0 ? "none" : n === chs.length ? "done" : "partial";
  }

  /* ---------- 저장 ---------- */

  async function setRead(list, on) {
    if (!state.approved || state.busy) return;
    var todo = list.filter(function (x) { return isRead(x.book, x.chapter) !== on; });
    if (!todo.length) return;
    state.busy = true;
    try {
      if (on) {
        var rows = todo.map(function (x) { return { user_id: state.userId, book: x.book, chapter: x.chapter }; });
        var res = await window.SB.from("bible_reads").upsert(rows, { onConflict: "user_id,book,chapter", ignoreDuplicates: true });
        if (res.error) throw res.error;
        todo.forEach(function (x) { state.read.add(BR.key(x.book, x.chapter)); });
        state.lastReadAt = new Date().toISOString();
      } else {
        var byBook = {};
        todo.forEach(function (x) { (byBook[x.book] = byBook[x.book] || []).push(x.chapter); });
        for (var b in byBook) {
          var del = await window.SB.from("bible_reads").delete()
            .eq("user_id", state.userId).eq("book", +b).in("chapter", byBook[b]);
          if (del.error) throw del.error;
        }
        todo.forEach(function (x) { state.read.delete(BR.key(x.book, x.chapter)); });
      }
    } catch (err) {
      alert("저장하지 못했습니다: " + (err.message || err));
    }
    state.busy = false;
    renderAll();
  }

  /* ---------- 화면 ---------- */

  function renderTiles() {
    var n = state.read.size;
    var pct = Math.floor((n / BR.TOTAL) * 1000) / 10;
    $("tProgress").textContent = pct + "%";
    $("tProgressSub").textContent = n + " / " + BR.TOTAL + "장";

    var idx = state.idx;
    var start = BR.parseDate(state.startDate);
    if (idx < 0) {
      $("tDay").textContent = "D-" + (-idx);
      $("tDaySub").textContent = BR.fmtFull(start) + " 시작";
    } else if (idx >= BR.DAYS) {
      $("tDay").textContent = "완주 기간 종료";
      $("tDaySub").textContent = BR.fmtFull(BR.addDays(start, BR.DAYS - 1)) + " 까지";
    } else {
      $("tDay").textContent = (idx + 1) + "일째";
      $("tDaySub").textContent = BR.fmtDate(BR.today(), true) + " · 전체 " + BR.DAYS + "일";
    }

    var behind = BR.daysBehind(n, idx);
    var pace = $("tPace");
    pace.textContent = BR.paceText(behind, idx);
    pace.className = "value " + BR.paceClass(behind, idx);
    var expected = idx < 0 ? 0 : BR.cum[Math.min(idx, BR.DAYS - 1)];
    $("tPaceSub").textContent = idx < 0 ? "시작일부터 계산됩니다" : "오늘까지 계획 " + expected + "장";

    $("tLast").textContent = BR.fmtAgo(state.lastReadAt);
    $("tLastSub").textContent = state.lastReadAt ? BR.fmtFull(new Date(state.lastReadAt)) : "";
  }

  function renderToday() {
    var idx = state.idx;
    var d;
    if (idx < 0) {
      d = 0;
      $("todayTitle").textContent = "첫날 읽을 본문 (미리 보기)";
    } else if (idx >= BR.DAYS) {
      $("todayPanel").hidden = true;
      return;
    } else {
      d = idx;
      $("todayTitle").textContent = "오늘의 읽기 · " + (d + 1) + "일째";
    }
    $("todayPanel").hidden = false;
    $("todayRanges").textContent = BR.dayLabel(d);
    var chs = BR.dayChapters(d);
    $("todayChips").innerHTML = chs.map(function (x) {
      var b = BR.BOOKS[x.book - 1];
      return '<button class="chip' + (isRead(x.book, x.chapter) ? " on" : "") + '" data-b="' + x.book + '" data-c="' + x.chapter + '"' +
        (state.approved ? "" : " disabled") + ">" + esc(b.abbr) + " " + x.chapter + "</button>";
    }).join("");
    var allDone = dayStatus(d) === "done";
    var btn = $("todayAllBtn");
    btn.textContent = allDone ? "✓ 오늘 분량을 다 읽었습니다" : "오늘 분량 모두 읽음";
    btn.disabled = !state.approved || allDone;
    btn.onclick = function () { setRead(chs, true); };
  }

  function renderOverdue() {
    var last = Math.min(state.idx, BR.DAYS) - 1; // 어제까지
    var days = [];
    for (var d = 0; d <= last; d++) if (dayStatus(d) !== "done") days.push(d);
    $("overduePanel").hidden = days.length === 0;
    if (!days.length) return;
    var shown = days.slice(0, 10);
    $("overdueList").innerHTML = shown.map(function (d) {
      var date = BR.dateOfDay(state.startDate, d);
      return "<li><span><span class=\"d\">" + (d + 1) + "일째 · " + BR.fmtDate(date) + "</span>" + esc(BR.dayLabel(d)) + "</span>" +
        '<button class="mini-btn primary" data-day="' + d + '"' + (state.approved ? "" : " disabled") + ">읽음</button></li>";
    }).join("") + (days.length > shown.length ? '<li><span class="d">외 ' + (days.length - shown.length) + "일 더 — 1년 읽기표 탭에서 확인하세요</span></li>" : "");
  }

  function renderBooks() {
    function group(title, from, to) {
      var items = "";
      for (var b = from; b <= to; b++) {
        var book = BR.BOOKS[b - 1];
        var n = bookReadCount(b);
        var pct = Math.round((n / book.chapters) * 100);
        items += '<button class="book" data-book="' + b + '">' +
          '<div class="t"><span>' + esc(book.name) + "</span><small>" + n + "/" + book.chapters + "</small></div>" +
          '<div class="bar' + (n === book.chapters ? " done" : "") + '"><span style="width:' + pct + '%"></span></div></button>';
      }
      return '<div class="testament">' + title + '</div><div class="books">' + items + "</div>";
    }
    var ot = 0, nt = 0;
    for (var b = 1; b <= 66; b++) { if (b <= 39) ot += bookReadCount(b); else nt += bookReadCount(b); }
    $("tab-books").innerHTML =
      group("구약 39권 · " + ot + " / 929장", 1, 39) +
      group("신약 27권 · " + nt + " / 260장", 40, 66);
  }

  function renderPlan() {
    var html = "";
    var month = -1;
    for (var d = 0; d < BR.DAYS; d++) {
      var date = BR.dateOfDay(state.startDate, d);
      var mKey = date.getFullYear() * 12 + date.getMonth();
      if (mKey !== month) {
        month = mKey;
        html += '<div class="plan-month">' + date.getFullYear() + "년 " + (date.getMonth() + 1) + "월</div>";
      }
      var st = dayStatus(d);
      html += '<label class="plan-row' + (d === state.idx ? " today" : "") + (st === "partial" ? " partial" : "") + '" id="plan-' + d + '">' +
        '<input type="checkbox" data-day="' + d + '"' + (st === "done" ? " checked" : "") + (state.approved ? "" : " disabled") + ">" +
        '<span class="n">' + (d + 1) + "일째</span>" +
        '<span class="dt">' + BR.fmtDate(date, true) + "</span>" +
        '<span class="lbl">' + esc(BR.dayLabel(d)) + "</span></label>";
    }
    $("tab-plan").innerHTML = html;
    planRendered = true;
  }

  var openBook = null;
  function renderBookModal() {
    if (!openBook) return;
    var book = BR.BOOKS[openBook - 1];
    var n = bookReadCount(openBook);
    $("bmTitle").textContent = book.name;
    $("bmSub").textContent = n + " / " + book.chapters + "장 읽음" + (state.approved ? " — 장을 눌러 체크하세요" : "");
    var html = "";
    for (var c = 1; c <= book.chapters; c++) {
      html += '<button class="chip' + (isRead(openBook, c) ? " on" : "") + '" data-b="' + openBook + '" data-c="' + c + '"' +
        (state.approved ? "" : " disabled") + ">" + c + "</button>";
    }
    $("bmChips").innerHTML = html;
    $("bmAllBtn").disabled = !state.approved || n === book.chapters;
  }

  function renderAll() {
    renderTiles();
    renderToday();
    renderOverdue();
    renderBooks();
    if (planRendered) renderPlan();
    renderBookModal();
  }

  /* ---------- 이벤트 ---------- */

  function chipToggle(e) {
    var t = e.target.closest(".chip");
    if (!t || t.disabled) return;
    var b = +t.getAttribute("data-b"), c = +t.getAttribute("data-c");
    setRead([{ book: b, chapter: c }], !isRead(b, c));
  }

  function bindEvents() {
    $("logoutBtn").addEventListener("click", sbLogout);
    $("todayChips").addEventListener("click", chipToggle);
    $("bmChips").addEventListener("click", chipToggle);

    $("overdueList").addEventListener("click", function (e) {
      var d = e.target.getAttribute("data-day");
      if (d != null) setRead(BR.dayChapters(+d), true);
    });

    $("tabs").addEventListener("click", function (e) {
      var tab = e.target.getAttribute("data-tab");
      if (!tab) return;
      document.querySelectorAll("#tabs button").forEach(function (b) { b.classList.toggle("on", b === e.target); });
      $("tab-books").hidden = tab !== "books";
      $("tab-plan").hidden = tab !== "plan";
      if (tab === "plan") {
        if (!planRendered) renderPlan();
        var row = $("plan-" + Math.max(0, Math.min(state.idx, BR.DAYS - 1)));
        if (row) row.scrollIntoView({ block: "center" });
      }
    });

    $("tab-plan").addEventListener("change", function (e) {
      var d = e.target.getAttribute("data-day");
      if (d == null) return;
      var on = e.target.checked;
      if (!on && !confirm((+d + 1) + "일째 분량의 체크를 모두 취소할까요?")) { e.target.checked = true; return; }
      setRead(BR.dayChapters(+d), on);
    });

    $("tab-books").addEventListener("click", function (e) {
      var t = e.target.closest(".book");
      if (!t) return;
      openBook = +t.getAttribute("data-book");
      renderBookModal();
      $("bookModal").classList.add("open");
    });
    $("bmAllBtn").addEventListener("click", function () {
      var list = [];
      for (var c = 1; c <= BR.BOOKS[openBook - 1].chapters; c++) list.push({ book: openBook, chapter: c });
      setRead(list, true);
    });
    $("bookModal").addEventListener("click", function (e) {
      if (e.target.id === "bookModal" || e.target.hasAttribute("data-close")) {
        $("bookModal").classList.remove("open");
        openBook = null;
      }
    });
  }

  /* ---------- 시작 ---------- */

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.SB_READY) {
      notice("Supabase 연결이 설정되지 않았습니다.", "error");
      return;
    }
    var session = await sbRequireAuth();
    if (session === "redirect") return;

    state.userId = session.user.id;
    bindEvents();

    try {
      var results = await Promise.all([sbMyProfile(), BR.fetchSettings(), BR.fetchReads(state.userId), sbIsAdmin()]);
      var profile = results[0], settings = results[1], reads = results[2], admin = results[3];

      state.approved = !!(profile && profile.approved);
      state.startDate = settings.start_date;
      state.idx = BR.dayIndex(state.startDate);
      reads.forEach(function (r) {
        state.read.add(BR.key(r.book, r.chapter));
        if (!state.lastReadAt || r.read_at > state.lastReadAt) state.lastReadAt = r.read_at;
      });

      $("whoLine").textContent = ((profile && profile.name) || session.user.email) + " 님" + (admin ? " · 관리자" : "");
      $("adminLink").hidden = !admin;

      if (!profile) {
        notice("회원 정보가 아직 만들어지지 않았습니다. 교회 사무실(목사님)께 문의해 주세요.", "error");
      } else if (!state.approved) {
        notice("<b>가입 승인 대기 중입니다.</b> 목사님이 승인하시면 읽은 장을 체크할 수 있습니다. 그동안 읽기표는 미리 보실 수 있습니다.", "warn");
      } else if (state.idx < 0) {
        notice("1년 성경읽기는 <b>" + BR.fmtFull(BR.parseDate(state.startDate)) + "</b>에 시작합니다. 미리 읽으신 장도 체크해 두실 수 있습니다.", "info");
      }

      $("main").hidden = false;
      renderAll();
    } catch (err) {
      notice("불러오지 못했습니다: " + esc(err.message || err) + "<br>Supabase 프로젝트가 일시정지되었거나, SQL실행하기/03_bible_reading.sql 이 아직 실행되지 않았을 수 있습니다.", "error");
    }
  });
})();
