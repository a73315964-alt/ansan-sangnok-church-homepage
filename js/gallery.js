/* ============================================================
   갤러리 — 사진 목록과 크게 보기(확대) 기능
   사진을 추가하려면 아래 PHOTOS 에 한 줄만 넣으면 됩니다.
     file    : 파일 이름 (자료실 photos/gallery/ 에 올린 이름)
     caption : 사진 아래에 보일 설명
   사진은 바탕화면 "교회자료업로드" 폴더로 올린 뒤 이름을 적어주세요.
   ============================================================ */
(function () {
  var BASE = ((window.CHURCH && window.CHURCH.filesBase) || "") + "/photos/gallery/";

  var PHOTOS = [
    { file: "01.jpg", caption: "제43차 안산시 복음화대성회" },
    { file: "02.jpg", caption: "복음화대성회 성가대 찬양" },
    { file: "03.jpg", caption: "복음화대성회 단체 기념사진" },
    { file: "04.jpg", caption: "복음화대성회 말씀 · 안산대학교" },
    { file: "05.jpg", caption: "성가대 찬양 — 말씀 앞에서" },
    { file: "06.jpg", caption: "성도 나들이 · 꽃길에서" },
    { file: "07.jpg", caption: "성도 나들이 · 단체 기념사진" },
    { file: "08.jpg", caption: "청년부 봄나들이" },
    { file: "09.jpg", caption: "강단에서 드리는 찬양과 기도" },
    { file: "10.jpg", caption: "예배 후 성도의 교제" },
    { file: "11.jpg", caption: "추수감사주일 이웃 나눔" },
    { file: "12.jpg", caption: "복음학교 강의" },
    { file: "13.jpg", caption: "복음학교 단체 기념사진" },
    { file: "14.jpg", caption: "축하 기념사진" },
    { file: "15.jpg", caption: "친교실에서의 교제" }
  ];

  var grid = document.getElementById("galleryGrid");
  if (!grid) return;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  grid.innerHTML = PHOTOS.map(function (p, i) {
    return (
      '<button type="button" class="gallery-item" data-i="' + i + '">' +
      '<img src="' + BASE + "thumb/" + p.file + '" alt="' + esc(p.caption) + '" loading="lazy" decoding="async">' +
      '<span class="gallery-caption">' + esc(p.caption) + "</span>" +
      "</button>"
    );
  }).join("");

  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("hidden", "");
  box.innerHTML =
    '<div class="lb-bar">' +
    '<a class="lb-home" href="index.html">' +
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
    '<path fill="currentColor" d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"/></svg>' +
    "홈으로</a>" +
    '<button type="button" class="lb-close">' +
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
    '<path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>' +
    "닫기</button>" +
    "</div>" +
    '<button type="button" class="lb-nav lb-prev" aria-label="이전 사진">&#8249;</button>' +
    '<figure class="lb-figure"><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="lb-nav lb-next" aria-label="다음 사진">&#8250;</button>';
  document.body.appendChild(box);

  var lbImg = box.querySelector("img");
  var lbCap = box.querySelector("figcaption");
  var current = 0;

  function show(i) {
    current = (i + PHOTOS.length) % PHOTOS.length;
    var p = PHOTOS[current];
    lbImg.src = BASE + p.file;
    lbImg.alt = p.caption;
    lbCap.textContent = p.caption + " (" + (current + 1) + "/" + PHOTOS.length + ")";
  }

  function open(i) {
    show(i);
    box.removeAttribute("hidden");
    document.body.classList.add("lb-open");
  }

  function close() {
    box.setAttribute("hidden", "");
    document.body.classList.remove("lb-open");
    lbImg.src = "";
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".gallery-item");
    if (btn) open(Number(btn.getAttribute("data-i")));
  });

  box.addEventListener("click", function (e) {
    if (e.target.closest(".lb-next")) show(current + 1);
    else if (e.target.closest(".lb-prev")) show(current - 1);
    else if (e.target.closest(".lb-close") || e.target === box) close();
  });

  document.addEventListener("keydown", function (e) {
    if (box.hasAttribute("hidden")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(current + 1);
    else if (e.key === "ArrowLeft") show(current - 1);
  });
})();
