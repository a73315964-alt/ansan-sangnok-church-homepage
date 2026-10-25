/* 달란트 — 성경 1장 읽기 · 새벽묵상 읽기 · 나눔 글 → 각 1달란트 (하루 최대 3)
   파란 달란트 5개 = 노란 달란트 1개. DB: SQL실행하기/17_talents.sql */
(function () {
  var host = document.getElementById("talentBox");
  if (!host) return;
  var month = new Date(Date.now() + 9 * 3600 * 1000); // 한국시간 기준 이번 달
  var cur = { y: month.getUTCFullYear(), m: month.getUTCMonth() };
  var todayKst = month.toISOString().slice(0, 10);
  var rows = [], approved = false, last = -1;

  function pad(n) { return String(n).padStart(2, "0"); }
  function monthStr() { return cur.y + "-" + pad(cur.m + 1) + "-01"; }
  function isNow() { return monthStr().slice(0, 7) === todayKst.slice(0, 7); }
  function total() { return rows.reduce(function (n, r) { return n + (r.bible ? 1 : 0) + (r.devo ? 1 : 0) + (r.share ? 1 : 0); }, 0); }
  function sums() {
    return {
      bible: rows.filter(function (r) { return r.bible; }).length,
      devo: rows.filter(function (r) { return r.devo; }).length,
      share: rows.filter(function (r) { return r.share; }).length,
    };
  }
  function stackKey() { return "talentSeen:" + monthStr().slice(0, 7); }
  function seen() { try { return parseInt(localStorage.getItem(stackKey()), 10); } catch (e) { return NaN; } }
  function remember(n) { try { localStorage.setItem(stackKey(), String(n)); } catch (e) {} }

  function pillar(n) {
    var gold = Math.floor(n / 5), blue = n % 5, prev = seen();
    if (isNaN(prev) || prev > n) prev = n; // 처음 보는 달은 애니메이션 없이
    var coins = [], i;
    for (i = 0; i < gold; i++) coins.push({ c: "gold", idx: (i + 1) * 5 });
    for (i = 0; i < blue; i++) coins.push({ c: "blue", idx: gold * 5 + i + 1 });
    // 아래부터 노랑, 그 위에 파랑. 새로 쌓인 것은 위에서 떨어짐
    var html = coins.map(function (k) {
      var fresh = k.idx > prev && (k.c === "blue" || k.idx > prev);
      return '<span class="coin ' + k.c + (fresh ? " drop" : "") + '" title="' + (k.c === "gold" ? "노란 달란트(5)" : "파란 달란트(1)") + '"></span>';
    }).reverse().join("");
    remember(n);
    return '<div class="tal-pillar" aria-label="이번 달 달란트 ' + n + '개">' + (html || '<span class="tal-empty">아직 없어요</span>') + "</div>";
  }

  function calendar() {
    var first = new Date(Date.UTC(cur.y, cur.m, 1)), days = new Date(Date.UTC(cur.y, cur.m + 1, 0)).getUTCDate();
    var map = {};
    rows.forEach(function (r) { map[r.day] = r; });
    var cells = [], i;
    for (i = 0; i < first.getUTCDay(); i++) cells.push('<span class="tal-cell off"></span>');
    for (i = 1; i <= days; i++) {
      var key = cur.y + "-" + pad(cur.m + 1) + "-" + pad(i), r = map[key];
      var n = r ? (r.bible ? 1 : 0) + (r.devo ? 1 : 0) + (r.share ? 1 : 0) : 0;
      cells.push('<span class="tal-cell' + (key === todayKst ? " today" : "") + (n ? " got" : "") + '">' +
        '<b>' + i + "</b>" + (n ? '<i class="tal-dots">' + (r.bible ? '<em class="b">읽</em>' : "") + (r.devo ? '<em class="d">묵</em>' : "") + (r.share ? '<em class="s">나</em>' : "") + "</i>" : "") + "</span>");
    }
    return '<div class="tal-cal">' + ["일", "월", "화", "수", "목", "금", "토"].map(function (d) { return '<span class="tal-dow">' + d + "</span>"; }).join("") + cells.join("") + "</div>";
  }

  function render() {
    var n = total(), s = sums(), today = rows.filter(function (r) { return r.day === todayKst; })[0] || {};
    host.innerHTML =
      '<div class="tal-head"><h4>나의 달란트</h4><p>성경 1장 읽기 · 새벽 묵상 읽기 · 나눔 글 쓰기, 각각 하루 1달란트씩 쌓여요.</p></div>' +
      '<div class="tal-body">' +
        '<div class="tal-left">' + pillar(n) + '<div class="tal-legend"><span><i class="coin blue sm"></i> 1달란트</span><span><i class="coin gold sm"></i> 5달란트</span></div></div>' +
        '<div class="tal-right">' +
          '<div class="tal-total"><b>' + n + '</b> 달란트<small>' + (cur.m + 1) + '월 · 노란 ' + Math.floor(n / 5) + ' · 파란 ' + (n % 5) + "</small></div>" +
          '<ul class="tal-sum"><li><em class="b">읽</em> 성경 읽은 날 <b>' + s.bible + '</b>일</li><li><em class="d">묵</em> 묵상 읽은 날 <b>' + s.devo + '</b>일</li><li><em class="s">나</em> 나눔 쓴 날 <b>' + s.share + "</b>일</li></ul>" +
          (isNow() ? '<div class="tal-today">오늘: ' + (today.bible ? "📖 성경 ✔ " : "📖 성경 ✕ ") + (today.devo ? "🙏 묵상 ✔ " : "🙏 묵상 ✕ ") + (today.share ? "✍ 나눔 ✔" : "✍ 나눔 ✕") + "</div>" : "") +
          (isNow() && approved && !today.devo ? '<button type="button" class="btn btn-primary tal-read" id="talRead">오늘 묵상 읽었어요 (+1달란트)</button>' : "") +
        "</div></div>" +
      '<div class="tal-nav"><button type="button" id="talPrev" aria-label="이전 달">‹</button><span>' + cur.y + "년 " + (cur.m + 1) + '월</span><button type="button" id="talNext" aria-label="다음 달"' + (isNow() ? " disabled" : "") + ">›</button></div>" + calendar();
    var rd = document.getElementById("talRead");
    if (rd) rd.addEventListener("click", async function () {
      rd.disabled = true;
      var res = await window.SB.rpc("record_devotion_read");
      if (res.error) { rd.disabled = false; alert("저장하지 못했습니다. 잠시 후 다시 시도해 주세요."); return; }
      load();
    });
    document.getElementById("talPrev").addEventListener("click", function () { cur.m--; if (cur.m < 0) { cur.m = 11; cur.y--; } load(); });
    document.getElementById("talNext").addEventListener("click", function () { cur.m++; if (cur.m > 11) { cur.m = 0; cur.y++; } load(); });
  }

  async function load() {
    var session = await sbCurrentSession();
    if (!session) {
      host.innerHTML = '<div class="tal-head"><h4>나의 달란트</h4><p>로그인하면 읽고 나눈 만큼 달란트가 쌓여요.</p></div>' +
        '<div class="share-notice"><a class="btn btn-primary" href="login.html?next=' + encodeURIComponent("today-word.html") + '">로그인하기</a></div>';
      return;
    }
    var p = await sbMyProfile();
    approved = !!(p && p.approved && !p.suspended);
    var res = await window.SB.rpc("my_talents", { p_month: monthStr() });
    if (res.error) {
      host.innerHTML = '<div class="tal-head"><h4>나의 달란트</h4><p>달란트를 준비하고 있습니다.</p></div>';
      return;
    }
    rows = (res.data || []).map(function (r) { return { day: String(r.day).slice(0, 10), bible: r.bible, devo: r.devo, share: r.share }; });
    render();
  }

  window.addEventListener("talent-refresh", load);
  window.addEventListener("pageshow", function (e) { if (e.persisted) load(); });
  if (window.SB_READY) load();
})();
