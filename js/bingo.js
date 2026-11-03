/* 주제별 빙고 — 우리들의 이야기(community.html) 맨 아래
   · 외부 서버·로그인 없이 브라우저에서만 작동합니다. 저장은 이 기기(localStorage)에만 됩니다.
   · 모든 방문자에게 보일 기본 단어 목록은 아래 BINGO_CONFIG 에서 고치세요 (주제마다 25개 이상). */
(function () {
  "use strict";

  var BINGO_CONFIG = {
    size: 5,            // 5×5
    boardCount: 6,      // 한 번에 만드는 빙고판 수
    defaultGoal: 5,     // 기본 목표 줄 수
    maxGoal: 12,        // 가로 5 + 세로 5 + 대각선 2
    maxWords: 200,      // 직접 입력 단어 수 제한
    maxWordLength: 20,  // 단어 한 개의 글자 수 제한
    storageKey: "bingo:state:v1",
    topics: [
      { id: "people", label: "성경 인물", words: [
        "아담", "하와", "노아", "아브라함", "사라", "이삭", "리브가", "야곱", "라헬", "요셉",
        "모세", "아론", "미리암", "여호수아", "기드온", "삼손", "룻", "한나", "사무엘", "다윗",
        "솔로몬", "엘리야", "엘리사", "이사야", "예레미야", "다니엘", "에스더", "욥", "요나", "느헤미야",
        "마리아", "요셉(예수의 아버지)", "베드로", "요한", "야고보", "바울", "바나바", "디모데", "누가", "스데반"
      ] },
      { id: "places", label: "성경 지명", words: [
        "에덴동산", "아라랏산", "바벨탑", "소돔", "고모라", "가나안", "벧엘", "헤브론", "애굽", "시내산",
        "여리고", "예루살렘", "베들레헴", "나사렛", "갈릴리", "가버나움", "요단강", "사마리아", "가나", "감람산",
        "골고다", "에베소", "빌립보", "고린도", "로마", "다소", "다메섹", "안디옥", "밧모섬", "니느웨",
        "바벨론", "모리아산", "갈멜산", "시온산", "느보산", "엠마오", "여호사밧 골짜기", "길갈", "미스바", "욥바"
      ] },
      { id: "food", label: "음식", words: [
        "김치찌개", "된장찌개", "비빔밥", "불고기", "삼겹살", "갈비찜", "잡채", "떡볶이", "김밥", "라면",
        "냉면", "칼국수", "수제비", "만두", "순두부찌개", "부대찌개", "설렁탕", "삼계탕", "치킨", "피자",
        "햄버거", "짜장면", "짬뽕", "탕수육", "초밥", "돈가스", "파스타", "샌드위치", "떡국", "송편",
        "미역국", "계란찜", "감자탕", "닭갈비", "보쌈", "족발", "호떡", "붕어빵", "식혜", "수정과"
      ] },
      { id: "books", label: "성경 각 권 이름", words: [
        "창세기", "출애굽기", "레위기", "민수기", "신명기", "여호수아", "사사기", "룻기", "사무엘상", "사무엘하",
        "열왕기상", "열왕기하", "역대상", "역대하", "에스라", "느헤미야", "에스더", "욥기", "시편", "잠언",
        "전도서", "아가", "이사야", "예레미야", "예레미야애가", "에스겔", "다니엘", "호세아", "요엘", "아모스",
        "오바댜", "요나", "미가", "나훔", "하박국", "스바냐", "학개", "스가랴", "말라기",
        "마태복음", "마가복음", "누가복음", "요한복음", "사도행전", "로마서", "고린도전서", "고린도후서", "갈라디아서", "에베소서",
        "빌립보서", "골로새서", "데살로니가전서", "데살로니가후서", "디모데전서", "디모데후서", "디도서", "빌레몬서", "히브리서", "야고보서",
        "베드로전서", "베드로후서", "요한1서", "요한2서", "요한3서", "유다서", "요한계시록"
      ] },
      { id: "terms", label: "성경 단어", words: [
        "은혜", "믿음", "소망", "사랑", "구원", "복음", "십자가", "부활", "회개", "용서",
        "기도", "찬양", "예배", "감사", "평강", "기쁨", "인내", "겸손", "순종", "진리",
        "말씀", "성령", "언약", "축복", "안식일", "제사", "성전", "천사", "광야", "생명",
        "빛", "소금", "양", "목자", "포도나무", "반석", "씨앗", "십일조", "세례", "성찬",
        "영생", "심판", "나라", "의", "지혜", "긍휼", "화평", "자비", "경외", "증인"
      ] },
      { id: "custom", label: "직접 입력", words: [] }
    ]
  };

  var root = document.getElementById("bingoApp");
  if (!root) return;

  var N = BINGO_CONFIG.size, CELLS = N * N;
  var state = null;        // {topic, customText, goal, words, boards, marks, active}
  var editing = false;
  var els = {};

  /* ---------- 저장 (사용할 수 없어도 게임은 작동) ---------- */
  function save() {
    try { localStorage.setItem(BINGO_CONFIG.storageKey, JSON.stringify(state)); } catch (e) {}
  }
  function wipeStore() {
    try { localStorage.removeItem(BINGO_CONFIG.storageKey); } catch (e) {}
  }
  function validState(s) {
    if (!s || typeof s !== "object") return false;
    if (typeof s.topic !== "string" || !topicById(s.topic)) return false;
    if (typeof s.customText !== "string" || s.customText.length > 10000) return false;
    if (!Number.isInteger(s.goal) || s.goal < 1 || s.goal > BINGO_CONFIG.maxGoal) return false;
    if (!Array.isArray(s.words)) return false;
    if (s.boards == null) return s.marks == null;
    if (!Array.isArray(s.boards) || s.boards.length !== BINGO_CONFIG.boardCount) return false;
    if (!Array.isArray(s.marks) || s.marks.length !== BINGO_CONFIG.boardCount) return false;
    if (!Number.isInteger(s.active) || s.active < 0 || s.active >= BINGO_CONFIG.boardCount) return false;
    for (var b = 0; b < s.boards.length; b++) {
      var bd = s.boards[b], mk = s.marks[b];
      if (!Array.isArray(bd) || bd.length !== CELLS || !Array.isArray(mk) || mk.length !== CELLS) return false;
      var seen = {};
      for (var i = 0; i < CELLS; i++) {
        if (typeof bd[i] !== "string" || !bd[i].trim() || bd[i].length > BINGO_CONFIG.maxWordLength) return false;
        if (seen[bd[i]]) return false;
        seen[bd[i]] = true;
        if (typeof mk[i] !== "boolean") return false;
      }
    }
    return true;
  }
  function load() {
    try {
      var raw = localStorage.getItem(BINGO_CONFIG.storageKey);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (validState(s)) return s;
      wipeStore();
    } catch (e) { try { wipeStore(); } catch (e2) {} }
    return null;
  }

  /* ---------- 도우미 ---------- */
  function topicById(id) {
    for (var i = 0; i < BINGO_CONFIG.topics.length; i++) if (BINGO_CONFIG.topics[i].id === id) return BINGO_CONFIG.topics[i];
    return null;
  }
  function cleanWords(list) {
    var seen = {}, out = [];
    list.forEach(function (w) {
      var t = String(w).replace(/\s+/g, " ").trim();
      if (t && !seen[t]) { seen[t] = true; out.push(t); }
    });
    return out;
  }
  function shuffle(a) {            // Fisher–Yates
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function countLines(marks) {
    var lines = 0, i, j, ok;
    for (i = 0; i < N; i++) {
      ok = true; for (j = 0; j < N; j++) if (!marks[i * N + j]) { ok = false; break; }
      if (ok) lines++;
      ok = true; for (j = 0; j < N; j++) if (!marks[j * N + i]) { ok = false; break; }
      if (ok) lines++;
    }
    ok = true; for (i = 0; i < N; i++) if (!marks[i * N + i]) { ok = false; break; }
    if (ok) lines++;
    ok = true; for (i = 0; i < N; i++) if (!marks[i * N + (N - 1 - i)]) { ok = false; break; }
    if (ok) lines++;
    return lines;
  }
  function started() {
    return !!state && !!state.marks && state.marks.some(function (m) { return m.some(Boolean); });
  }
  function newMarks() {
    var m = [];
    for (var b = 0; b < BINGO_CONFIG.boardCount; b++) m.push(new Array(CELLS).fill(false));
    return m;
  }

  /* ---------- 화면 뼈대 ---------- */
  function build() {
    root.textContent = "";
    var setup = el("div", "bingo-setup");

    var f1 = el("div", "bingo-field");
    var l1 = el("label", null, "빙고 종류"); l1.setAttribute("for", "bingoTopic");
    els.topic = el("select"); els.topic.id = "bingoTopic";
    BINGO_CONFIG.topics.forEach(function (t) {
      var o = el("option", null, t.label); o.value = t.id; els.topic.appendChild(o);
    });
    f1.appendChild(l1); f1.appendChild(els.topic);

    var f2 = el("div", "bingo-field");
    var l2 = el("label", null, "목표 줄 수"); l2.setAttribute("for", "bingoGoal");
    els.goal = el("select"); els.goal.id = "bingoGoal";
    for (var g = 1; g <= BINGO_CONFIG.maxGoal; g++) {
      var og = el("option", null, g + "줄"); og.value = String(g); els.goal.appendChild(og);
    }
    f2.appendChild(l2); f2.appendChild(els.goal);

    setup.appendChild(f1); setup.appendChild(f2);
    root.appendChild(setup);

    els.customWrap = el("div", "bingo-field bingo-custom");
    var l3 = el("label", null, "단어 입력 (줄바꿈 또는 쉼표로 구분, 25개 이상)"); l3.setAttribute("for", "bingoCustom");
    els.custom = el("textarea"); els.custom.id = "bingoCustom"; els.custom.rows = 5;
    els.custom.placeholder = "예) 사랑, 기쁨, 화평, 오래 참음, ...";
    els.customWrap.appendChild(l3); els.customWrap.appendChild(els.custom);
    root.appendChild(els.customWrap);

    var row = el("div", "bingo-actions");
    els.make = el("button", "btn btn-primary", "빙고판 만들기"); els.make.type = "button";
    row.appendChild(els.make);
    root.appendChild(row);

    els.msg = el("p", "bingo-msg"); els.msg.setAttribute("role", "status"); els.msg.setAttribute("aria-live", "polite");
    root.appendChild(els.msg);

    els.game = el("div", "bingo-game"); els.game.hidden = true;
    els.tabs = el("div", "bingo-tabs"); els.tabs.setAttribute("role", "group"); els.tabs.setAttribute("aria-label", "빙고판 선택");
    els.status = el("p", "bingo-status"); els.status.setAttribute("aria-live", "polite");
    els.win = el("p", "bingo-win"); els.win.setAttribute("role", "status"); els.win.hidden = true;
    els.board = el("div", "bingo-board"); els.board.setAttribute("role", "group");
    els.tools = el("div", "bingo-actions bingo-tools");
    els.edit = el("button", "btn btn-outline", "칸 수정"); els.edit.type = "button";
    els.saveEdit = el("button", "btn btn-primary", "수정 저장"); els.saveEdit.type = "button"; els.saveEdit.hidden = true;
    els.cancelEdit = el("button", "btn btn-outline", "수정 취소"); els.cancelEdit.type = "button"; els.cancelEdit.hidden = true;
    els.clear = el("button", "btn btn-outline", "현재 판 표시 지우기"); els.clear.type = "button";
    els.reset = el("button", "btn btn-outline", "전체 새 게임"); els.reset.type = "button";
    [els.edit, els.saveEdit, els.cancelEdit, els.clear, els.reset].forEach(function (b) { els.tools.appendChild(b); });
    els.note = el("p", "bingo-note", "※ 단어와 표시 상태는 이 기기(브라우저)에만 저장되며, 다른 기기와 공유되지 않습니다.");
    [els.tabs, els.status, els.win, els.board, els.tools].forEach(function (n) { els.game.appendChild(n); });
    root.appendChild(els.game);
    root.appendChild(els.note);

    els.topic.addEventListener("change", function () { syncCustom(); });
    els.make.addEventListener("click", make);
    els.edit.addEventListener("click", startEdit);
    els.saveEdit.addEventListener("click", saveEdit);
    els.cancelEdit.addEventListener("click", function () { editing = false; render(); });
    els.clear.addEventListener("click", clearMarks);
    els.reset.addEventListener("click", resetAll);
  }

  function syncCustom() {
    els.customWrap.hidden = els.topic.value !== "custom";
  }
  function say(text, bad) {
    els.msg.textContent = text || "";
    els.msg.className = "bingo-msg" + (bad ? " is-bad" : "");
  }

  /* ---------- 만들기 ---------- */
  function make() {
    if (state && state.boards && started() &&
        !window.confirm("지금 하던 빙고 표시가 모두 지워집니다. 새 빙고판을 만들까요?")) return;
    var id = els.topic.value, topic = topicById(id), words;
    if (id === "custom") {
      var parts = String(els.custom.value).split(/[\n\r,，、]+/).map(function (w) { return w.replace(/\s+/g, " ").trim(); }).filter(Boolean);
      words = cleanWords(parts);
      if (words.length > BINGO_CONFIG.maxWords) { say("단어는 최대 " + BINGO_CONFIG.maxWords + "개까지 넣을 수 있습니다. (현재 " + words.length + "개)", true); return; }
      var tooLong = words.filter(function (w) { return w.length > BINGO_CONFIG.maxWordLength; });
      if (tooLong.length) { say("한 단어는 " + BINGO_CONFIG.maxWordLength + "자 이하여야 합니다. 너무 긴 단어: " + tooLong[0].slice(0, 12) + "…", true); return; }
    } else {
      words = cleanWords(topic.words);
    }
    if (words.length < CELLS) {
      var dup = id === "custom" ? parseCustomRawCount() - words.length : 0;
      say("빙고판 한 장에는 서로 다른 단어가 " + CELLS + "개 필요합니다. 지금은 " + words.length + "개입니다" +
        (dup > 0 ? " (빈 항목과 중복 " + dup + "개를 뺐습니다)" : "") + ". " + (CELLS - words.length) + "개 이상 더 넣어 주세요.", true);
      return;
    }
    var boards = [], sigs = {}, tries = 0;
    while (boards.length < BINGO_CONFIG.boardCount && tries < 200) {
      tries++;
      var b = shuffle(words).slice(0, CELLS), sig = b.join("\u0001");
      if (sigs[sig]) continue;
      sigs[sig] = true; boards.push(b);
    }
    if (boards.length < BINGO_CONFIG.boardCount) { say("서로 다른 빙고판을 만들 수 없습니다. 단어를 더 넣어 주세요.", true); return; }
    state = {
      topic: id, customText: els.custom.value.slice(0, 10000), goal: parseInt(els.goal.value, 10) || BINGO_CONFIG.defaultGoal,
      words: words, boards: boards, marks: newMarks(), active: 0
    };
    editing = false;
    say("빙고판 " + BINGO_CONFIG.boardCount + "개를 만들었습니다. (" + (topic ? topic.label : "") + ", 목표 " + state.goal + "줄)");
    save(); render();
  }
  function parseCustomRawCount() {
    return String(els.custom.value).split(/[\n\r,，、]+/).map(function (w) { return w.trim(); }).filter(Boolean).length;
  }

  /* ---------- 그리기 ---------- */
  function render() {
    if (!state || !state.boards) { els.game.hidden = true; els.note.hidden = false; return; }
    els.game.hidden = false;
    var b = state.active, board = state.boards[b], marks = state.marks[b];

    els.tabs.textContent = "";
    for (var t = 0; t < BINGO_CONFIG.boardCount; t++) {
      (function (t) {
        var btn = el("button", "bingo-tab" + (t === b ? " is-on" : ""), String(t + 1) + "번");
        btn.type = "button"; btn.setAttribute("aria-pressed", t === b ? "true" : "false");
        btn.setAttribute("aria-label", (t + 1) + "번 빙고판");
        btn.addEventListener("click", function () {
          if (editing && !window.confirm("수정 중인 내용은 저장되지 않습니다. 판을 바꿀까요?")) return;
          editing = false; state.active = t; save(); render();
        });
        els.tabs.appendChild(btn);
      })(t);
    }

    els.board.textContent = "";
    els.board.setAttribute("aria-label", (b + 1) + "번 빙고판");
    for (var i = 0; i < CELLS; i++) {
      if (editing) {
        var inp = el("input", "bingo-cell-input"); inp.type = "text"; inp.value = board[i];
        inp.maxLength = BINGO_CONFIG.maxWordLength; inp.setAttribute("aria-label", (i + 1) + "번째 칸");
        els.board.appendChild(inp);
      } else {
        (function (i) {
          var c = el("button", "bingo-cell" + (marks[i] ? " is-on" : ""), board[i]);
          c.type = "button"; c.setAttribute("aria-pressed", marks[i] ? "true" : "false");
          c.addEventListener("click", function () { toggle(i); });
          els.board.appendChild(c);
        })(i);
      }
    }
    updateStatus();
    els.edit.hidden = editing; els.saveEdit.hidden = !editing; els.cancelEdit.hidden = !editing;
    els.clear.hidden = editing; els.reset.hidden = editing;
    var can = !started();
    els.edit.disabled = !can;
    els.edit.title = can ? "" : "표시를 모두 지운 뒤에 수정할 수 있습니다";
  }

  function updateStatus() {
    var lines = countLines(state.marks[state.active]);
    els.status.textContent = "완성된 줄: " + lines + "줄 / 목표 " + state.goal + "줄";
    var won = lines >= state.goal;
    els.win.hidden = !won;
    els.win.textContent = won ? "🎉 빙고! 목표 " + state.goal + "줄을 완성했습니다." : "";
    var tabs = els.tabs.children;
    for (var t = 0; t < tabs.length; t++) {
      var done = countLines(state.marks[t]) >= state.goal;
      tabs[t].classList.toggle("is-win", done);
    }
    els.edit.disabled = started();
    els.edit.title = started() ? "표시를 모두 지운 뒤에 수정할 수 있습니다" : "";
  }

  function toggle(i) {
    var m = state.marks[state.active];
    m[i] = !m[i];
    var btn = els.board.children[i];
    btn.classList.toggle("is-on", m[i]);
    btn.setAttribute("aria-pressed", m[i] ? "true" : "false");
    updateStatus(); save();
  }

  /* ---------- 칸 수정 ---------- */
  function startEdit() { if (!started()) { editing = true; render(); var f = els.board.querySelector("input"); if (f) f.focus(); } }
  function saveEdit() {
    var inputs = els.board.querySelectorAll("input"), vals = [], seen = {}, i;
    for (i = 0; i < inputs.length; i++) {
      var v = inputs[i].value.replace(/\s+/g, " ").trim();
      inputs[i].classList.remove("is-bad");
      if (!v) { inputs[i].classList.add("is-bad"); say((i + 1) + "번째 칸이 비어 있습니다.", true); inputs[i].focus(); return; }
      if (v.length > BINGO_CONFIG.maxWordLength) { inputs[i].classList.add("is-bad"); say((i + 1) + "번째 칸이 너무 깁니다. (" + BINGO_CONFIG.maxWordLength + "자 이하)", true); inputs[i].focus(); return; }
      if (seen[v] != null) {
        inputs[i].classList.add("is-bad"); inputs[seen[v]].classList.add("is-bad");
        say("같은 단어가 중복되었습니다: " + v + " (" + (seen[v] + 1) + "번째와 " + (i + 1) + "번째 칸)", true); inputs[i].focus(); return;
      }
      seen[v] = i; vals.push(v);
    }
    state.boards[state.active] = vals; editing = false;
    say("칸을 수정했습니다."); save(); render();
  }

  /* ---------- 지우기 ---------- */
  function clearMarks() {
    if (!state.marks[state.active].some(Boolean)) { say("지울 표시가 없습니다."); return; }
    if (!window.confirm((state.active + 1) + "번 판의 표시를 모두 지울까요?")) return;
    state.marks[state.active] = new Array(CELLS).fill(false);
    say((state.active + 1) + "번 판의 표시를 지웠습니다."); save(); render();
  }
  function resetAll() {
    if (!window.confirm("빙고판과 모든 표시가 지워지고 새로 시작합니다. 계속할까요?")) return;
    state = null; editing = false; wipeStore();
    els.topic.value = BINGO_CONFIG.topics[0].id; els.goal.value = String(BINGO_CONFIG.defaultGoal); els.custom.value = "";
    syncCustom(); say("새 게임을 시작합니다. 종류를 고르고 빙고판을 만들어 주세요."); render();
  }

  /* ---------- 시작 ---------- */
  build();
  els.goal.value = String(BINGO_CONFIG.defaultGoal);
  var saved = load();
  if (saved) {
    state = saved;
    els.topic.value = saved.topic; els.goal.value = String(saved.goal); els.custom.value = saved.customText;
  }
  syncCustom();
  render();
})();
