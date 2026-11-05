/* ============================================================
   갤러리 — 로그인한 승인 성도만 볼 수 있습니다.
   · 새 사진: 비공개 저장소(Supabase gallery 버킷)에 보관 — 관리자가 이 화면에서 직접 올립니다.
     (SQL실행하기/20_gallery_private.sql 을 먼저 실행해야 합니다)
   · 예전 사진: 자료실(files.ansansangrok.or.kr)에 있는 것 — 아래 PHOTOS 에 file 로 적혀 있습니다.
   group : "youth"(청년부 사진방) / "adult"(장년 사진방) — 없으면 전체에만 보입니다.
   ============================================================ */
(function () {
  var BASE = ((window.CHURCH && window.CHURCH.filesBase) || "") + "/photos/gallery/";

  var PHOTOS = [
    { local: "2026-rice-chocho", caption: "초지주민센터에 쌀 10포 전달" },
    { local: "2026-harvest-1", group: "adult", caption: "2026 추수감사주일 · 강단 꾸미기" },
    { local: "2026-harvest-2", group: "adult", caption: "2026 추수감사주일 · 감사의 예물" },
    { local: "2026-friends-3", group: "youth", caption: "승주와 두 자매" },
    { local: "2026-praise", group: "youth", caption: "승주와 예린 자매의 찬양" },
    { local: "2026-quiz-1", group: "youth", caption: "2026 성경퀴즈대회 · 사회 청년부 병현·현준 형제" },
    { local: "2026-quiz-2", group: "adult", caption: "2026 성경퀴즈대회 · 성도들" },
    { local: "2026-quiz-3", group: "adult", caption: "2026 성경퀴즈대회 · 함께한 성도들" },
    { local: "2026-quiz-4", group: "adult", caption: "2026 성경퀴즈대회 · 즐거운 교제" },
    { local: "2026-80th", group: "adult", caption: "김타관 집사님 팔순 축하" },
    { file: "01.jpg", caption: "제43차 안산시 복음화대성회" },
    { file: "02.jpg", caption: "복음화대성회 성가대 찬양" },
    { file: "03.jpg", caption: "복음화대성회 단체 기념사진" },
    { file: "04.jpg", caption: "복음화대성회 말씀 · 안산대학교" },
    { file: "05.jpg", caption: "성가대 찬양 — 말씀 앞에서" },
    { file: "06.jpg", group: "adult", caption: "성도 나들이 · 꽃길에서" },
    { file: "07.jpg", group: "adult", caption: "성도 나들이 · 단체 기념사진" },
    { file: "08.jpg", group: "youth", caption: "청년부 봄나들이" },
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
  var tabsEl = document.getElementById("galleryTabs");
  var BUCKET = "gallery", lastMsg = "", isAdmin = false, all = [], view = [], filter = "all", box, lbImg, lbCap, lbDel, current = 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function lock(msg, withLogin) {
    if (tabsEl) tabsEl.hidden = true;
    grid.innerHTML = '<div class="gallery-lock"><p>🔒 ' + msg + "</p>" +
      (withLogin ? '<a class="btn btn-primary" href="login.html?next=' + encodeURIComponent("community.html#gallery") + '">로그인하기</a>' : "") + "</div>";
  }
  lock("사진방은 로그인한 성도만 볼 수 있습니다.", false);

  (async function () {
    try {
      if (!window.SB_READY || typeof sbCurrentSession !== "function") return;
      var s = await sbCurrentSession();
      if (!s) { lock("사진방은 로그인한 성도만 볼 수 있습니다.", true); return; }
      var pr = await sbMyProfile();
      if (!(pr && pr.approved && !pr.suspended)) { lock("가입 승인이 끝난 성도만 사진방을 볼 수 있습니다. 승인되면 열립니다.", false); return; }
      try { isAdmin = await sbIsAdmin(); } catch (e) { isAdmin = false; }
      if (tabsEl) tabsEl.hidden = false;
      buildLightbox(); bindTabs();
      await load();
    } catch (e) { /* 확인하지 못하면 잠긴 상태 유지 */ }
  })();

  /* ---------- 사진 목록 만들기 ---------- */
  var dbRows = [];
  async function load() {
    var made = [], migrated = {};
    try {
      var res = await window.SB.from("gallery_photos").select("*").order("created_at", { ascending: false });
      if (!res.error && res.data && res.data.length) {
        dbRows = res.data;
        var paths = [];
        dbRows.forEach(function (r) { paths.push(r.path); paths.push(r.thumb_path); });
        var sg = await window.SB.storage.from(BUCKET).createSignedUrls(paths, 3600), map = {};
        (sg.data || []).forEach(function (x) { if (x.signedUrl) map[x.path] = x.signedUrl; });
        dbRows.forEach(function (r) {
          if (r.src_key) migrated[r.src_key] = true;
          if (map[r.path]) made.push({ id: r.id, path: r.path, thumbPath: r.thumb_path, group: r.grp || "", caption: r.caption || "", thumb: map[r.thumb_path] || map[r.path], full: map[r.path] });
        });
      } else dbRows = [];
    } catch (e) { dbRows = []; }
    PHOTOS.forEach(function (p) {
      if (p.local) {
        if (migrated[p.local]) return;
        made.push({ group: p.group || "", caption: p.caption, thumb: "images/gallery/thumb/" + p.local + ".jpg", full: "images/gallery/" + p.local + ".jpg", legacy: p });
      } else made.push({ group: p.group || "", caption: p.caption, thumb: BASE + "thumb/" + p.file, full: BASE + p.file });
    });
    all = made; applyFilter(); renderAdmin();
  }
  function applyFilter() {
    view = filter === "all" ? all : all.filter(function (p) { return p.group === filter; });
    grid.innerHTML = view.map(function (p, i) {
      return '<button type="button" class="gallery-item" data-i="' + i + '">' +
        '<img src="' + esc(p.thumb) + '" alt="' + esc(p.caption) + '" loading="lazy" decoding="async">' +
        '<span class="gallery-caption">' + esc(p.caption) + "</span></button>";
    }).join("") || '<p class="gallery-empty">아직 올라온 사진이 없습니다.</p>';
  }
  function bindTabs() {
    if (!tabsEl) return;
    tabsEl.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-g]");
      if (!b) return;
      filter = b.getAttribute("data-g");
      [].forEach.call(tabsEl.querySelectorAll("button"), function (x) {
        var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false");
      });
      applyFilter();
    });
  }

  /* ---------- 관리자: 사진 올리기 · 옮기기 · 삭제 ---------- */
  function toBlob(canvas, q) { return new Promise(function (ok) { canvas.toBlob(ok, "image/jpeg", q); }); }
  async function shrink(src, max, q) {
    var bmp;
    try { bmp = await createImageBitmap(src, { imageOrientation: "from-image" }); }
    catch (e) { bmp = await createImageBitmap(src); }
    var k = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);   // 다시 그리면 촬영 위치 같은 숨은 정보가 사라집니다
    return toBlob(c, q);
  }
  async function putPhoto(blobSrc, caption, group, srcKey, when) {
    var id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    var ym = new Date().toISOString().slice(0, 7).replace("-", ""), path = ym + "/" + id + ".jpg", tp = "thumb/" + path;
    var full = await shrink(blobSrc, 1600, 0.82), th = await shrink(blobSrc, 480, 0.78), st = window.SB.storage.from(BUCKET);
    var u1 = await st.upload(path, full, { contentType: "image/jpeg", upsert: false }); if (u1.error) throw u1.error;
    var u2 = await st.upload(tp, th, { contentType: "image/jpeg", upsert: false }); if (u2.error) throw u2.error;
    var row = { path: path, thumb_path: tp, caption: caption || "", grp: group || null, src_key: srcKey || null };
    if (when) row.created_at = when;
    var ins = await window.SB.from("gallery_photos").insert(row); if (ins.error) throw ins.error;
  }
  function renderAdmin() {
    var host = document.getElementById("galleryAdmin");
    if (!isAdmin) { if (host) host.remove(); return; }
    if (!host) {
      host = document.createElement("details"); host.id = "galleryAdmin"; host.className = "gallery-admin";
      grid.parentNode.insertBefore(host, grid);
    }
    var legacy = all.filter(function (p) { return p.legacy; }).length;
    var wasOpen = host.open;
    host.innerHTML = "<summary>📤 사진 올리기 (관리자)</summary>" +
      '<div class="ga-body"><label>사진 고르기 (여러 장 가능)<input type="file" id="gaFiles" accept="image/*" multiple></label>' +
      '<label>설명 (여러 장이면 모두 같은 설명)<input type="text" id="gaCap" maxlength="80" placeholder="예) 2026 추수감사주일"></label>' +
      '<label>사진방<select id="gaGrp"><option value="">전체에만 보이기</option><option value="youth">청년부 사진방</option><option value="adult">장년 사진방</option></select></label>' +
      '<button type="button" class="btn btn-primary" id="gaGo">올리기</button>' +
      (legacy ? '<button type="button" class="btn btn-outline" id="gaMove">기존 사진 ' + legacy + "장 비공개 저장소로 옮기기</button>" : "") +
      '<p class="ga-msg" id="gaMsg" role="status"></p></div>';
    host.open = wasOpen;
    var msg = document.getElementById("gaMsg");
    msg.textContent = lastMsg;
    document.getElementById("gaGo").addEventListener("click", async function () {
      var files = document.getElementById("gaFiles").files;
      if (!files.length) { msg.textContent = "사진을 먼저 골라 주세요."; return; }
      var cap = document.getElementById("gaCap").value.trim(), grp = document.getElementById("gaGrp").value, n = 0;
      this.disabled = true;
      try {
        for (var i = 0; i < files.length; i++) { msg.textContent = "올리는 중… " + (i + 1) + " / " + files.length; await putPhoto(files[i], cap, grp, null); n++; }
        lastMsg = n + "장을 올렸습니다."; await load();
      } catch (e) { msg.textContent = "올리지 못했습니다: " + (e.message || e); }
      this.disabled = false;
    });
    var mv = document.getElementById("gaMove");
    if (mv) mv.addEventListener("click", async function () {
      var list = all.filter(function (p) { return p.legacy; }), done = 0; mv.disabled = true;
      try {
        for (var i = 0; i < list.length; i++) {
          msg.textContent = "옮기는 중… " + (i + 1) + " / " + list.length;
          var b = await (await fetch(list[i].full)).blob();
          await putPhoto(b, list[i].caption, list[i].group, list[i].legacy.local, new Date(Date.now() - i * 1000).toISOString()); done++;
        }
        lastMsg = done + "장을 옮겼습니다. 이제 이 사진들은 로그인한 성도만 볼 수 있습니다."; await load();
      } catch (e) { msg.textContent = "옮기지 못했습니다(" + done + "장 완료): " + (e.message || e); mv.disabled = false; }
    });
  }

  /* ---------- 크게 보기 ---------- */
  function buildLightbox() {
    box = document.createElement("div");
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


    lbImg = box.querySelector("img"); lbCap = box.querySelector("figcaption");
    lbDel = document.createElement("button"); lbDel.type = "button"; lbDel.className = "lb-del"; lbDel.textContent = "🗑 이 사진 삭제"; lbDel.hidden = true;
    box.querySelector(".lb-bar").insertBefore(lbDel, box.querySelector(".lb-close"));
    box.addEventListener("click", function (e) {
      if (e.target.closest(".lb-del")) { removeCurrent(); return; }
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
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".gallery-item");
      if (btn) open(Number(btn.getAttribute("data-i")));
    });
  }
  function show(i) {
    if (!view.length) return;
    current = (i + view.length) % view.length;
    var p = view[current];
    lbImg.src = p.full; lbImg.alt = p.caption;
    lbCap.textContent = p.caption + " (" + (current + 1) + "/" + view.length + ")";
    lbDel.hidden = !(isAdmin && p.id);
  }
  function open(i) { show(i); box.removeAttribute("hidden"); document.body.classList.add("lb-open"); }
  function close() { box.setAttribute("hidden", ""); document.body.classList.remove("lb-open"); lbImg.src = ""; }
  async function removeCurrent() {
    var p = view[current];
    if (!p || !p.id || !window.confirm("이 사진을 완전히 삭제할까요? 되돌릴 수 없습니다.\n" + p.caption)) return;
    try {
      var st = await window.SB.storage.from(BUCKET).remove([p.path, p.thumbPath]); if (st.error) throw st.error;
      var d = await window.SB.from("gallery_photos").delete().eq("id", p.id); if (d.error) throw d.error;
      close(); await load();
    } catch (e) { window.alert("삭제하지 못했습니다: " + (e.message || e)); }
  }
})();
