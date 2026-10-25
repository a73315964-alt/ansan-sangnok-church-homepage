/* 달란트가 생기면 잠깐 알려주는 작은 안내 (+1 달란트)
   window.talentCheck("bible" | "devo" | "share") — 오늘 그 달란트를 처음 받았을 때만 한 번 보여줍니다. */
(function () {
  var LABEL = { bible: "성경 읽기", devo: "새벽 묵상", share: "나눔 글" };

  function kstToday() { return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); }

  function show(kind) {
    var old = document.getElementById("talentToast");
    if (old) old.remove();
    var el = document.createElement("a");
    el.id = "talentToast";
    el.className = "tal-toast";
    el.href = "today-word.html#talent";
    el.innerHTML = '<span class="coin blue tal-toast-coin"></span><span><b>+1 달란트</b> · ' + LABEL[kind] + "</span>";
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add("out"); }, 2600);
    setTimeout(function () { el.remove(); }, 3200);
  }

  window.talentCheck = async function (kind) {
    try {
      if (!window.SB_READY || !LABEL[kind]) return;
      var today = kstToday();
      var key = "talentToast:" + kind + ":" + today;
      try { if (localStorage.getItem(key)) return; } catch (e) {}
      var session = await sbCurrentSession();
      if (!session) return;
      var res = await window.SB.rpc("my_talents", { p_month: today.slice(0, 7) + "-01" });
      if (res.error) return;
      var row = (res.data || []).filter(function (r) { return String(r.day).slice(0, 10) === today; })[0];
      if (!row || !row[kind]) return;
      try { localStorage.setItem(key, "1"); } catch (e) {}
      show(kind);
    } catch (e) {}
  };
})();
