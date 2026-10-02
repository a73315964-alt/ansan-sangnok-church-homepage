/* ============================================================
   나의 대시보드 (dashboard.html) — 나의 신앙생활 한눈에
   - 성경읽기: 진도, 계획 대비, 연속 읽기, 최근 12주 기록, 오늘 본문
   - 교회: 이번 주 설교, 오늘의 묵상, 다음 예배, 교회 소식 (js/sermons.js 등 공개 자료)
   - 나의 교회 정보: 교적부 E-mail 이 로그인 이메일과 같을 때 본인 카드 (SQL실행하기/06_my_dashboard.sql)
   ============================================================ */
(function () {
  var BR = window.BR;
  var esc = BR.esc;
  var WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  var ROLE_LABEL = { super: "최고 관리자", admin: "관리자" };

  function $(id) { return document.getElementById(id); }
  function notice(html, kind) {
    $("notice").innerHTML = html ? '<div class="notice ' + (kind || "info") + '">' + html + "</div>" : "";
  }
  function dayKey(d) { return BR.toISO(d); }
  function fmtDate(s) { return s ? BR.fmtFull(BR.parseDate(s)) : ""; }

  /* ---------- 성경읽기 ---------- */

  function renderReading(reads, startDate) {
    var read = new Set(reads.map(function (r) { return BR.key(r.book, r.chapter); }));
    var n = read.size;
    var pct = Math.floor((n / BR.TOTAL) * 1000) / 10;
    $("tProgress").textContent = pct + "%";
    $("tProgressBar").style.width = pct + "%";
    $("tProgressSub").textContent = n + " / " + BR.TOTAL + "장";

    var idx = BR.dayIndex(startDate);
    var behind = BR.daysBehind(n, idx);
    $("tPace").textContent = BR.paceText(behind, idx);
    $("tPace").className = "value " + BR.paceClass(behind, idx);
    $("tPaceSub").textContent = idx < 0 ? BR.fmtFull(BR.parseDate(startDate)) + " 시작 (D-" + (-idx) + ")"
      : idx >= BR.DAYS ? "1년 읽기 기간 종료" : (idx + 1) + "일째 / " + BR.DAYS + "일";

    // 날짜별 읽은 장 수
    var perDay = {};
    reads.forEach(function (r) { var k = dayKey(new Date(r.read_at)); perDay[k] = (perDay[k] || 0) + 1; });

    // 연속 읽기: 오늘(또는 어제)부터 거꾸로 하루도 빠짐없이 읽은 날 수
    var today = BR.today();
    var d = perDay[dayKey(today)] ? today : BR.addDays(today, -1);
    var streak = 0;
    while (perDay[dayKey(d)]) { streak++; d = BR.addDays(d, -1); }
    var best = 0, run = 0;
    Object.keys(perDay).sort().forEach(function (k, i, arr) {
      run = i > 0 && dayKey(BR.addDays(BR.parseDate(arr[i - 1]), 1)) === k ? run + 1 : 1;
      best = Math.max(best, run);
    });
    $("tStreak").textContent = streak + "일";
    $("tStreak").className = "value" + (streak >= 7 ? " good" : "");
    $("tStreakSub").textContent = perDay[dayKey(today)] ? "오늘도 읽었습니다 · 최고 " + best + "일" : (streak ? "오늘 읽으면 " + (streak + 1) + "일째" : "오늘부터 시작해 보세요") + (best ? " · 최고 " + best + "일" : "");

    // 최근 12주 히트맵 (일요일 시작 주 단위)
    var end = today;
    var start = BR.addDays(end, -(7 * 11 + end.getDay()));
    var cells = "";
    for (var c = 0; c < 7 * 12; c++) {
      var day = BR.addDays(start, c);
      var k = dayKey(day);
      var v = perDay[k] || 0;
      var lv = v === 0 ? 0 : v <= 1 ? 1 : v <= 3 ? 2 : v <= 6 ? 3 : 4;
      var cls = day > end ? "future" : "l" + lv + (k === dayKey(today) ? " today" : "");
      cells += '<i class="' + cls + '" title="' + (day.getMonth() + 1) + "/" + day.getDate() + " (" + WEEK[day.getDay()] + ") · " + v + '장"></i>';
    }
    $("heatmap").innerHTML = cells;

    // 오늘의 성경읽기
    var dIdx = Math.min(Math.max(idx, 0), BR.DAYS - 1);
    $("todayReadDay").textContent = idx < 0 ? "시작 전 — 첫날 읽을 본문입니다" : idx >= BR.DAYS ? "1년 읽기 기간이 끝났습니다" : (idx + 1) + "일째 · " + BR.fmtDate(today, true);
    $("todayReading").textContent = BR.dayLabel(dIdx);
    var chs = BR.dayChapters(dIdx);
    var done = chs.filter(function (x) { return read.has(BR.key(x.book, x.chapter)); }).length;
    $("todayReadingState").innerHTML = done === chs.length
      ? '<span class="good">✓ 오늘 분량을 모두 읽었습니다.</span>'
      : done ? chs.length + "장 중 " + done + "장 읽음" : chs.length + "장 · 아직 읽지 않았습니다";
  }

  /* ---------- 설교 · 묵상 · 소식 ---------- */

  function renderChurch() {
    var s = (window.SERMONS || [])[0];
    $("sermonBox").innerHTML = s
      ? '<div class="sermon-meta">' + esc(s.dateLabel) + " · " + esc(s.series || "") + " · " + esc(s.preacher || "") + "</div>" +
        '<div class="sermon-title">' + esc(s.title) + "</div>" +
        '<div class="sermon-meta">' + esc(s.scripture || "") + "</div>" +
        (s.summary ? '<p class="sermon-sum">' + esc(s.summary) + "</p>" : "")
      : '<p class="desc">등록된 설교가 없습니다.</p>';

    var q = (window.DAILY_READING || [])[0];
    var p = (window.DAWN_PRAYER || [])[0];
    function devo(label, item, title) {
      if (!item) return '<div class="devo"><div class="k">' + label + '</div><p>아직 등록되지 않았습니다.</p></div>';
      return '<div class="devo"><div class="k">' + label + " · " + esc(item.dateLabel || "") + "</div>" +
        '<div class="r">' + esc(item.range || "") + "</div>" +
        (title ? '<div class="t">' + esc(title) + "</div>" : "") +
        "<p>" + esc(item.reflection || "") + "</p></div>";
    }
    $("devoBox").innerHTML = devo("매일 성경읽기 (QT)", q, q && q.title) + devo("새벽기도 묵상", p, p && p.series);

    $("newsList").innerHTML = (window.NEWS || []).slice(0, 3).map(function (nw) {
      return '<li><a href="news.html">' + esc(nw.title) + '</a><div class="d">' + esc(nw.dateLabel) + "</div></li>";
    }).join("") || '<li class="desc">소식이 없습니다.</li>';
  }

  /* ---------- 다음 예배 ---------- */

  // "주일 오전 예배 / 오전 11:00" → 요일·시각. 새벽기도회는 월~토로 봅니다.
  function worshipSlots() {
    return ((window.CHURCH || {}).worship || []).map(function (w) {
      var m = String(w.time).match(/(오전|오후)?\s*(\d{1,2}):(\d{2})/);
      if (!m) return null;
      var h = +m[2];
      if (m[1] === "오후" && h < 12) h += 12;
      if (m[1] === "오전" && h === 12) h = 0;
      var days = /주일/.test(w.name) ? [0] : /수요/.test(w.name) ? [3] : /금요/.test(w.name) ? [5] :
        /토요/.test(w.name) ? [6] : /새벽/.test(w.name) ? [1, 2, 3, 4, 5, 6] : null;
      return days ? { name: w.name, time: w.time, days: days, h: h, min: +m[3] } : null;
    }).filter(Boolean);
  }

  function renderWorship() {
    var slots = worshipSlots();
    var now = new Date();
    var next = null;
    for (var i = 0; i < 8 && !next; i++) {
      var day = BR.addDays(BR.today(), i);
      slots.filter(function (s) { return s.days.indexOf(day.getDay()) !== -1; })
        .map(function (s) { return { s: s, at: new Date(day.getFullYear(), day.getMonth(), day.getDate(), s.h, s.min) }; })
        .filter(function (x) { return x.at > now; })
        .sort(function (a, b) { return a.at - b.at; })
        .slice(0, 1)
        .forEach(function (x) { next = x; });
    }
    if (next) {
      var diffDays = Math.round((new Date(next.at.getFullYear(), next.at.getMonth(), next.at.getDate()) - BR.today()) / 86400000);
      var when = diffDays === 0 ? "오늘" : diffDays === 1 ? "내일" : diffDays + "일 후";
      var hrs = Math.floor((next.at - now) / 3600000);
      $("nextWorship").innerHTML = '<div class="next-worship"><div class="n">' + esc(next.s.name) + "</div>" +
        '<div class="w">' + when + " (" + WEEK[next.at.getDay()] + ") " + esc(next.s.time) + (diffDays === 0 && hrs >= 0 ? " · 약 " + Math.max(1, hrs) + "시간 후" : "") + "</div></div>";
    } else {
      $("nextWorship").innerHTML = "";
    }
    $("worshipList").innerHTML = ((window.CHURCH || {}).worship || []).map(function (w) {
      return "<li><span>" + esc(w.name) + "</span><span>" + esc(w.time) + "</span></li>";
    }).join("");
  }

  /* ---------- 나의 교회 정보 ---------- */

  function yearsText(fromIso) {
    if (!fromIso) return null;
    var d = BR.parseDate(fromIso);
    var t = BR.today();
    var months = (t.getFullYear() - d.getFullYear()) * 12 + (t.getMonth() - d.getMonth()) - (t.getDate() < d.getDate() ? 1 : 0);
    if (months < 1) return Math.max(0, Math.round((t - d) / 86400000)) + "일";
    var y = Math.floor(months / 12), m = months % 12;
    return (y ? y + "년 " : "") + (m ? m + "개월" : "").trim();
  }

  function renderMine(member, email) {
    var tags = [];
    if (member) {
      [member.position, member.faith_level, [member.district, member.group_label].filter(Boolean).join(" ")]
        .concat(member.service_orgs || []).filter(Boolean).forEach(function (t) { tags.push(t); });
      var yt = yearsText(member.registered_at);
      $("tYears").textContent = yt || "—";
      $("tYearsSub").textContent = member.registered_at
        ? fmtDate(member.registered_at) + " 등록" + (member.baptism_date ? " · 세례 " + (yearsText(member.baptism_date) || "") : "")
        : "등록일이 아직 기록되지 않았습니다";

      var rows = [
        ["직분", member.position], ["신급", member.faith_level],
        ["교구·구역", [member.district, member.group_label].filter(Boolean).join(" · ")],
        ["봉사기관", (member.service_orgs || []).join(", ")],
        ["세례일", fmtDate(member.baptism_date)], ["등록일", fmtDate(member.registered_at)],
        ["인도자", member.guide],
      ].filter(function (r) { return r[1]; });
      var fam = Array.isArray(member.family_members) ? member.family_members : [];
      $("myCard").innerHTML =
        (rows.length ? '<dl class="mine">' + rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" : '<p class="desc">교적 정보가 아직 비어 있습니다.</p>') +
        (fam.length ? '<ul class="fam-mini">' + fam.map(function (f) {
          return "<li><span>" + esc(f.name) + "</span><span>" + esc([f.relation, f.position].filter(Boolean).join(" · ")) + "</span></li>";
        }).join("") + "</ul>" : "") +
        '<p class="desc" style="margin:10px 0 0;">정보가 바뀌었으면 교회 사무실에 알려 주세요.</p>';
    } else {
      $("tYears").textContent = "—";
      $("tYearsSub").textContent = "교적이 연결되면 표시됩니다";
      $("myCard").innerHTML = '<p class="desc" style="margin:0;">아직 교적부와 연결되지 않았습니다.<br>교회 사무실에 <b>' + esc(email) +
        "</b> 을(를) 교적부 E-mail 로 등록해 달라고 요청하시면 직분·세례일·등록일·봉사기관·가족 정보가 여기에 나타납니다.</p>";
    }
    return tags;
  }

  /* ---------- 시작 ---------- */

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.SB_READY) { notice("Supabase 연결이 설정되지 않았습니다.", "error"); return; }
    var session = await sbRequireAuth();
    if (session === "redirect") return;
    var email = (session.user.email || "").toLowerCase();

    var t = BR.today();
    $("todayLine").textContent = t.getFullYear() + "년 " + (t.getMonth() + 1) + "월 " + t.getDate() + "일 " + WEEK[t.getDay()] + "요일";
    renderChurch();
    renderWorship();

    try {
      var results = await Promise.all([
        sbMyProfile(),
        sbMyRole(),
        BR.fetchSettings(),
        BR.fetchReads(session.user.id),
        window.SB.from("members").select("*").eq("email", email).limit(1),
      ]);
      var profile = results[0], role = results[1], settings = results[2], reads = results[3], memberRes = results[4];
      var member = memberRes.error ? null : (memberRes.data || [])[0] || null;

      var name = (profile && profile.name) || (member && member.name) || "";
      $("helloLine").textContent = (name ? name + " 님, " : "") + "오늘도 주님 안에서 평안하세요.";
      var tags = renderMine(member, email);
      if (role) tags.unshift(ROLE_LABEL[role]);
      if (profile && !profile.approved) tags.unshift("승인 대기");
      $("helloTags").innerHTML = tags.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
      $("adminLink").hidden = !role;

      if (profile && !profile.approved) {
        notice("<b>정회원 승인 대기 중입니다.</b> 가입 때 적은 성명·생년월일이 교적과 일치하지 않았습니다. " +
          '<a href="mypage.html">내 정보에서 다시 대조</a>하시거나, 관리자 등록을 기다려 주세요. 정회원이 되면 성경 본문·읽기 기록·나의 교회 정보를 쓸 수 있습니다.', "warn");
      }
      renderReading(reads, settings.start_date);
      $("main").hidden = false;
    } catch (err) {
      notice("불러오지 못했습니다: " + esc(err.message || err), "error");
    }
  });
})();
