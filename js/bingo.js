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
      // 성경 퀴즈: 칸에는 정답이 들어가고, "문제 내기"로 나온 문제의 정답 칸을 찾아 누릅니다. 정답은 서로 달라야 하고 25개 이상이어야 합니다.
      { id: "quiz", label: "성경 퀴즈", words: [], quiz: [
        { q: "하나님이 가장 처음 만드신 사람은?", a: "아담" },
        { q: "아담의 갈비뼈로 만들어진 사람은?", a: "하와" },
        { q: "홍수 때 방주를 만든 사람은?", a: "노아" },
        { q: "‘믿음의 조상’으로 불리는 사람은?", a: "아브라함" },
        { q: "아브라함이 하나님께 드리려 했던 아들은?", a: "이삭" },
        { q: "형 에서를 속이고 장자의 축복을 받은 사람은?", a: "야곱" },
        { q: "형들에게 팔려 애굽의 총리가 된 사람은?", a: "요셉" },
        { q: "애굽에서 이스라엘 백성을 이끌어 낸 지도자는?", a: "모세" },
        { q: "모세가 십계명을 받은 산은?", a: "시내산" },
        { q: "모세를 이어 요단강을 건너 가나안을 정복한 지도자는?", a: "여호수아" },
        { q: "7일 동안 돌았더니 성벽이 무너진 성은?", a: "여리고" },
        { q: "머리카락에 힘의 비밀이 있던 사사는?", a: "삼손" },
        { q: "시어머니 나오미를 따라 이스라엘로 온 모압 여인은?", a: "룻" },
        { q: "물맷돌로 골리앗을 쓰러뜨린 소년은?", a: "다윗" },
        { q: "하나님께 지혜를 구한 이스라엘의 왕은?", a: "솔로몬" },
        { q: "까마귀가 떡과 고기를 가져다 먹인 선지자는?", a: "엘리야" },
        { q: "사자 굴에 던져졌어도 하나님이 지켜 주신 사람은?", a: "다니엘" },
        { q: "큰 물고기 뱃속에 사흘 있었던 선지자는?", a: "요나" },
        { q: "페르시아의 왕비가 되어 민족을 구한 여인은?", a: "에스더" },
        { q: "모든 것을 잃고도 믿음을 지킨 동방의 의인은?", a: "욥" },
        { q: "예수님이 태어나신 마을은?", a: "베들레헴" },
        { q: "예수님이 자라신 마을은?", a: "나사렛" },
        { q: "예수님께 세례를 베푼 사람은?", a: "세례 요한" },
        { q: "예수님이 물을 포도주로 바꾸신 혼인 잔치가 있던 마을은?", a: "가나" },
        { q: "예수님이 ‘반석’이라는 뜻의 이름을 주신 어부 제자는?", a: "베드로" },
        { q: "은 삼십에 예수님을 판 제자는?", a: "가룟 유다" },
        { q: "예수님이 십자가에 못 박히신 언덕은?", a: "골고다" },
        { q: "밤에 예수님을 찾아온 바리새인 지도자는?", a: "니고데모" },
        { q: "다메섹 도상에서 예수님을 만나 회심한 사람은?", a: "바울" },
        { q: "최초의 순교자는?", a: "스데반" },
        { q: "오순절에 제자들에게 임하신 분은?", a: "성령" },
        { q: "예수님의 첫 번째 기적에서 물이 변한 것은?", a: "포도주" },
        { q: "광야에서 하나님이 날마다 내려 주신 양식은?", a: "만나" },
        { q: "주기도문은 ‘하늘에 계신 우리 ___’로 시작합니다.", a: "아버지" },
        { q: "십계명이 기록된 것은?", a: "돌판" },
        { q: "성경의 첫 번째 책은?", a: "창세기" },
        { q: "신약성경의 첫 번째 책은?", a: "마태복음" },
        { q: "성경의 마지막 책은?", a: "요한계시록" },
        { q: "성경에서 가장 긴 책(150편)은?", a: "시편" },
        { q: "‘사랑의 장’으로 불리는 고린도전서의 장은?", a: "13장" },
        { q: "광야에서 밤에 이스라엘 백성의 길을 비춘 것은?", a: "불기둥" },
        { q: "홍수 후 하나님이 약속의 표로 보여 주신 것은?", a: "무지개" },
        { q: "하나님이 야곱에게 주신 새 이름은?", a: "이스라엘" },
        { q: "아브라함의 아내는?", a: "사라" },
        { q: "‘예수님이 사랑하시는 제자’로 불린 사람은?", a: "요한" },
        { q: "예수님의 어머니는?", a: "마리아" },
        { q: "뽕나무에 올라가 예수님을 본 세리장은?", a: "삭개오" },
        { q: "보리떡 다섯 개와 물고기 두 마리로 먹은 남자의 수는?", a: "5000명" },
        { q: "부활하신 예수님의 못 자국을 보기 전에는 믿지 않겠다던 제자는?", a: "도마" },
        { q: "예수님이 칭찬하신 가난한 과부가 드린 헌금은?", a: "두 렙돈" },
        { q: "요한복음 3:16 ‘하나님이 세상을 이처럼 사랑하사 ___를 주셨으니’", a: "독생자" },
        { q: "하나님이 아담과 하와를 두신 동산은?", a: "에덴동산" }
      ] }
    ]
  };

  var root = document.getElementById("bingoApp");
  if (!root) return;

  var N = BINGO_CONFIG.size, CELLS = N * N;
  var state = null;        // {topic, goal, words, boards, marks, active, quiz}
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
    if (!Number.isInteger(s.goal) || s.goal < 1 || s.goal > BINGO_CONFIG.maxGoal) return false;
    if (!Array.isArray(s.words)) return false;
    if (s.boards == null) return s.marks == null;
    var tp = topicById(s.topic);
    if (tp.quiz) {
      var q = s.quiz, B = BINGO_CONFIG.boardCount;
      if (!q || !Array.isArray(q.order) || q.order.length !== tp.quiz.length || !Number.isInteger(q.idx) || q.idx < -1 || q.idx >= tp.quiz.length || typeof q.show !== "boolean") return false;
      if (!Array.isArray(q.choices) || q.choices.some(function (c) { return typeof c !== "string"; })) return false;
      if (q.solved !== null && !(Number.isInteger(q.solved) && q.solved >= -1 && q.solved < B)) return false;
      if (q.won !== null && !(Number.isInteger(q.won) && q.won >= 0 && q.won < B)) return false;
      if (!Array.isArray(q.wrong) || q.wrong.some(function (w) { return !Number.isInteger(w) || w < 0 || w >= B; })) return false;
      if (!Array.isArray(q.scores) || q.scores.length !== B || q.scores.some(function (n) { return !Number.isInteger(n) || n < 0 || n > 999; })) return false;
      var sn = {};
      for (var k = 0; k < q.order.length; k++) {
        if (!Number.isInteger(q.order[k]) || q.order[k] < 0 || q.order[k] >= tp.quiz.length || sn[q.order[k]]) return false;
        sn[q.order[k]] = true;
      }
    }
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
  function editLocked() {
    var tp = state && topicById(state.topic);
    if (tp && tp.quiz) return "성경 퀴즈는 정답 칸을 바꿀 수 없습니다";
    if (started()) return "표시를 모두 지운 뒤에 수정할 수 있습니다";
    return "";
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
    var l2 = el("label", null, "목표 (줄 수 · 퀴즈는 정답 수)"); l2.setAttribute("for", "bingoGoal");
    els.goal = el("select"); els.goal.id = "bingoGoal";
    for (var g = 1; g <= BINGO_CONFIG.maxGoal; g++) {
      var og = el("option", null, g + "줄"); og.value = String(g); els.goal.appendChild(og);
    }
    f2.appendChild(l2); f2.appendChild(els.goal);

    setup.appendChild(f1); setup.appendChild(f2);
    root.appendChild(setup);

    var row = el("div", "bingo-actions");
    els.make = el("button", "btn btn-primary", "빙고판 만들기"); els.make.type = "button";
    row.appendChild(els.make);
    root.appendChild(row);

    els.msg = el("p", "bingo-msg"); els.msg.setAttribute("role", "status"); els.msg.setAttribute("aria-live", "polite");
    root.appendChild(els.msg);

    els.game = el("div", "bingo-game"); els.game.hidden = true;
    els.tabs = el("div", "bingo-tabs"); els.tabs.setAttribute("role", "group"); els.tabs.setAttribute("aria-label", "빙고판 선택");
    els.quizBox = el("div", "bingo-quiz"); els.quizBox.hidden = true;
    els.quizNo = el("p", "bingo-quiz-no");
    els.quizQ = el("p", "bingo-quiz-q"); els.quizQ.setAttribute("aria-live", "polite");
    els.quizChoices = el("div", "bingo-quiz-choices"); els.quizChoices.setAttribute("role", "group"); els.quizChoices.setAttribute("aria-label", "보기");
    els.quizScore = el("p", "bingo-quiz-score");
    els.quizA = el("p", "bingo-quiz-a"); els.quizA.hidden = true;
    var qrow = el("div", "bingo-actions bingo-quiz-actions");
    els.quizNext = el("button", "btn btn-primary", "문제 내기"); els.quizNext.type = "button";
    els.quizShow = el("button", "btn btn-outline", "정답 보기(건너뛰기)"); els.quizShow.type = "button";
    qrow.appendChild(els.quizNext); qrow.appendChild(els.quizShow);
    [els.quizNo, els.quizQ, els.quizChoices, els.quizA, els.quizScore, qrow].forEach(function (n) { els.quizBox.appendChild(n); });
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
    [els.tabs, els.quizBox, els.status, els.win, els.board, els.tools].forEach(function (n) { els.game.appendChild(n); });
    root.appendChild(els.game);
    root.appendChild(els.note);

    els.make.addEventListener("click", make);
    els.quizNext.addEventListener("click", nextQuiz);
    els.quizShow.addEventListener("click", skipQuiz);
    els.edit.addEventListener("click", startEdit);
    els.saveEdit.addEventListener("click", saveEdit);
    els.cancelEdit.addEventListener("click", function () { editing = false; render(); });
    els.clear.addEventListener("click", clearMarks);
    els.reset.addEventListener("click", resetAll);
  }

  function say(text, bad) {
    els.msg.textContent = text || "";
    els.msg.className = "bingo-msg" + (bad ? " is-bad" : "");
  }

  /* ---------- 만들기 ---------- */
  function make() {
    if (state && state.boards && started() &&
        !window.confirm("지금 하던 빙고 표시가 모두 지워집니다. 새 빙고판을 만들까요?")) return;
    var id = els.topic.value, topic = topicById(id);
    var words = cleanWords(topic.quiz ? topic.quiz.map(function (x) { return x.a; }) : topic.words);
    if (words.length < CELLS) {
      say("빙고판 한 장에는 서로 다른 단어가 " + CELLS + "개 필요합니다. '" + topic.label + "'에는 지금 " + words.length + "개뿐입니다. (js/bingo.js 의 설정에서 " + (CELLS - words.length) + "개 이상 더 넣어 주세요)", true);
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
      topic: id, goal: parseInt(els.goal.value, 10) || BINGO_CONFIG.defaultGoal,
      words: words, boards: boards, marks: newMarks(), active: 0
    };
    if (topic.quiz) state.quiz = {
      order: shuffle(topic.quiz.map(function (_, i) { return i; })), idx: -1, show: false,
      choices: [], solved: null, wrong: [], scores: new Array(BINGO_CONFIG.boardCount).fill(0), won: null
    };
    editing = false;
    say("빙고판 " + BINGO_CONFIG.boardCount + "개를 만들었습니다. (" + (topic ? topic.label : "") + ", 목표 " + goalText() + ")");
    save(); render();
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
          if (isQuiz()) c.disabled = true;           // 퀴즈에서는 정답을 맞히면 칸이 자동으로 표시됨
          else c.addEventListener("click", function () { toggle(i); });
          els.board.appendChild(c);
        })(i);
      }
    }
    updateStatus();
    renderQuiz();
    els.edit.hidden = editing; els.saveEdit.hidden = !editing; els.cancelEdit.hidden = !editing;
    els.clear.hidden = editing; els.reset.hidden = editing;
    els.edit.disabled = !!editLocked();
    els.edit.title = editLocked();
  }

  function isQuiz() { var tp = state && topicById(state.topic); return !!(tp && tp.quiz && state.quiz); }
  function goalText() { return isQuiz() ? "정답 " + state.goal + "개" : state.goal + "줄"; }

  function makeChoices(item, tp) {
    var others = shuffle(cleanWords(tp.quiz.map(function (x) { return x.a; })).filter(function (a) { return a !== item.a; })).slice(0, 3);
    return shuffle(others.concat([item.a]));
  }

  function renderQuiz() {
    var tp = state && topicById(state.topic);
    var on = !!(tp && tp.quiz && state.quiz);
    els.quizBox.hidden = !on;
    if (!on) return;
    var qz = state.quiz, total = tp.quiz.length, B = BINGO_CONFIG.boardCount;
    els.quizChoices.textContent = "";
    var scoreTxt = [];
    for (var b = 0; b < B; b++) scoreTxt.push((b + 1) + "번 " + qz.scores[b] + "점");
    els.quizScore.textContent = "점수 · " + scoreTxt.join(" · ") + "  (먼저 " + state.goal + "번 맞히면 빙고!)";
    if (qz.idx < 0) {
      els.quizNo.textContent = "퀴즈 " + total + "문제";
      els.quizQ.textContent = "‘문제 내기’를 누르면 문제와 보기가 나옵니다. 위의 번호(판)를 고른 뒤 정답을 눌러 보세요. 정답을 먼저 " + state.goal + "번 맞힌 판이 빙고!";
      els.quizA.hidden = true; els.quizShow.disabled = true;
      els.quizNext.textContent = "문제 내기"; els.quizNext.disabled = false;
      return;
    }
    var item = tp.quiz[qz.order[qz.idx]];
    els.quizNo.textContent = "문제 " + (qz.idx + 1) + " / " + total + " · 지금 " + (state.active + 1) + "번 판";
    els.quizQ.textContent = item.q;
    var over = qz.won !== null, resolved = qz.solved !== null;
    var iWrong = qz.wrong.indexOf(state.active) >= 0;
    qz.choices.forEach(function (c) {
      var btn = el("button", "bingo-choice", c); btn.type = "button";
      var right = c === item.a;
      if (resolved && right) btn.classList.add("is-right");
      if (iWrong && !right && btn.dataset) btn.dataset.wrongBoard = "1";
      btn.disabled = resolved || over || iWrong;
      btn.addEventListener("click", function () { answerQuiz(c); });
      els.quizChoices.appendChild(btn);
    });
    if (resolved) {
      els.quizA.hidden = false;
      els.quizA.textContent = qz.solved >= 0 ? "정답! " + (qz.solved + 1) + "번 판이 맞혔어요 — " + item.a : "정답: " + item.a;
    } else if (iWrong) {
      els.quizA.hidden = false;
      els.quizA.textContent = "오답! " + (state.active + 1) + "번 판은 이 문제를 쉬어요. 다른 판을 눌러 도전하세요.";
    } else { els.quizA.hidden = true; }
    els.quizShow.disabled = resolved || over;
    els.quizShow.textContent = "정답 보기(건너뛰기)";
    els.quizNext.disabled = over || !resolved;
    els.quizNext.textContent = qz.idx + 1 >= total ? "처음부터 다시" : "다음 문제";
  }

  function nextQuiz() {
    var tp = state && topicById(state.topic);
    if (!tp || !tp.quiz || !state.quiz) return;
    var qz = state.quiz;
    if (qz.won !== null) return;
    if (qz.idx >= 0 && qz.solved === null) return;   // 현재 문제를 푼 뒤에 다음으로
    if (qz.idx + 1 >= tp.quiz.length) { qz.order = shuffle(qz.order); qz.idx = 0; }
    else qz.idx++;
    qz.show = false; qz.solved = null; qz.wrong = [];
    qz.choices = makeChoices(tp.quiz[qz.order[qz.idx]], tp);
    save(); renderQuiz();
  }

  function answerQuiz(choice) {
    if (!isQuiz()) return;
    var tp = topicById(state.topic), qz = state.quiz;
    if (qz.idx < 0 || qz.solved !== null || qz.won !== null || qz.wrong.indexOf(state.active) >= 0) return;
    var item = tp.quiz[qz.order[qz.idx]], b = state.active;
    if (choice === item.a) {
      qz.scores[b]++; qz.solved = b;
      var cell = state.boards[b].indexOf(item.a);
      if (cell >= 0) state.marks[b][cell] = true;
      if (qz.scores[b] >= state.goal) qz.won = b;
    } else {
      qz.wrong.push(b);
    }
    save(); render();
  }

  function skipQuiz() {
    if (!isQuiz()) return;
    var qz = state.quiz;
    if (qz.idx < 0 || qz.solved !== null || qz.won !== null) return;
    qz.solved = -1; save(); renderQuiz();
  }

  function updateStatus() {
    var quiz = isQuiz(), lines = countLines(state.marks[state.active]), won, tabs = els.tabs.children, t;
    if (quiz) {
      var sc = state.quiz.scores;
      els.status.textContent = (state.active + 1) + "번 판 정답 " + sc[state.active] + "개 / 목표 " + state.goal + "개";
      won = sc[state.active] >= state.goal;
      els.win.textContent = won ? "🎉 빙고! " + (state.active + 1) + "번 판이 정답 " + state.goal + "개를 먼저 맞혔습니다." : "";
      for (t = 0; t < tabs.length; t++) tabs[t].classList.toggle("is-win", sc[t] >= state.goal);
    } else {
      els.status.textContent = "완성된 줄: " + lines + "줄 / 목표 " + state.goal + "줄";
      won = lines >= state.goal;
      els.win.textContent = won ? "🎉 빙고! 목표 " + state.goal + "줄을 완성했습니다." : "";
      for (t = 0; t < tabs.length; t++) tabs[t].classList.toggle("is-win", countLines(state.marks[t]) >= state.goal);
    }
    els.win.hidden = !won;
    els.edit.disabled = !!editLocked();
    els.edit.title = editLocked();
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
  function startEdit() { if (!editLocked()) { editing = true; render(); var f = els.board.querySelector("input"); if (f) f.focus(); } }
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
    var qz = isQuiz() ? state.quiz : null;
    if (!state.marks[state.active].some(Boolean) && !(qz && qz.scores[state.active])) { say("지울 표시가 없습니다."); return; }
    if (!window.confirm((state.active + 1) + "번 판의 표시" + (qz ? "와 점수" : "") + "를 모두 지울까요?")) return;
    state.marks[state.active] = new Array(CELLS).fill(false);
    if (qz) { qz.scores[state.active] = 0; if (qz.won === state.active) qz.won = null; }
    say((state.active + 1) + "번 판의 표시를 지웠습니다."); save(); render();
  }
  function resetAll() {
    if (!window.confirm("빙고판과 모든 표시가 지워지고 새로 시작합니다. 계속할까요?")) return;
    state = null; editing = false; wipeStore();
    els.topic.value = BINGO_CONFIG.topics[0].id; els.goal.value = String(BINGO_CONFIG.defaultGoal);
    say("새 게임을 시작합니다. 종류를 고르고 빙고판을 만들어 주세요."); render();
  }

  /* ---------- 시작 ---------- */
  build();
  els.goal.value = String(BINGO_CONFIG.defaultGoal);
  var saved = load();
  if (saved) {
    state = saved;
    els.topic.value = saved.topic; els.goal.value = String(saved.goal);
  }
  render();
})();
