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
      return '<button class="chip' + (isRead(x.book, x.chapter) ? " on" : "") + '" data-b="' + x.book + '" data-c="' + x.chapter + '" data-queue="today">' +
        (isRead(x.book, x.chapter) ? "✓ " : "") + esc(b.abbr) + " " + x.chapter + "</button>";
    }).join("");
    var allDone = dayStatus(d) === "done";
    var btn = $("todayAllBtn");
    btn.textContent = allDone ? "✓ 오늘 분량을 다 읽었습니다 (다시 읽기)" : "📖 오늘 본문 읽기";
    btn.onclick = function () {
      var first = chs.findIndex(function (x) { return !isRead(x.book, x.chapter); });
      openReader(chs, first < 0 ? 0 : first, (d + 1) + "일째 본문");
    };
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
        '<button class="mini-btn primary" data-day="' + d + '">📖 읽기</button></li>';
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
      html += '<div class="plan-row' + (d === state.idx ? " today" : "") + (st === "partial" ? " partial" : "") + '" id="plan-' + d + '">' +
        '<input type="checkbox" data-day="' + d + '" title="읽음 표시"' + (st === "done" ? " checked" : "") + (state.approved ? "" : " disabled") + ">" +
        '<span class="n">' + (d + 1) + "일째</span>" +
        '<span class="dt">' + BR.fmtDate(date, true) + "</span>" +
        '<button type="button" class="lbl" data-read-day="' + d + '" title="본문 읽기">' + esc(BR.dayLabel(d)) + "</button></div>";
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
    $("bmSub").textContent = n + " / " + book.chapters + "장 읽음 — 장을 누르면 본문이 열립니다";
    var html = "";
    for (var c = 1; c <= book.chapters; c++) {
      html += '<button class="chip' + (isRead(openBook, c) ? " on" : "") + '" data-b="' + openBook + '" data-c="' + c + '" data-queue="book">' + c + "</button>";
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

  /* ---------- 본문 읽기 창 ---------- */
  // queue: 이어 읽을 장 목록 [{book, chapter}], pos: 지금 보는 위치
  var reader = { queue: [], pos: 0, label: "" };
  var textCache = {}; // "book:chapter" → [{verse, heading, body}]
  var fontSize = 1.05;
  try { fontSize = parseFloat(localStorage.getItem("br-font")) || 1.05; } catch (e) {}

  function bookQueue(b) {
    var list = [];
    for (var c = 1; c <= BR.BOOKS[b - 1].chapters; c++) list.push({ book: b, chapter: c });
    return list;
  }

  async function chapterText(b, c) {
    var k = b + ":" + c;
    if (textCache[k]) return textCache[k];
    var res = await window.SB.from("bible_verses").select("verse,heading,body").eq("book", b).eq("chapter", c).order("verse");
    if (res.error) throw res.error;
    textCache[k] = res.data || [];
    return textCache[k];
  }

  function openReader(queue, pos, label) {
    reader = { queue: queue, pos: pos || 0, label: label || "" };
    $("readerModal").classList.add("open");
    document.body.style.overflow = "hidden";
    showReader();
  }
  function closeReader() {
    $("readerModal").classList.remove("open");
    document.body.style.overflow = "";
  }

  function renderReaderButtons() {
    var cur = reader.queue[reader.pos];
    if (!cur) return;
    var done = isRead(cur.book, cur.chapter);
    var btn = $("rdDoneBtn");
    btn.textContent = done ? "✓ 읽음 완료됨" : "읽음 완료";
    btn.className = "btn " + (done ? "btn-outline" : "btn-primary");
    btn.disabled = !state.approved;
    $("rdUndoBtn").hidden = !done || !state.approved;
    $("rdPrevBtn").disabled = reader.pos === 0;
    $("rdNextBtn").disabled = reader.pos >= reader.queue.length - 1;
    var readInQueue = reader.queue.filter(function (x) { return isRead(x.book, x.chapter); }).length;
    $("rdProgress").textContent = reader.queue.length > 1 ? readInQueue + " / " + reader.queue.length + "장 완료" : "";
  }

  async function showReader() {
    var cur = reader.queue[reader.pos];
    if (!cur) return;
    var book = BR.BOOKS[cur.book - 1];
    $("rdTitle").textContent = book.name + " " + cur.chapter + "장";
    $("rdSub").textContent = (reader.label ? reader.label + " · " : "") + (reader.queue.length > 1 ? (reader.pos + 1) + "번째 / " + reader.queue.length + "장" : "");
    $("rdBody").style.fontSize = fontSize + "rem";
    $("rdBody").innerHTML = '<p class="desc">본문을 불러오는 중…</p>';
    renderReaderButtons();
    $("rdBody").scrollTop = 0;
    try {
      var verses = await chapterText(cur.book, cur.chapter);
      if (reader.queue[reader.pos] !== cur) return; // 그새 다른 장으로 넘어감
      if (!verses.length) {
        $("rdBody").innerHTML = '<p class="desc">' + (state.approved
          ? "본문을 찾을 수 없습니다."
          : "성경 본문은 <b>승인된 회원</b>만 볼 수 있습니다. 관리자 승인 후 다시 열어 주세요.") + "</p>";
        return;
      }
      $("rdBody").innerHTML = verses.map(function (v) {
        return (v.heading ? '<h4 class="rd-head">' + esc(v.heading) + "</h4>" : "") +
          '<p class="rd-v"><sup>' + v.verse + "</sup>" + esc(v.body) + "</p>";
      }).join("") + '<p class="rd-src">개역개정</p>';
    } catch (err) {
      $("rdBody").innerHTML = '<p class="desc bad">본문을 불러오지 못했습니다: ' + esc(err.message || err) + "</p>";
    }
  }

  async function readerDone() {
    var cur = reader.queue[reader.pos];
    if (!cur || !state.approved) return;
    if (!isRead(cur.book, cur.chapter)) await setRead([cur], true);
    renderReaderButtons();
    // 다음 안 읽은 장으로 이어서
    var next = reader.queue.findIndex(function (x, i) { return i > reader.pos && !isRead(x.book, x.chapter); });
    if (next !== -1) { reader.pos = next; showReader(); }
    else if (reader.queue.every(function (x) { return isRead(x.book, x.chapter); }) && reader.queue.length > 1) {
      $("rdProgress").textContent = "🎉 " + reader.queue.length + "장 모두 읽었습니다!";
    }
  }

  function setFont(v) {
    fontSize = Math.min(1.6, Math.max(0.85, Math.round(v * 100) / 100));
    $("rdBody").style.fontSize = fontSize + "rem";
    try { localStorage.setItem("br-font", String(fontSize)); } catch (e) {}
  }

  function chipOpen(e) {
    var t = e.target.closest(".chip");
    if (!t) return;
    var b = +t.getAttribute("data-b"), c = +t.getAttribute("data-c");
    if (t.getAttribute("data-queue") === "today") {
      var d = Math.min(Math.max(state.idx, 0), BR.DAYS - 1);
      var chs = BR.dayChapters(d);
      openReader(chs, chs.findIndex(function (x) { return x.book === b && x.chapter === c; }), (d + 1) + "일째 본문");
    } else {
      openReader(bookQueue(b), c - 1, BR.BOOKS[b - 1].name);
    }
  }

  function bindEvents() {
    $("logoutBtn").addEventListener("click", sbLogout);
    $("todayChips").addEventListener("click", chipOpen);
    $("bmChips").addEventListener("click", chipOpen);

    $("overdueList").addEventListener("click", function (e) {
      var d = e.target.getAttribute("data-day");
      if (d == null) return;
      var chs = BR.dayChapters(+d);
      var first = chs.findIndex(function (x) { return !isRead(x.book, x.chapter); });
      openReader(chs, first < 0 ? 0 : first, (+d + 1) + "일째 본문");
    });

    $("tab-plan").addEventListener("click", function (e) {
      var d = e.target.getAttribute("data-read-day");
      if (d == null) return;
      var chs = BR.dayChapters(+d);
      var first = chs.findIndex(function (x) { return !isRead(x.book, x.chapter); });
      openReader(chs, first < 0 ? 0 : first, (+d + 1) + "일째 본문");
    });

    $("rdDoneBtn").addEventListener("click", readerDone);
    $("rdUndoBtn").addEventListener("click", async function () {
      var cur = reader.queue[reader.pos];
      if (cur) { await setRead([cur], false); renderReaderButtons(); }
    });
    $("rdPrevBtn").addEventListener("click", function () { if (reader.pos > 0) { reader.pos--; showReader(); } });
    $("rdNextBtn").addEventListener("click", function () { if (reader.pos < reader.queue.length - 1) { reader.pos++; showReader(); } });
    $("rdSmaller").addEventListener("click", function () { setFont(fontSize - 0.1); });
    $("rdBigger").addEventListener("click", function () { setFont(fontSize + 0.1); });
    $("readerModal").addEventListener("click", function (e) {
      if (e.target.id === "readerModal" || e.target.hasAttribute("data-close-reader")) closeReader();
    });
    document.addEventListener("keydown", function (e) {
      if (!$("readerModal").classList.contains("open")) return;
      if (e.key === "Escape") closeReader();
      if (e.key === "ArrowRight") $("rdNextBtn").click();
      if (e.key === "ArrowLeft") $("rdPrevBtn").click();
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
