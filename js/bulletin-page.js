/* ============================================================
   주보 페이지 — 주일 낮 예배, 주일 오후·수요 예배는
   설교 제목과 성경 본문, 기도자만 보여줍니다.
   내용을 바꾸려면 js/bulletins.js 를 고치시면 됩니다.
   ============================================================ */
(function () {
  var host = document.getElementById("bulletinDetail");
  if (!host) return;

  var list = window.BULLETINS || [];
  if (!list.length) {
    host.innerHTML = '<div class="empty-state">등록된 주보가 없습니다.</div>';
    return;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function morningHtml(m) {
    if (!m) return "";
    var order = m.order || [];
    var sermon = null, scripture = null, prayer = null;

    for (var i = 0; i < order.length; i++) {
      if (order[i].part === "설교") sermon = order[i];
      if (order[i].part === "성경봉독") scripture = order[i];
      if (order[i].part === "대표기도") prayer = order[i];
    }

    return (
      '<div class="wo-cards">' +
      '<div class="wo-card">' +
      "<h4>" + esc(m.name) + "</h4>" +
      '<dl><dt>설교</dt><dd class="wo-title">' + esc(sermon ? sermon.detail : "") + "</dd>" +
      "<dt>본문</dt><dd>" + esc(scripture ? scripture.detail : "") + "</dd>" +
      "<dt>기도</dt><dd>" + esc(prayer ? prayer.who : "") + "</dd></dl>" +
      "</div>" +
      "</div>"
    );
  }

  function servicesHtml(services) {
    if (!services || !services.length) return "";
    return (
      '<div class="wo-cards">' +
      services.map(function (s) {
        return (
          '<div class="wo-card">' +
          "<h4>" + esc(s.name) + "</h4>" +
          '<dl><dt>설교</dt><dd class="wo-title">' + esc(s.title) + "</dd>" +
          "<dt>본문</dt><dd>" + esc(s.scripture) + "</dd>" +
          "<dt>기도</dt><dd>" + esc(s.prayer) + "</dd></dl>" +
          "</div>"
        );
      }).join("") +
      "</div>"
    );
  }

  host.innerHTML = list.map(function (b) {
    return (
      '<article class="wo-week">' +
      '<div class="wo-week-head">' +
      "<h2>" + esc(b.dateLabel || b.date) + "</h2>" +
      (b.motto ? '<p class="wo-motto">표어 · ' + esc(b.motto) + "</p>" : "") +
      "</div>" +
      morningHtml(b.morning) +
      servicesHtml(b.services) +
      "</article>"
    );
  }).join("");
})();
