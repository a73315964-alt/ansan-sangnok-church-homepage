/* ============================================================
   공통 동작: 정보 자동 채우기, 지도, 목록 렌더링
   ============================================================ */
(function () {
  var C = window.CHURCH || {};

  function fillFields() {
    document.querySelectorAll("[data-field]").forEach(function (el) {
      var key = el.getAttribute("data-field");
      var val = key.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, C);
      if (val) el.textContent = val;
    });
    document.querySelectorAll("[data-href-field]").forEach(function (el) {
      var key = el.getAttribute("data-href-field");
      if (key === "tel" && C.phone) el.setAttribute("href", "tel:" + C.phone.replace(/[^0-9+]/g, ""));
      if (key === "mail" && C.email) el.setAttribute("href", "mailto:" + C.email);
    });
    document.title = document.title.replace(/\{\{church\}\}/g, C.name || "");
  }

  function setupMap() {
    var frame = document.getElementById("mapFrame");
    if (!frame) return;
    var q = encodeURIComponent(C.mapQuery || C.address || "");
    frame.src = "https://maps.google.com/maps?q=" + q + "&t=&z=16&ie=UTF8&iwloc=&output=embed";
  }

  function renderWorship() {
    var host = document.getElementById("worshipList");
    if (!host || !C.worship) return;
    host.innerHTML = C.worship.map(function (w) {
      return (
        '<div class="worship-row">' +
        '<div class="name">' + w.name + "</div>" +
        '<div class="time">' + w.time + "</div>" +
        '<p class="desc">' + (w.desc || "") + "</p>" +
        "</div>"
      );
    }).join("");
  }

  function renderWorshipMini() {
    var host = document.getElementById("worshipMini");
    if (!host || !C.worship) return;
    host.innerHTML = C.worship.slice(0, 3).map(function (w) {
      return '<div><div class="k">' + w.name + '</div><div class="v">' + w.time + "</div></div>";
    }).join("");
  }

  function dparts(dateStr) {
    var d = new Date(dateStr);
    var months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
    return { day: d.getDate(), month: months[d.getMonth()] };
  }

  function renderBulletins(limit) {
    var host = document.getElementById("bulletinList");
    if (!host) return;
    var items = (window.BULLETINS || []).slice(0, limit || undefined);
    if (!items.length) {
      host.innerHTML = '<div class="empty-state">등록된 주보가 없습니다.</div>';
      return;
    }
    host.innerHTML = items.map(function (b) {
      var d = dparts(b.date);
      return (
        '<div class="list-item">' +
        '<div class="date"><span class="d">' + d.day + '</span><span class="m">' + d.month + "</span></div>" +
        "<div><h4>" + b.title + "</h4><p>" + (b.scripture || "") + " · " + (b.preacher || "") + "</p></div>" +
        "</div>"
      );
    }).join("");
  }

  function renderSermons(limit) {
    var host = document.getElementById("sermonList");
    if (!host) return;
    var items = (window.SERMONS || []).slice(0, limit || undefined);
    if (!items.length) {
      host.innerHTML = '<div class="empty-state">등록된 설교가 없습니다.</div>';
      return;
    }
    host.innerHTML = items.map(function (s) {
      var d = dparts(s.date);
      return (
        '<div class="list-item">' +
        '<div class="date"><span class="d">' + d.day + '</span><span class="m">' + d.month + "</span></div>" +
        "<div><span class=\"tag-pill\">" + (s.series || "설교") + "</span><h4>" + s.title + "</h4>" +
        "<p>" + (s.scripture || "") + " · " + (s.preacher || "") + "</p></div>" +
        (s.youtube
          ? '<a class="btn btn-outline" target="_blank" rel="noopener" href="https://youtu.be/' + s.youtube + '">영상 보기</a>'
          : "") +
        "</div>"
      );
    }).join("");
  }

  function renderNews(limit) {
    var host = document.getElementById("newsList");
    if (!host) return;
    var items = (window.NEWS || []).slice(0, limit || undefined);
    if (!items.length) {
      host.innerHTML = '<div class="empty-state">등록된 공지사항이 없습니다.</div>';
      return;
    }
    host.innerHTML = items.map(function (n) {
      var d = dparts(n.date);
      return (
        '<div class="list-item">' +
        '<div class="date"><span class="d">' + d.day + '</span><span class="m">' + d.month + "</span></div>" +
        "<div><h4>" + n.title + "</h4><p>" + (n.body || "") + "</p></div>" +
        "</div>"
      );
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillFields();
    setupMap();
    renderWorship();
    renderWorshipMini();
    renderBulletins(document.body.getAttribute("data-page") === "bulletin" ? null : 3);
    renderSermons(document.body.getAttribute("data-page") === "sermon" ? null : 3);
    renderNews(document.body.getAttribute("data-page") === "news" ? null : 4);
  });
})();
