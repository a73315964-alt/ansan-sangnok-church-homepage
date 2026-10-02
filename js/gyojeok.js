/* ============================================================
   교적부 (gyojeok.html) — "교인기록카드" 항목 그대로
   칸 구성: SQL실행하기/01_members_schema.sql + 04_members_registry.sql
   보기·수정은 관리자(admin_emails)만 가능 — SQL실행하기/02_admin_allowlist.sql
   사진은 Supabase Storage 의 비공개 버킷 member-photos 에 저장됩니다.
   ============================================================ */
(function () {
  var POSITIONS = ["성도", "권찰", "집사", "권사", "안수집사", "장로", "원로목사", "목사"];
  var ORGS = ["주일학교", "중등부", "고등부", "청년부", "구역장", "성가대", "찬양대"];
  var FAITH = ["원입", "학습", "세례", "유아세례", "입교"];
  var HOUSING = ["자가", "전세", "월세", "기타"];
  var RELATIONS = ["남편", "아내", "아버지", "어머니", "아들", "딸", "며느리", "사위", "손자", "손녀", "형제", "자매",
    "시아버지", "시어머니", "장인", "장모", "기타"];

  var TEXT_FIELDS = ["card_no", "district", "group_label", "name", "name_hanja", "gender", "position", "faith_level", "guide",
    "awards", "mobile_phone", "home_phone", "email", "address", "housing", "hobby", "education", "workplace", "job_title",
    "work_phone", "family", "note"];
  var DATE_FIELDS = ["written_at", "birth_date", "baptism_date", "registered_at"];
  var FAM_FIELDS = ["name", "relation", "gender", "birth_date", "birth_calendar", "faith_level", "position", "job", "education", "religion", "note"];

  var BUCKET = "member-photos";
  var allRows = [];
  var photoUrls = {}; // photo_path → 임시 주소
  var viewingId = null;
  var editingRow = null;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function notice(html, kind) {
    $("notice").innerHTML = html ? '<div class="notice ' + (kind || "info") + '">' + html + "</div>" : "";
  }
  function byId(id) { return allRows.find(function (r) { return r.id === id; }); }
  function options(list, current, placeholder) {
    var opts = list.slice();
    if (current && opts.indexOf(current) === -1) opts.push(current); // 예전 표기 유지
    return '<option value="">' + (placeholder || "선택") + "</option>" + opts.map(function (o) {
      return '<option value="' + esc(o) + '"' + (o === current ? " selected" : "") + ">" + esc(o) + "</option>";
    }).join("");
  }

  /* ---------- 날짜 / 나이 ---------- */

  function parseDate(s) {
    if (!s) return null;
    var p = String(s).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function fmtDate(s) {
    var d = parseDate(s);
    return d ? d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate() : "";
  }
  function age(s) {
    var d = parseDate(s);
    if (!d) return null;
    var t = new Date();
    var a = t.getFullYear() - d.getFullYear();
    if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
    return a;
  }
  function birthText(r) {
    if (r.birth_date) return fmtDate(r.birth_date) + " (" + (r.birth_calendar || "양") + ")";
    return r.birth || "";
  }
  function todayISO() {
    var t = new Date();
    return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
  }

  /* ---------- 가족 ---------- */

  function famList(r) { return Array.isArray(r.family_members) ? r.family_members : []; }
  // 다른 교인의 가족사항에 이 교인이 연결된 경우
  function linkedFrom(r) {
    return allRows.filter(function (o) {
      return o.id !== r.id && famList(o).some(function (f) { return f.member_id === r.id; });
    }).map(function (o) {
      var f = famList(o).find(function (x) { return x.member_id === r.id; });
      return { member: o, relation: f.relation };
    });
  }
  function familyCell(r) {
    var n = famList(r).length;
    return n ? n + "명" + (famList(r).some(function (f) { return f.member_id; }) ? ' <span class="muted">(교인 연결)</span>' : "") : '<span class="muted">—</span>';
  }

  /* ---------- 사진 ---------- */

  async function photoUrl(path) {
    if (!path) return null;
    if (photoUrls[path]) return photoUrls[path];
    var res = await window.SB.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (res.error) return null;
    photoUrls[path] = res.data.signedUrl;
    return photoUrls[path];
  }

  /* ---------- 목록 ---------- */

  function filtered() {
    var q = $("searchBox").value.trim().toLowerCase();
    var dist = $("fDistrict").value, pos = $("fPosition").value, org = $("fOrg").value, gen = $("fGender").value;
    var list = allRows.filter(function (r) {
      if (dist && [r.district, r.group_label].filter(Boolean).join(" ") !== dist) return false;
      if (pos && r.position !== pos) return false;
      if (org && (r.service_orgs || []).indexOf(org) === -1) return false;
      if (gen && r.gender !== gen) return false;
      if (!q) return true;
      var hay = [r.name, r.name_hanja, r.mobile_phone, r.home_phone, r.address, r.email, r.family, r.guide]
        .concat(famList(r).map(function (f) { return f.name; })).join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    var sort = $("sortSel").value;
    list.sort(function (a, b) {
      if (sort === "age") return String(a.birth_date || "9999").localeCompare(String(b.birth_date || "9999"));
      if (sort === "registered") return String(b.registered_at || "").localeCompare(String(a.registered_at || ""));
      if (sort === "no") {
        var na = parseInt(a.card_no, 10), nb = parseInt(b.card_no, 10);
        if (isNaN(na) && isNaN(nb)) return a.name.localeCompare(b.name, "ko");
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return na - nb;
      }
      return a.name.localeCompare(b.name, "ko");
    });
    return list;
  }

  function renderRows() {
    var rows = filtered();
    $("countBadge").textContent = rows.length + "명";
    if (!rows.length) {
      $("rows").innerHTML = '<tr><td colspan="10" class="empty">' + (allRows.length ? "조건에 맞는 교인이 없습니다." : "등록된 교인이 없습니다.") + "</td></tr>";
      return;
    }
    $("rows").innerHTML = rows.map(function (r) {
      var a = age(r.birth_date);
      return "<tr>" +
        "<td>" + esc(r.card_no) + "</td>" +
        '<td><button class="name-btn" data-view="' + r.id + '">' + esc(r.name) + "</button>" + (r.gender ? ' <span class="muted">' + esc(r.gender) + "</span>" : "") + "</td>" +
        "<td>" + esc(birthText(r)) + (a != null ? ' <span class="muted">만 ' + a + "세</span>" : "") + "</td>" +
        "<td>" + esc(r.position) + "</td>" +
        "<td>" + esc(r.faith_level) + "</td>" +
        "<td>" + esc([r.district, r.group_label].filter(Boolean).join(" · ")) + "</td>" +
        "<td>" + (r.service_orgs || []).map(function (o) { return '<span class="tag">' + esc(o) + "</span>"; }).join("") + "</td>" +
        "<td>" + esc(r.mobile_phone) + "</td>" +
        "<td>" + familyCell(r) + "</td>" +
        '<td class="actions"><button class="mini-btn" data-edit="' + r.id + '">수정</button>' +
        '<button class="mini-btn danger" data-del="' + r.id + '">삭제</button></td>' +
        "</tr>";
    }).join("");
  }

  function renderTiles() {
    var m = allRows.filter(function (r) { return r.gender === "남"; }).length;
    var f = allRows.filter(function (r) { return r.gender === "여"; }).length;
    $("tTotal").textContent = allRows.length + "명";
    $("tGender").textContent = "남 " + m + " · 여 " + f + (allRows.length - m - f ? " · 미입력 " + (allRows.length - m - f) : "");
    $("tBaptized").textContent = allRows.filter(function (r) {
      return r.baptism_date || r.faith_level === "세례" || r.faith_level === "입교";
    }).length + "명";
    var cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
    $("tNew").textContent = allRows.filter(function (r) { var d = parseDate(r.registered_at); return d && d >= cutoff; }).length + "명";
    var month = new Date().getMonth();
    var bd = allRows.filter(function (r) { var d = parseDate(r.birth_date); return d && d.getMonth() === month; })
      .sort(function (a, b) { return parseDate(a.birth_date).getDate() - parseDate(b.birth_date).getDate(); });
    $("tBirthday").textContent = bd.length + "명";
    $("tBirthdayNames").textContent = bd.slice(0, 4).map(function (r) {
      return r.name + " " + parseDate(r.birth_date).getDate() + "일" + (r.birth_calendar === "음" ? "(음)" : "");
    }).join(", ") + (bd.length > 4 ? " 외" : "");
  }

  function renderFilters() {
    var keep = $("fDistrict").value;
    var dists = Array.from(new Set(allRows.map(function (r) { return [r.district, r.group_label].filter(Boolean).join(" "); }).filter(Boolean))).sort();
    $("fDistrict").innerHTML = '<option value="">교구·구역 전체</option>' + dists.map(function (d) { return "<option>" + esc(d) + "</option>"; }).join("");
    $("fDistrict").value = dists.indexOf(keep) !== -1 ? keep : "";
    function uniq(f) { return Array.from(new Set(allRows.map(function (r) { return r[f]; }).filter(Boolean))).sort(); }
    $("districtList").innerHTML = uniq("district").map(function (d) { return '<option value="' + esc(d) + '">'; }).join("");
    $("groupList").innerHTML = uniq("group_label").map(function (d) { return '<option value="' + esc(d) + '">'; }).join("");
  }

  function renderAll() {
    renderTiles();
    renderFilters();
    renderRows();
    if (viewingId) openView(viewingId);
  }

  async function loadRows() {
    var rows = [];
    for (var from = 0; ; from += 1000) {
      var res = await window.SB.from("members").select("*").order("name").range(from, from + 999);
      if (res.error) {
        $("rows").innerHTML = '<tr><td colspan="10" class="empty" style="color:#b3261e;">불러오기 실패: ' + esc(res.error.message) + "</td></tr>";
        return;
      }
      rows = rows.concat(res.data || []);
      if ((res.data || []).length < 1000) break;
    }
    if (rows.length && !("family_members" in rows[0])) {
      notice("교인기록카드 항목이 아직 DB에 없습니다. <code>SQL실행하기/04_members_registry.sql</code> 을 실행해 주세요.", "warn");
    }
    allRows = rows.map(function (r) {
      r.service_orgs = r.service_orgs || [];
      r.family_members = famList(r);
      return r;
    });
    renderAll();
  }

  /* ---------- 교인기록카드 보기 ---------- */

  function cardHtml(r, imgUrl) {
    function v(x) { return esc(x || ""); }
    var famRows = famList(r).map(function (f) {
      var nameCell = f.member_id && byId(f.member_id)
        ? '<button class="linked" data-view="' + f.member_id + '">' + v(f.name) + "</button>"
        : v(f.name);
      return "<tr><td class=\"l\">" + nameCell + "</td><td>" + v(f.relation) + "</td><td>" + v(f.gender) + "</td><td>" + v(fmtDate(f.birth_date)) +
        "</td><td>" + (f.birth_date ? v(f.birth_calendar || "양") : "") + "</td><td>" + v(f.faith_level) + "</td><td>" + v(f.position) +
        "</td><td>" + v(f.job) + "</td><td>" + v(f.education) + "</td><td>" + v(f.religion) + '</td><td class="l">' + v(f.note) + "</td></tr>";
    });
    while (famRows.length < 4) famRows.push("<tr>" + new Array(12).join("<td>&nbsp;</td>") + "</tr>");
    var a = age(r.birth_date);
    var back = linkedFrom(r);

    return '<div class="rc">' +
      '<div class="rc-top"><h2 class="rc-title">교인기록카드</h2>' +
      '<table class="meta" style="width:auto;min-width:320px;"><tr><th>번호</th><td>' + v(r.card_no) + "</td><th>교구</th><td>" + v(r.district) + "</td></tr>" +
      "<tr><th>작성일</th><td>" + v(fmtDate(r.written_at)) + "</td><th>구역(속)</th><td>" + v(r.group_label) + "</td></tr></table></div>" +

      '<div class="rc-scroll"><table>' +
      '<colgroup><col style="width:10%"><col style="width:12%"><col style="width:10%"><col style="width:9%"><col style="width:10%"><col style="width:9%"><col style="width:10%"><col style="width:13%"><col style="width:17%"></colgroup>' +
      "<tr><th>이 름</th><td colspan=\"3\">" + v(r.name) + (r.name_hanja ? ' <span class="muted">(' + v(r.name_hanja) + ")</span>" : "") +
        "</td><th>성 별</th><td>" + v(r.gender) + "</td><th>생년월일</th><td>" + v(birthText(r)) + (a != null ? '<br><span class="muted">만 ' + a + "세</span>" : "") +
        '</td><td class="photo" rowspan="5">' + (imgUrl ? '<img src="' + imgUrl + '" alt="사진">' : '<span class="muted">사 진</span>') + "</td></tr>" +
      "<tr><th>휴대폰</th><td colspan=\"3\">" + v(r.mobile_phone) + "</td><th>신 급</th><td>" + v(r.faith_level) + "</td><th>직 분</th><td>" + v(r.position) + "</td></tr>" +
      "<tr><th>전 화</th><td colspan=\"3\">(집) " + v(r.home_phone) + "</td><th>E-mail</th><td colspan=\"3\">" + v(r.email) + "</td></tr>" +
      "<tr><th>주 소</th><td colspan=\"3\">" + v(r.address) + "</td><th>봉사기관</th><td colspan=\"3\">" + v((r.service_orgs || []).join(", ")) + "</td></tr>" +
      "<tr><th>직 장</th><td colspan=\"3\">" + v(r.workplace) + (r.job_title ? " / 직위 " + v(r.job_title) : "") + (r.work_phone ? " / ☎ " + v(r.work_phone) : "") +
        "</td><th>주거환경</th><td>" + v(r.housing) + "</td><th>인도자</th><td>" + v(r.guide) + "</td></tr>" +
      "<tr><th>취 미</th><td>" + v(r.hobby) + "</td><th>학 력</th><td>" + v(r.education) + "</td><th>수상경력</th><td colspan=\"4\">" + v(r.awards) + "</td></tr>" +
      "<tr><th>세례일</th><td>" + v(fmtDate(r.baptism_date)) + "</td><th>등록일</th><td>" + v(fmtDate(r.registered_at)) + "</td><th>기 타</th><td colspan=\"4\">" + v(r.note) + "</td></tr>" +
      "</table></div>" +

      '<div class="rc-scroll" style="margin-top:10px;"><table class="fam">' +
      '<colgroup><col style="width:5%"><col style="width:13%"><col style="width:8%"><col style="width:6%"><col style="width:12%"><col style="width:5%"><col style="width:8%"><col style="width:9%"><col style="width:9%"><col style="width:8%"><col style="width:7%"><col style="width:10%"></colgroup>' +
      '<tr><th rowspan="' + (famRows.length + 1) + '"><span class="vlabel">가족사항</span></th><th>이 름</th><th>관계</th><th>성별</th><th>생년월일</th><th>음양</th><th>신급</th><th>직분</th><th>직업</th><th>학력</th><th>종교</th><th>기 타</th></tr>' +
      famRows.join("") +
      "</table></div>" +
      (r.family ? '<div class="rc-extra"><b>가족 메모</b> ' + v(r.family) + "</div>" : "") +
      (back.length ? '<div class="rc-extra no-print"><b>다른 교인의 가족사항에 연결됨</b> ' + back.map(function (x) {
        return '<button class="linked" data-view="' + x.member.id + '">' + v(x.member.name) + "</button>" + (x.relation ? "의 " + v(x.relation) : "");
      }).join(", ") + "</div>" : "") +
      "</div>";
  }

  async function openView(id) {
    var r = byId(id);
    if (!r) { $("viewOverlay").classList.remove("open"); viewingId = null; return; }
    viewingId = id;
    $("cardView").innerHTML = cardHtml(r, null);
    $("viewOverlay").classList.add("open");
    if (r.photo_path) {
      var url = await photoUrl(r.photo_path);
      if (url && viewingId === id) $("cardView").innerHTML = cardHtml(r, url);
    }
  }

  /* ---------- 등록 / 수정 ---------- */

  function memberOptions(selected, selfId) {
    return '<option value="">— 교인 아님 / 직접 입력 —</option>' + allRows
      .filter(function (m) { return m.id !== selfId; })
      .slice().sort(function (a, b) { return a.name.localeCompare(b.name, "ko"); })
      .map(function (m) {
        return '<option value="' + m.id + '"' + (m.id === selected ? " selected" : "") + ">" + esc(m.name) +
          (m.birth_date ? " (" + m.birth_date.slice(0, 4) + ")" : "") + (m.position ? " " + esc(m.position) : "") + "</option>";
      }).join("");
  }

  function famRowHtml(f, i, selfId) {
    f = f || {};
    function inp(k, label, extra, cls) {
      return '<div class="field' + (cls ? " " + cls : "") + '"><label>' + label + '</label><input data-k="' + k + '" value="' + esc(f[k] || "") + '"' + (extra || "") + "></div>";
    }
    return '<div class="fam-row" data-i="' + i + '">' +
      '<div class="fam-row-head"><span>가족 ' + (i + 1) + '</span><button type="button" class="mini-btn danger" data-remove-fam>삭제</button></div>' +
      '<div class="fam-grid">' +
      '<div class="field w2"><label>교인 연결</label><select data-k="member_id">' + memberOptions(f.member_id, selfId) + "</select></div>" +
      inp("name", "이름") +
      inp("relation", "관계", ' list="relationList"') +
      '<div class="field"><label>성별</label><select data-k="gender">' + options(["남", "여"], f.gender) + "</select></div>" +
      '<div class="field"><label>음/양</label><select data-k="birth_calendar">' + ["양", "음"].map(function (c) {
        return "<option" + ((f.birth_calendar || "양") === c ? " selected" : "") + ">" + c + "</option>";
      }).join("") + "</select></div>" +
      inp("birth_date", "생년월일", ' type="date"') +
      '<div class="field"><label>신급</label><select data-k="faith_level">' + options(FAITH, f.faith_level) + "</select></div>" +
      '<div class="field"><label>직분</label><select data-k="position">' + options(POSITIONS, f.position) + "</select></div>" +
      inp("job", "직업") +
      inp("education", "학력") +
      inp("religion", "종교", ' list="religionList"') +
      inp("note", "기타", "", "w2") +
      "</div></div>";
  }

  function readFamily() {
    return Array.prototype.map.call($("familyEdit").querySelectorAll(".fam-row"), function (row) {
      var f = {};
      row.querySelectorAll("[data-k]").forEach(function (el) { var v = el.value.trim(); if (v) f[el.getAttribute("data-k")] = v; });
      if (f.birth_calendar === "양" && !f.birth_date) delete f.birth_calendar;
      return f;
    }).filter(function (f) { return f.name || f.member_id; });
  }

  function renderFamilyEdit(list) {
    var selfId = $("f_id").value;
    $("familyEdit").innerHTML = list.length
      ? list.map(function (f, i) { return famRowHtml(f, i, selfId); }).join("")
      : '<div class="fam-empty">등록된 가족이 없습니다. "+ 가족 추가"를 눌러 입력하세요.</div>';
  }

  async function showPhotoPreview(row) {
    $("photoBox").innerHTML = "<span>사진</span>";
    $("photoRemoveWrap").hidden = !(row && row.photo_path);
    $("photoRemove").checked = false;
    if (row && row.photo_path) {
      var url = await photoUrl(row.photo_path);
      if (url && editingRow === row) $("photoBox").innerHTML = '<img src="' + url + '" alt="">';
    }
  }

  function nextCardNo() {
    var max = allRows.reduce(function (m, r) { var n = parseInt(r.card_no, 10); return isNaN(n) ? m : Math.max(m, n); }, 0);
    return String(max + 1);
  }

  function openForm(row) {
    $("viewOverlay").classList.remove("open");
    viewingId = null;
    editingRow = row || null;
    $("modalTitle").textContent = row ? row.name + " 님 교인기록카드 수정" : "새 교인 등록";
    $("f_id").value = row ? row.id : "";
    TEXT_FIELDS.concat(DATE_FIELDS).forEach(function (f) {
      var el = $("f_" + f);
      if (el && el.tagName !== "SELECT") el.value = row ? (row[f] || "") : "";
    });
    $("f_gender").value = (row && row.gender) || "";
    $("f_birth_calendar").value = (row && row.birth_calendar) || "양";
    $("f_position").innerHTML = options(POSITIONS, row && row.position);
    $("f_faith_level").innerHTML = options(FAITH, row && row.faith_level);
    $("f_housing").innerHTML = options(HOUSING, row && row.housing);
    $("f_orgs").innerHTML = ORGS.map(function (o) {
      var on = row && (row.service_orgs || []).indexOf(o) !== -1;
      return '<label><input type="checkbox" value="' + o + '"' + (on ? " checked" : "") + ">" + o + "</label>";
    }).join("");
    $("birthHint").textContent = row && row.birth && !row.birth_date ? "예전 기록: " + row.birth + " — 날짜로 다시 입력해 주세요." : "";
    $("photoInput").value = "";
    if (!row) {
      $("f_card_no").value = nextCardNo();
      $("f_written_at").value = todayISO();
      $("f_registered_at").value = todayISO();
    }
    renderFamilyEdit(row ? famList(row) : []);
    showPhotoPreview(row);
    $("modalOverlay").classList.add("open");
    $("f_name").focus();
  }

  function closeForm() {
    $("modalOverlay").classList.remove("open");
    editingRow = null;
    if (location.hash === "#new") history.replaceState(null, "", location.pathname);
  }

  async function uploadPhoto(memberId, file) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    var path = memberId + "/" + Date.now() + "." + ext;
    var res = await window.SB.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
    if (res.error) throw res.error;
    return path;
  }

  async function saveMember(e) {
    e.preventDefault();
    var id = $("f_id").value;
    var row = id ? byId(id) : null;
    var payload = {};
    TEXT_FIELDS.forEach(function (f) { var v = $("f_" + f).value.trim(); payload[f] = v || null; });
    DATE_FIELDS.forEach(function (f) { payload[f] = $("f_" + f).value || null; });
    if (payload.email) payload.email = payload.email.toLowerCase(); // 나의 대시보드와 연결할 때 로그인 이메일과 비교
    payload.birth_calendar = $("f_birth_calendar").value || "양";
    payload.service_orgs = Array.prototype.map.call($("f_orgs").querySelectorAll("input:checked"), function (c) { return c.value; });
    payload.family_members = readFamily();

    var file = $("photoInput").files[0];
    if (file && file.size > 5 * 1024 * 1024) { alert("사진은 5MB 이하만 올릴 수 있습니다."); return; }

    var btn = $("saveBtn");
    btn.disabled = true;
    try {
      if (id) {
        var up = await window.SB.from("members").update(payload).eq("id", id);
        if (up.error) throw up.error;
      } else {
        var ins = await window.SB.from("members").insert(payload).select("id").single();
        if (ins.error) throw ins.error;
        id = ins.data.id;
      }
      // 사진: 새로 올리거나 삭제
      var oldPath = row && row.photo_path;
      if (file) {
        var path = await uploadPhoto(id, file);
        var p1 = await window.SB.from("members").update({ photo_path: path }).eq("id", id);
        if (p1.error) throw p1.error;
        if (oldPath) await window.SB.storage.from(BUCKET).remove([oldPath]);
      } else if (oldPath && $("photoRemove").checked) {
        await window.SB.from("members").update({ photo_path: null }).eq("id", id);
        await window.SB.storage.from(BUCKET).remove([oldPath]);
      }
    } catch (err) {
      btn.disabled = false;
      alert("저장 실패: " + (err.message || err));
      return;
    }
    btn.disabled = false;
    closeForm();
    await loadRows();
    openView(id);
  }

  async function deleteMember(id) {
    var r = byId(id);
    if (!r) return;
    var back = linkedFrom(r);
    var warn = back.length ? "\n(" + back.map(function (x) { return x.member.name; }).join(", ") + " 님의 가족사항에 연결되어 있습니다. 그쪽에는 이름만 남습니다.)" : "";
    if (!confirm(r.name + " 님의 교적 정보를 삭제할까요? 되돌릴 수 없습니다." + warn)) return;
    var res = await window.SB.from("members").delete().eq("id", id);
    if (res.error) { alert("삭제 실패: " + res.error.message); return; }
    if (r.photo_path) await window.SB.storage.from(BUCKET).remove([r.photo_path]);
    loadRows();
  }

  /* ---------- CSV ---------- */

  function downloadCsv() {
    var head = ["번호", "작성일", "교구", "구역(속)", "이름", "한문", "성별", "생년월일", "음양", "나이", "휴대폰", "전화(집)", "E-mail", "주소",
      "주거환경", "신급", "직분", "봉사기관", "세례일", "등록일", "인도자", "수상경력", "취미", "학력", "직장", "직위", "직장전화", "가족사항", "가족 메모", "메모"];
    var lines = [head].concat(filtered().map(function (r) {
      var fam = famList(r).map(function (f) {
        return [f.name, f.relation, f.gender, f.birth_date, f.position].filter(Boolean).join(" ");
      }).join(" / ");
      return [r.card_no, r.written_at, r.district, r.group_label, r.name, r.name_hanja, r.gender, r.birth_date || r.birth, r.birth_calendar,
        age(r.birth_date), r.mobile_phone, r.home_phone, r.email, r.address, r.housing, r.faith_level, r.position,
        (r.service_orgs || []).join(" / "), r.baptism_date, r.registered_at, r.guide, r.awards, r.hobby, r.education,
        r.workplace, r.job_title, r.work_phone, fam, r.family, r.note];
    }));
    var csv = lines.map(function (row) {
      return row.map(function (v) {
        var s = String(v == null ? "" : v);
        return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(",");
    }).join("\r\n");
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "교적부_" + todayISO() + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------- 시작 ---------- */

  function bindEvents() {
    $("searchBox").addEventListener("input", renderRows);
    ["fDistrict", "fPosition", "fOrg", "fGender", "sortSel"].forEach(function (id) { $(id).addEventListener("change", renderRows); });
    $("addBtn").addEventListener("click", function () { openForm(null); });
    $("csvBtn").addEventListener("click", downloadCsv);
    $("cancelBtn").addEventListener("click", closeForm);
    $("closeFormBtn").addEventListener("click", closeForm);
    $("memberForm").addEventListener("submit", saveMember);

    $("photoInput").addEventListener("change", function () {
      var f = this.files[0];
      if (f) $("photoBox").innerHTML = '<img src="' + URL.createObjectURL(f) + '" alt="">';
    });

    $("addFamilyBtn").addEventListener("click", function () {
      var list = readFamily();
      list.push({});
      renderFamilyEdit(list);
    });
    $("familyEdit").addEventListener("click", function (e) {
      if (!e.target.hasAttribute("data-remove-fam")) return;
      e.target.closest(".fam-row").remove();
      if (!$("familyEdit").querySelector(".fam-row")) renderFamilyEdit([]);
    });
    // 교인 연결 → 그 교인 정보로 자동 채우기
    $("familyEdit").addEventListener("change", function (e) {
      if (e.target.getAttribute("data-k") !== "member_id" || !e.target.value) return;
      var m = byId(e.target.value);
      var row = e.target.closest(".fam-row");
      if (!m || !row) return;
      function set(k, v) { var el = row.querySelector('[data-k="' + k + '"]'); if (el && v) el.value = v; }
      set("name", m.name);
      set("gender", m.gender);
      set("birth_date", m.birth_date);
      set("birth_calendar", m.birth_calendar);
      set("faith_level", m.faith_level);
      set("position", m.position);
      set("education", m.education);
      set("religion", "기독교");
    });

    $("rows").addEventListener("click", function (e) {
      var t = e.target;
      if (t.getAttribute("data-view")) openView(t.getAttribute("data-view"));
      if (t.getAttribute("data-edit")) openForm(byId(t.getAttribute("data-edit")));
      if (t.getAttribute("data-del")) deleteMember(t.getAttribute("data-del"));
    });
    $("viewOverlay").addEventListener("click", function (e) {
      if (e.target.id === "viewOverlay" || e.target.hasAttribute("data-close")) {
        $("viewOverlay").classList.remove("open");
        viewingId = null;
        return;
      }
      var v = e.target.getAttribute("data-view");
      if (v) openView(v);
    });
    $("vEditBtn").addEventListener("click", function () { openForm(byId(viewingId)); });
    $("vPrintBtn").addEventListener("click", function () { window.print(); });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    $("logoutBtn").addEventListener("click", sbLogout);
    if (!window.SB_READY) {
      notice("Supabase 연결이 아직 설정되지 않았습니다. <code>js/config.js</code> 를 채우고 <code>SQL실행하기</code> 폴더의 SQL 을 차례로 실행해 주세요.", "warn");
      $("whoLine").textContent = "설정 필요";
      return;
    }

    var session = await sbRequireAuth();
    if (session === "redirect") return;
    $("whoLine").textContent = session.user.email + " 로 로그인됨";

    if (!(await sbIsAdmin())) {
      notice("교적부는 목사님(관리자)만 볼 수 있습니다. <a href=\"bible-reading.html\">내 성경읽기로 가기 →</a>", "error");
      return;
    }

    $("fPosition").innerHTML += POSITIONS.map(function (p) { return "<option>" + p + "</option>"; }).join("");
    $("fOrg").innerHTML += ORGS.map(function (o) { return "<option>" + o + "</option>"; }).join("");
    var rl = document.createElement("datalist");
    rl.id = "relationList";
    rl.innerHTML = RELATIONS.map(function (r) { return '<option value="' + r + '">'; }).join("");
    document.body.appendChild(rl);

    bindEvents();
    $("main").hidden = false;
    await loadRows();
    if (location.hash === "#new") openForm(null);
  });
})();
