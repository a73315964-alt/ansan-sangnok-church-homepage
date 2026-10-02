/* ============================================================
   1년 성경읽기 — 성도 화면(bible-reading.html)과 목사님 화면(bible-admin.html) 공통
   읽기표 데이터는 js/bible-plan.js (BIBLE_BOOKS, BIBLE_PLAN)
   ============================================================ */
(function () {
  var BOOKS = window.BIBLE_BOOKS;
  var PLAN = window.BIBLE_PLAN;
  var DAYS = PLAN.length;
  var WEEK = ["일", "월", "화", "수", "목", "금", "토"];

  var TOTAL = BOOKS.reduce(function (s, b) { return s + b.chapters; }, 0);

  // cum[d] = 1일째부터 d일째(0부터)까지 읽어야 할 장 수 합계
  var cum = [];
  PLAN.reduce(function (s, day, i) {
    var n = day.reduce(function (t, r) { return t + (r[2] - r[1] + 1); }, 0);
    cum[i] = s + n;
    return cum[i];
  }, 0);

  function key(book, chapter) { return book * 1000 + chapter; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // "2027-01-01" → 그 지역 날짜 0시
  function parseDate(s) {
    var p = String(s).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function toISO(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function today() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }

  // 시작일 기준 오늘이 몇 번째 날인지 (0 = 1일째, 음수 = 시작 전, DAYS 이상 = 끝남)
  function dayIndex(startDate, on) {
    return Math.round(((on || today()) - parseDate(startDate)) / 86400000);
  }
  function dateOfDay(startDate, d) { return addDays(parseDate(startDate), d); }

  function fmtDate(d, withWeek) {
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일" + (withWeek ? " (" + WEEK[d.getDay()] + ")" : "");
  }
  function fmtFull(d) { return d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate(); }
  function fmtAgo(ts) {
    if (!ts) return "기록 없음";
    var d = new Date(ts);
    var days = Math.floor((today() - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
    if (days <= 0) return "오늘";
    if (days === 1) return "어제";
    return days + "일 전";
  }

  function rangeLabel(r) {
    var b = BOOKS[r[0] - 1];
    return b.name + " " + (r[1] === r[2] ? r[1] : r[1] + "–" + r[2]) + "장";
  }
  function dayLabel(d) { return PLAN[d].map(rangeLabel).join(", "); }

  function dayChapters(d) {
    var out = [];
    PLAN[d].forEach(function (r) {
      for (var c = r[1]; c <= r[2]; c++) out.push({ book: r[0], chapter: c });
    });
    return out;
  }

  // 계획 대비: 읽은 장 수로 "몇 일째 분량까지 읽은 셈인지" 환산해 오늘과 비교
  //  양수 = 그만큼 밀림, 음수 = 앞섬, 0 = 계획대로
  function daysBehind(chaptersRead, todayIdx) {
    if (todayIdx < 0) return 0;
    var t = Math.min(todayIdx, DAYS - 1);
    var done = 0; // 다 읽은 셈인 날 수
    while (done < DAYS && cum[done] <= chaptersRead) done++;
    return (t + 1) - done;
  }
  function paceText(behind, todayIdx) {
    if (todayIdx < 0) return "시작 전";
    if (behind <= 0) return behind < 0 ? (-behind) + "일 앞섬" : "계획대로";
    return behind + "일 밀림";
  }
  function paceClass(behind, todayIdx) {
    if (todayIdx < 0 || behind <= 1) return "good";
    if (behind <= 7) return "warn";
    return "bad";
  }

  // 한 사람의 읽은 장 전부 (PostgREST 한 번 최대 1000줄이라 나눠서 받음)
  async function fetchReads(userId) {
    var rows = [];
    for (var from = 0; ; from += 1000) {
      var res = await window.SB.from("bible_reads")
        .select("book,chapter,read_at")
        .eq("user_id", userId)
        .order("book").order("chapter")
        .range(from, from + 999);
      if (res.error) throw res.error;
      rows = rows.concat(res.data);
      if (res.data.length < 1000) break;
    }
    return rows;
  }

  async function fetchSettings() {
    var res = await window.SB.from("reading_settings").select("start_date").eq("id", 1).maybeSingle();
    if (res.error) throw res.error;
    return res.data || { start_date: toISO(today()) };
  }

  window.BR = {
    BOOKS: BOOKS, PLAN: PLAN, DAYS: DAYS, TOTAL: TOTAL, cum: cum,
    key: key, esc: esc, parseDate: parseDate, toISO: toISO, today: today, addDays: addDays,
    dayIndex: dayIndex, dateOfDay: dateOfDay, fmtDate: fmtDate, fmtFull: fmtFull, fmtAgo: fmtAgo,
    rangeLabel: rangeLabel, dayLabel: dayLabel, dayChapters: dayChapters,
    daysBehind: daysBehind, paceText: paceText, paceClass: paceClass,
    fetchReads: fetchReads, fetchSettings: fetchSettings,
  };
})();
