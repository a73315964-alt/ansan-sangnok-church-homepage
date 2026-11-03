/* 성경퀴즈 방 — 카훗(Kahoot!) 스타일 퀴즈 (4지선다 + O/X)
   · 외부 서비스·로그인 없이 이 기기에서만 작동합니다. 최고 점수만 이 기기(localStorage)에 저장됩니다.
   · 문제는 아래 KH_DATA 에서 고치거나 더 넣으세요.
       4지선다: ["문제", "정답", "오답1", "오답2", "오답3"]
       O/X    : ["문장", true 또는 false, "해설"] */
(function () {
  "use strict";
  var root = document.getElementById("kahootApp");
  if (!root) return;

  var KH_DATA = [
    { id: "pent", label: "모세오경", icon: "📜", mc: [
      ["하나님이 천지창조 첫째 날에 만드신 것은?", "빛", "해와 달", "동물", "사람"],
      ["노아의 방주가 홍수 뒤에 머문 산은?", "아라랏산", "시내산", "모리아산", "느보산"],
      ["아브라함과 사라가 늙어서 얻은 약속의 아들은?", "이삭", "이스마엘", "야곱", "에서"],
      ["애굽에 내린 열 가지 재앙 중 마지막 재앙은?", "장자의 죽음", "개구리", "메뚜기", "흑암"],
      ["모세가 십계명 돌판을 받은 산은?", "시내산", "갈멜산", "시온산", "감람산"],
      ["광야에서 하나님이 아침마다 내려 주신 양식은?", "만나", "떡", "포도", "무화과"],
      ["모세가 가나안 땅을 바라보고 생을 마친 산은?", "느보산", "시내산", "아라랏산", "헤르몬산"]
    ], ox: [
      ["십계명은 모두 열 가지 계명이다.", true, "출애굽기 20장에 열 가지 계명이 기록되어 있어요."],
      ["야곱의 열두 아들 중 막내는 요셉이다.", false, "막내는 베냐민입니다."],
      ["모세오경은 창세기, 출애굽기, 레위기, 민수기, 신명기 다섯 권이다.", true, "‘율법서’라고도 부릅니다."]
    ] },
    { id: "proph", label: "선지서", icon: "🔥", mc: [
      ["하나님의 명령을 피해 도망가다 큰 물고기 뱃속에 있었던 선지자는?", "요나", "이사야", "예레미야", "호세아"],
      ["사자 굴에 던져졌지만 하나님이 지켜 주신 선지자는?", "다니엘", "엘리야", "에스겔", "아모스"],
      ["갈멜산에서 바알 선지자들과 대결한 선지자는?", "엘리야", "엘리사", "이사야", "아모스"],
      ["‘마른 뼈들이 살아나는 환상’을 본 선지자는?", "에스겔", "예레미야", "다니엘", "미가"],
      ["‘눈물의 선지자’로 불리는 사람은?", "예레미야", "이사야", "호세아", "스가랴"],
      ["구약성경의 마지막 책은?", "말라기", "스가랴", "학개", "요엘"],
      ["이사야 53장에서 ‘고난받는 종’으로 예언된 분은?", "메시아(예수님)", "다윗", "솔로몬", "모세"]
    ], ox: [
      ["요나는 하나님의 명령대로 곧바로 니느웨로 갔다.", false, "요나는 다시스로 도망가려다 큰 물고기를 만났습니다."],
      ["엘리야는 죽음을 보지 않고 하늘로 올라갔다.", true, "열왕기하 2장, 회오리바람을 타고 올라갔어요."],
      ["다니엘의 세 친구는 풀무불에 던져졌지만 상하지 않았다.", true, "다니엘 3장 — 사드락, 메삭, 아벳느고."]
    ] },
    { id: "gospel", label: "사복음서", icon: "✝️", mc: [
      ["다음 중 사복음서에 속하지 않는 책은?", "사도행전", "마태복음", "누가복음", "요한복음"],
      ["예수님이 태어나신 마을은?", "베들레헴", "나사렛", "예루살렘", "가버나움"],
      ["요단강에서 예수님께 세례를 베푼 사람은?", "세례 요한", "베드로", "사도 요한", "안드레"],
      ["예수님이 물을 포도주로 바꾸신 첫 표적의 장소는?", "가나 혼인 잔치", "예루살렘 성전", "베다니", "갈릴리 바다"],
      ["예수님을 은 삼십에 판 제자는?", "가룟 유다", "도마", "빌립", "마태"],
      ["오병이어의 기적에서 먹은 장정의 수는?", "오천 명", "삼천 명", "사천 명", "칠천 명"],
      ["‘탕자의 비유’가 기록된 복음서는?", "누가복음", "마태복음", "마가복음", "요한복음"]
    ], ox: [
      ["예수님은 십자가에 달리신 지 사흘 만에 부활하셨다.", true, "성경은 ‘사흘 만에’ 살아나셨다고 증언합니다."],
      ["사복음서 중 신약성경에서 가장 먼저 나오는 책은 마가복음이다.", false, "가장 먼저 나오는 책은 마태복음입니다."],
      ["베드로는 원래 갈릴리의 어부였다.", true, "‘사람을 낚는 어부’가 되라고 부르셨어요."]
    ] },
    { id: "paul", label: "바울서신", icon: "✉️", mc: [
      ["바울의 회심 전 이름은?", "사울", "바나바", "실라", "디모데"],
      ["바울이 예수님을 만난 곳으로 가던 길의 도시는?", "다메섹", "안디옥", "로마", "에베소"],
      ["‘사랑장’이라 불리는 고린도전서의 장은?", "13장", "1장", "15장", "7장"],
      ["다음 중 바울이 쓴 편지가 아닌 것은?", "야고보서", "로마서", "갈라디아서", "빌립보서"],
      ["빌립보서 4:4 ‘주 안에서 항상 ___ 내가 다시 말하노니 ___’", "기뻐하라", "감사하라", "기도하라", "깨어 있으라"],
      ["에베소서 6장 ‘하나님의 전신 갑주’에서 악한 자의 불화살을 막는 것은?", "믿음의 방패", "구원의 투구", "성령의 검", "평안의 복음의 신"],
      ["고린도전서 13장에서 ‘그중에 제일은 ___이라’의 답은?", "사랑", "믿음", "소망", "지혜"]
    ], ox: [
      ["바울은 예수님의 열두 제자 중 한 사람이다.", false, "바울은 부활하신 예수님을 만난 뒤 사도가 되었습니다."],
      ["바울은 로마 시민권을 가지고 있었다.", true, "사도행전 22장에 나옵니다."],
      ["데살로니가전서는 바울이 쓴 편지다.", true, "‘항상 기뻐하라 쉬지 말고 기도하라’가 이 편지에 있어요."]
    ] },
    { id: "person", label: "인물", icon: "🧑", mc: [
      ["머리카락에 힘의 비밀이 있었던 사사는?", "삼손", "기드온", "입다", "에훗"],
      ["물맷돌 하나로 골리앗을 쓰러뜨린 소년은?", "다윗", "요나단", "사울", "삼손"],
      ["꿈 해석으로 애굽의 총리가 된 사람은?", "요셉", "모세", "다니엘", "야곱"],
      ["‘지혜의 왕’으로 유명한 이스라엘 왕은?", "솔로몬", "다윗", "히스기야", "요시야"],
      ["‘어디로 가시든지 나도 가겠나이다’라고 시어머니께 말한 여인은?", "룻", "에스더", "한나", "라합"],
      ["‘믿음의 조상’이라 불리는 사람은?", "아브라함", "이삭", "노아", "모세"],
      ["왕후 에스더가 목숨을 걸고 구한 백성은?", "유대인", "애굽 사람", "앗수르 사람", "블레셋 사람"]
    ], ox: [
      ["모세는 애굽 공주의 아들로 자랐다.", true, "바로의 딸이 갈대상자에서 건져 키웠습니다."],
      ["다윗은 이스라엘의 첫 번째 왕이다.", false, "첫 번째 왕은 사울입니다."],
      ["베드로는 예수님을 세 번 모른다고 했다.", true, "닭이 울기 전에 세 번 부인했어요."]
    ] },
    { id: "place", label: "지명", icon: "🗺️", mc: [
      ["이스라엘 백성이 일곱 날 동안 돌았더니 성벽이 무너진 성은?", "여리고", "아이", "가나", "벧엘"],
      ["예수님이 십자가에 못 박히신 언덕은?", "골고다", "감람산", "시내산", "갈멜산"],
      ["예수님이 어린 시절을 보내신 마을은?", "나사렛", "베들레헴", "여리고", "베다니"],
      ["사도 요한이 계시록을 받은 섬은?", "밧모섬", "구브로", "몰타", "그레데"],
      ["예수님이 제자들이 보는 앞에서 승천하신 산은?", "감람산", "모리아산", "시내산", "헤르몬산"],
      ["예수님이 물 위를 걸으신 곳은?", "갈릴리 바다", "사해", "홍해", "요단강"],
      ["아브라함이 이삭을 바치려 했던 산은?", "모리아산", "시내산", "느보산", "아라랏산"]
    ], ox: [
      ["가나안은 ‘젖과 꿀이 흐르는 땅’이라 불렸다.", true, "출애굽기 3장에 나오는 약속의 땅입니다."],
      ["바벨탑은 시날 평지에 세워졌다.", true, "창세기 11장입니다."],
      ["예수님은 베들레헴에서 십자가에 달리셨다.", false, "베들레헴은 탄생지이고, 십자가는 예루살렘 골고다입니다."]
    ] },
    { id: "fun", label: "넌센스", icon: "🤪", mc: [
      ["성경에서 가장 오래(969세) 산 사람은?", "므두셀라", "아담", "노아", "모세"],
      ["노아의 방주에 탄 사람은 모두 몇 명일까요?", "8명", "2명", "12명", "7명"],
      ["다윗이 시냇가에서 주운 매끄러운 돌은 몇 개였을까요?", "5개", "1개", "3개", "12개"],
      ["동방박사가 아기 예수께 드린 선물이 아닌 것은?", "다이아몬드", "황금", "유향", "몰약"],
      ["하나님이 아담을 만드실 때 쓰신 재료는?", "흙", "물", "불", "바람"],
      ["나귀가 사람의 말을 해서 깜짝 놀란 선지자는?", "발람", "발락", "바울", "바나바"],
      ["삼손이 가장 무서워하는 직업은?", "이발사", "소방관", "사자 조련사", "대장장이"]
    ], ox: [
      ["성경에는 노아의 방주가 3층이었다고 기록되어 있다.", true, "창세기 6:16 — 상중하 삼층."],
      ["예수님의 제자는 열 명이었다.", false, "열두 제자입니다."],
      ["요나를 삼킨 것은 성경에 ‘큰 물고기’라고 기록되어 있다.", true, "‘고래’라는 말은 성경 본문에 없어요."]
    ] }
  ];

  var CFG = { count: 10, seconds: 20, best: "kahoot:best:v1" };
  var SHAPES = ["▲", "◆", "●", "■"];            // 카훗 느낌의 보기 모양/색
  var st = null, timer = null;
  var picked = { cats: {}, type: "mix" };
  KH_DATA.forEach(function (c) { picked.cats[c.id] = true; });

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function bestGet() { try { return parseInt(localStorage.getItem(CFG.best), 10) || 0; } catch (e) { return 0; } }
  function bestPut(n) { try { localStorage.setItem(CFG.best, String(n)); } catch (e) {} }

  /* ---------- 시작 화면 ---------- */
  function setup() {
    clearInterval(timer); st = null; root.textContent = "";
    var box = el("div", "kh-box");
    box.appendChild(el("h3", "kh-title", "🎮 성경 퀴즈 대결"));
    box.appendChild(el("p", "kh-sub", "보기를 빨리 누를수록 점수가 높아요! 연속으로 맞히면 보너스 🔥"));

    box.appendChild(el("p", "kh-label", "1. 주제 고르기 (여러 개 선택)"));
    var chips = el("div", "kh-chips");
    KH_DATA.forEach(function (c) {
      var b = el("button", "kh-chip" + (picked.cats[c.id] ? " on" : ""), c.icon + " " + c.label);
      b.type = "button"; b.setAttribute("aria-pressed", picked.cats[c.id] ? "true" : "false");
      b.addEventListener("click", function () {
        picked.cats[c.id] = !picked.cats[c.id];
        b.classList.toggle("on", picked.cats[c.id]); b.setAttribute("aria-pressed", picked.cats[c.id] ? "true" : "false");
      });
      chips.appendChild(b);
    });
    box.appendChild(chips);

    box.appendChild(el("p", "kh-label", "2. 문제 유형"));
    var types = el("div", "kh-chips");
    [["mix", "섞어서"], ["mc", "4지선다만"], ["ox", "O/X만"]].forEach(function (t) {
      var b = el("button", "kh-chip" + (picked.type === t[0] ? " on" : ""), t[1]); b.type = "button";
      b.addEventListener("click", function () {
        picked.type = t[0];
        [].forEach.call(types.children, function (x) { x.classList.remove("on"); }); b.classList.add("on");
      });
      types.appendChild(b);
    });
    box.appendChild(types);

    var go = el("button", "btn btn-primary kh-go", "퀴즈 시작!"); go.type = "button";
    var msg = el("p", "kh-msg"); msg.setAttribute("role", "status");
    go.addEventListener("click", function () {
      var ids = KH_DATA.filter(function (c) { return picked.cats[c.id]; });
      if (!ids.length) { msg.textContent = "주제를 한 개 이상 골라 주세요."; return; }
      start(ids);
    });
    box.appendChild(go); box.appendChild(msg);
    var b = bestGet();
    if (b) box.appendChild(el("p", "kh-best", "🏆 이 기기의 최고 점수: " + b + "점"));
    root.appendChild(box);
  }

  function start(cats) {
    var pool = [];
    cats.forEach(function (c) {
      if (picked.type !== "ox") c.mc.forEach(function (m) { pool.push({ kind: "mc", cat: c.label, q: m[0], a: m[1], opts: m.slice(1) }); });
      if (picked.type !== "mc") c.ox.forEach(function (o) { pool.push({ kind: "ox", cat: c.label, q: o[0], a: o[1], why: o[2] }); });
    });
    pool = shuffle(pool).slice(0, CFG.count);
    st = { qs: pool, i: 0, score: 0, right: 0, streak: 0, best: 0, t0: 0, done: false };
    ask();
  }

  /* ---------- 문제 ---------- */
  function ask() {
    clearInterval(timer);
    var q = st.qs[st.i]; st.done = false; root.textContent = "";
    var box = el("div", "kh-box");
    var top = el("div", "kh-top");
    top.appendChild(el("span", "kh-no", "문제 " + (st.i + 1) + " / " + st.qs.length + " · " + q.cat));
    var clock = el("span", "kh-clock", "⏱ " + CFG.seconds + "초"); top.appendChild(clock);
    top.appendChild(el("span", "kh-score", "⭐ " + st.score + "점" + (st.streak > 1 ? " · 🔥 " + st.streak + "연속" : "")));
    box.appendChild(top);
    var bar = el("div", "kh-bar"), fill = el("i"); bar.appendChild(fill); box.appendChild(bar);
    box.appendChild(el("p", "kh-q", q.q));
    var grid = el("div", "kh-grid" + (q.kind === "ox" ? " ox" : ""));
    var opts = q.kind === "ox" ? [{ t: "O  맞다", v: q.a === true, c: 0 }, { t: "X  틀리다", v: q.a === false, c: 1 }]
      : shuffle(q.opts).map(function (t, k) { return { t: t, v: t === q.a, c: k }; });
    var btns = [];
    opts.forEach(function (o) {
      var b = el("button", "kh-opt c" + o.c); b.type = "button";
      if (q.kind === "mc") b.appendChild(el("span", "kh-shape", SHAPES[o.c])); 
      b.appendChild(el("span", "kh-text", o.t));
      b.addEventListener("click", function () { answer(o, b, btns, opts, q); });
      btns.push(b); grid.appendChild(b);
    });
    box.appendChild(grid);
    var fb = el("div", "kh-fb"); fb.setAttribute("aria-live", "polite"); fb.hidden = true;
    box.appendChild(fb);
    root.appendChild(box);
    st.fb = fb; st.fill = fill; st.t0 = Date.now();
    fill.style.width = "100%";
    timer = setInterval(function () {
      var left = CFG.seconds - (Date.now() - st.t0) / 1000;
      fill.style.width = Math.max(0, left / CFG.seconds * 100) + "%";
      clock.textContent = "⏱ " + Math.max(0, Math.ceil(left)) + "초";
      if (left <= 0) { clearInterval(timer); answer(null, null, btns, opts, q); }
    }, 100);
  }

  function answer(o, btn, btns, opts, q) {
    if (st.done) return; st.done = true; clearInterval(timer);
    var ok = !!(o && o.v), sec = (Date.now() - st.t0) / 1000, pts = 0;
    if (ok) {
      pts = Math.round(1000 * (1 - Math.min(sec, CFG.seconds) / CFG.seconds / 2));   // 빠를수록 최대 1000점
      st.streak++; st.right++;
      if (st.streak >= 2) pts += Math.min(st.streak - 1, 5) * 100;                   // 연속 보너스
      st.score += pts; st.best = Math.max(st.best, st.streak);
    } else st.streak = 0;
    btns.forEach(function (b, k) { b.disabled = true; b.classList.add(opts[k].v ? "good" : "dim"); });
    if (btn && !ok) btn.classList.add("bad");
    var fb = st.fb; fb.hidden = false; fb.className = "kh-fb " + (ok ? "ok" : "no");
    fb.textContent = "";
    fb.appendChild(el("b", null, ok ? "🎉 정답! +" + pts + "점" : (o ? "😢 아쉬워요" : "⏰ 시간 초과")));
    if (!ok) fb.appendChild(el("span", null, " 정답: " + (q.kind === "ox" ? (q.a ? "O" : "X") : q.a)));
    if (q.why) fb.appendChild(el("span", "kh-why", " — " + q.why));
    var nx = el("button", "btn btn-primary kh-next", st.i + 1 >= st.qs.length ? "결과 보기" : "다음 문제"); nx.type = "button";
    nx.addEventListener("click", function () { st.i++; if (st.i >= st.qs.length) finish(); else ask(); });
    fb.appendChild(nx); nx.focus();
    st.fill.style.width = "0";
    root.querySelector(".kh-score").textContent = "⭐ " + st.score + "점" + (st.streak > 1 ? " · 🔥 " + st.streak + "연속" : "");
  }

  function finish() {
    root.textContent = "";
    var prev = bestGet(), newBest = st.score > prev; if (newBest) bestPut(st.score);
    var box = el("div", "kh-box kh-result");
    box.appendChild(el("h3", "kh-title", newBest ? "🏆 최고 기록!" : "🎊 퀴즈 끝!"));
    box.appendChild(el("p", "kh-big", st.score + "점"));
    box.appendChild(el("p", "kh-sub", st.qs.length + "문제 중 " + st.right + "개 정답 · 최대 연속 " + st.best + "번"));
    var msg = st.right === st.qs.length ? "만점입니다! 성경박사님 👑" : st.right >= st.qs.length * 0.7 ? "아주 잘했어요! 👏" : "다시 도전하면 더 잘할 수 있어요 💪";
    box.appendChild(el("p", "kh-msg", msg));
    var again = el("button", "btn btn-primary kh-go", "다시 하기"); again.type = "button"; again.addEventListener("click", setup);
    box.appendChild(again); root.appendChild(box);
  }

  setup();
})();
