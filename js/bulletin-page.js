/* ============================================================
   주보 페이지 — 주일 낮 예배는 순서 전체를, 주일 오후·수요 예배는
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
    var rows = (m.order || []).map(function (o) {
      return (
        '<tr' + (o.highlight ? ' class="is-sermon"' : "") + ">" +
        '<th scope="row">' + (o.stand ? '<span class="wo-star" aria-hidden="true">※</span>' : "") + esc(o.part) + "</th>" +
        '<td class="wo-detail">' + esc(o.detail || "") + "</td>" +
        '<td class="wo-who">' + esc(o.who || "") + "</td>" +
        "</tr>"
      );
    }).join("");

    return (
      '<section class="wo-block">' +
      '<div class="wo-head">' +
      "<h3>" + esc(m.name) + (m.time ? ' <span class="wo-time">' + esc(m.time) + "</span>" : "") + "</h3>" +
      (m.note ? '<p class="wo-note">' + esc(m.note) + "</p>" : "") +
      (m.verse ? '<p class="wo-verse">' + esc(m.verse) + "</p>" : "") +
      "</div>" +
      '<div class="wo-scroll"><table class="wo-table"><tbody>' + rows + "</tbody></table></div>" +
      '<p class="wo-foot">※ 표시된 순서에는 자리에서 일어섭니다. 예배 10분 전에 예배당에 자리해 주시기 바랍니다.</p>' +
      "</section>"
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
