/* ============================================================
   성경속으로 (word.html) — 교회 전경 인트로, 이번 주 설교(영상+설교문),
   매일 성경읽기, 새벽기도 묵상, 지난 말씀 아카이브
   ============================================================ */
(function () {
  var sermonIndex = 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function dparts(dateStr) {
    var d = new Date(dateStr);
    var months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
    return { day: d.getDate(), month: months[d.getMonth()] };
  }

  function revealHero() {
    var bg = document.getElementById("wordHeroBg");
    var content = document.getElementById("wordHeroContent");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (bg) bg.classList.add("is-visible");
        if (content) content.classList.add("is-visible");
      });
    });
  }

  function renderSermonFeature() {
    var host = document.getElementById("sermonFeature");
    var list = window.SERMONS || [];
    if (!host) return;
    if (!list.length) {
      host.innerHTML = '<div class="body"><div class="empty-state">등록된 설교가 없습니다.</div></div>';
      return;
    }
    var s = list[sermonIndex];
    var videoHtml = s.youtube
      ? '<div class="video-frame"><iframe src="https://www.youtube.com/embed/' + esc(s.youtube) +
        '" title="' + esc(s.title) + ' 설교 영상" allowfullscreen loading="lazy"></iframe></div>'
      : '<div class="video-frame"><div class="video-empty">🎥 설교 영상은 준비 중입니다<br>(js/sermons.js 의 youtube 항목에 영상 ID를 넣으면 표시됩니다)</div></div>';

    var manuscriptHtml = s.manuscript
      ? '<div class="manuscript-inner">' + esc(s.manuscript) + "</div>"
      : '<div class="manuscript-inner">설교문이 아직 등록되지 않았습니다.</div>';

    host.innerHTML =
      videoHtml +
      '<div class="body">' +
      '<div class="meta">' + esc(s.dateLabel) + " · " + esc(s.series || "주일예배") + "</div>" +
      "<h3>" + esc(s.title) + "</h3>" +
      '<div class="scripture">' + esc(s.scripture) + " · " + esc(s.preacher) + "</div>" +
      (s.summary ? '<div class="quote-block">' + esc(s.summary) + "</div>" : "") +
      '<button class="manuscript-toggle" id="manuscriptToggle" type="button">' +
      '<span class="arrow">▾</span> 설교문 보기</button>' +
      '<div class="manuscript" id="manuscriptBody">' + manuscriptHtml + "</div>" +
      "</div>";

    var toggle = document.getElementById("manuscriptToggle");
    var body = document.getElementById("manuscriptBody");
    if (toggle && body) {
      toggle.addEventListener("click", function () {
        var open = body.classList.toggle("open");
        toggle.classList.toggle("open", open);
        toggle.innerHTML = '<span class="arrow">▾</span> ' + (open ? "설교문 접기" : "설교문 보기");
      });
    }

    var prevBtn = document.getElementById("sermonPrev");
    var nextBtn = document.getElementById("sermonNext");
    var count = document.getElementById("sermonCount");
    if (prevBtn) prevBtn.disabled = sermonIndex >= list.length - 1; // 더 이전 주
    if (nextBtn) nextBtn.disabled = sermonIndex <= 0; // 더 최근 주
    if (count) count.textContent = (sermonIndex + 1) + " / " + list.length;
  }

  function renderDevotionCard(hostId, data, opts) {
    var host = document.getElementById(hostId);
    if (!host) return;
    var list = data || [];
    if (!list.length) {
      host.innerHTML = '<div class="empty-state">' + opts.emptyText + "</div>";
      return;
    }
    var today = list[0];
    host.innerHTML =
      '<span class="date-badge">' + esc(today.dateLabel) + "</span>" +
      (opts.series ? '<div class="range">' + esc(today.series) + "</div>" : "") +
      '<div class="range">' + esc(today.range) + "</div>" +
      "<h3>" + esc(today.title || "") + "</h3>" +
      '<p class="reflection">' + esc(today.reflection) + "</p>";
  }

  function renderDevotionHistory(hostId, data) {
    var host = document.getElementById(hostId);
    if (!host) return;
    var list = (data || []).slice(1); // 오늘 것 제외한 지난 기록
    if (!list.length) {
      host.innerHTML = "";
      return;
    }
    host.innerHTML = list.map(function (item) {
      var d = dparts(item.date);
      return (
        '<div class="list-item">' +
        '<div class="date"><span class="d">' + d.day + '</span><span class="m">' + d.month + "</span></div>" +
        "<div><h4>" + esc(item.title || item.series || "") + "</h4><p>" + esc(item.range) + "</p></div>" +
        "</div>"
      );
    }).join("");
  }

  function renderArchive() {
    var host = document.getElementById("archiveList");
    if (!host) return;
    var list = window.SERMONS || [];
    if (!list.length) {
      host.innerHTML = '<div class="empty-state">등록된 설교가 없습니다.</div>';
      return;
    }
    host.innerHTML = list.map(function (s) {
      var d = dparts(s.date);
      return (
        '<div class="list-item">' +
        '<div class="date"><span class="d">' + d.day + '</span><span class="m">' + d.month + "</span></div>" +
        "<div><span class=\"tag-pill\">" + esc(s.series || "설교") + "</span><h4>" + esc(s.title) + "</h4>" +
        "<p>" + esc(s.scripture) + " · " + esc(s.preacher) + "</p></div>" +
        '<a class="btn btn-outline" href="sermon.html">설교 보기</a>' +
        "</div>"
      );
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    revealHero();
    renderSermonFeature();
    renderDevotionCard("dailyReadingCard", window.DAILY_READING, { emptyText: "오늘의 성경읽기가 아직 등록되지 않았습니다." });
    renderDevotionHistory("dailyReadingHistory", window.DAILY_READING);
    renderDevotionCard("dawnPrayerCard", window.DAWN_PRAYER, { emptyText: "오늘의 새벽기도 묵상이 아직 등록되지 않았습니다.", series: true });
    renderDevotionHistory("dawnPrayerHistory", window.DAWN_PRAYER);
    renderArchive();

    var prevBtn = document.getElementById("sermonPrev");
    var nextBtn = document.getElementById("sermonNext");
    if (prevBtn) prevBtn.addEventListener("click", function () {
      var list = window.SERMONS || [];
      if (sermonIndex < list.length - 1) { sermonIndex++; renderSermonFeature(); }
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      if (sermonIndex > 0) { sermonIndex--; renderSermonFeature(); }
    });

    var historyToggles = document.querySelectorAll("[data-history-toggle]");
    historyToggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.getAttribute("data-history-toggle"));
        if (!target) return;
        var open = target.classList.toggle("open");
        btn.textContent = open ? "묵상 기록 접기" : "지난 묵상 보기";
      });
    });
  });
})();
