/* ============================================================
   교적 관리 화면 — Supabase members 테이블 CRUD
   ============================================================ */
(function () {
  var FIELDS = ["name", "position", "home_phone", "mobile_phone", "family", "birth", "group_label", "note"];
  var allRows = [];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function renderRows(rows) {
    var host = document.getElementById("rows");
    if (!rows.length) {
      host.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;">등록된 성도가 없습니다.</td></tr>';
      return;
    }
    host.innerHTML = rows.map(function (r) {
      return (
        "<tr>" +
        "<td>" + esc(r.name) + "</td>" +
        "<td>" + esc(r.position) + "</td>" +
        "<td>" + esc(r.home_phone) + "</td>" +
        "<td>" + esc(r.mobile_phone) + "</td>" +
        "<td>" + esc(r.family) + "</td>" +
        "<td>" + esc(r.birth) + "</td>" +
        "<td>" + esc(r.group_label) + "</td>" +
        "<td>" + esc(r.note) + "</td>" +
        '<td class="actions">' +
        '<button class="mini-btn" data-edit="' + r.id + '">수정</button>' +
        '<button class="mini-btn danger" data-del="' + r.id + '">삭제</button>' +
        "</td></tr>"
      );
    }).join("");
    document.getElementById("countBadge").textContent = rows.length + "명";
  }

  function applyFilter() {
    var q = document.getElementById("searchBox").value.trim().toLowerCase();
    if (!q) { renderRows(allRows); return; }
    renderRows(allRows.filter(function (r) {
      return [r.name, r.home_phone, r.mobile_phone, r.family].some(function (v) {
        return v && String(v).toLowerCase().indexOf(q) !== -1;
      });
    }));
  }

  async function loadRows() {
    var { data, error } = await window.SB.from("members").select("*").order("name");
    if (error) {
      document.getElementById("rows").innerHTML =
        '<tr><td colspan="9" style="text-align:center;color:#b3261e;padding:30px;">불러오기 실패: ' + esc(error.message) + "</td></tr>";
      return;
    }
    allRows = data || [];
    renderRows(allRows);
  }

  function openModal(row) {
    document.getElementById("modalTitle").textContent = row ? "성도 정보 수정" : "새 성도 추가";
    document.getElementById("f_id").value = row ? row.id : "";
    FIELDS.forEach(function (f) {
      document.getElementById("f_" + f).value = row ? (row[f] || "") : "";
    });
    document.getElementById("modalOverlay").classList.add("open");
    document.getElementById("f_name").focus();
  }

  function closeModal() {
    document.getElementById("modalOverlay").classList.remove("open");
  }

  async function saveMember(e) {
    e.preventDefault();
    var id = document.getElementById("f_id").value;
    var payload = {};
    FIELDS.forEach(function (f) {
      payload[f] = document.getElementById("f_" + f).value.trim();
    });
    var saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    var res = id
      ? await window.SB.from("members").update(payload).eq("id", id)
      : await window.SB.from("members").insert(payload);
    saveBtn.disabled = false;
    if (res.error) { alert("저장 실패: " + res.error.message); return; }
    closeModal();
    loadRows();
  }

  async function deleteMember(id) {
    if (!confirm("이 성도 정보를 삭제할까요? 되돌릴 수 없습니다.")) return;
    var { error } = await window.SB.from("members").delete().eq("id", id);
    if (error) { alert("삭제 실패: " + error.message); return; }
    loadRows();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.SB_READY) {
      document.getElementById("setupNote").style.display = "block";
      document.getElementById("whoLine").textContent = "설정 필요";
      document.getElementById("rows").innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;">Supabase 연결 후 이용 가능합니다.</td></tr>';
      document.getElementById("addBtn").disabled = true;
      return;
    }

    var session = await sbRequireAuth();
    if (session === "redirect") return;

    document.getElementById("whoLine").textContent = session.user.email + " 로 로그인됨";
    document.getElementById("logoutBtn").addEventListener("click", sbLogout);
    document.getElementById("searchBox").addEventListener("input", applyFilter);
    document.getElementById("addBtn").addEventListener("click", function () { openModal(null); });
    document.getElementById("cancelBtn").addEventListener("click", closeModal);
    document.getElementById("modalOverlay").addEventListener("click", function (e) {
      if (e.target.id === "modalOverlay") closeModal();
    });
    document.getElementById("memberForm").addEventListener("submit", saveMember);
    document.getElementById("rows").addEventListener("click", function (e) {
      var editId = e.target.getAttribute("data-edit");
      var delId = e.target.getAttribute("data-del");
      if (editId) {
        var row = allRows.find(function (r) { return r.id === editId; });
        if (row) openModal(row);
      }
      if (delId) deleteMember(delId);
    });

    loadRows();
  });
})();
