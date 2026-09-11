/* ============================================================
   주보 데이터 — 맨 앞이 이번 주입니다. 새 주보는 배열 맨 앞에 추가하세요.

   morning : 주일 낮 예배 — 예배 순서를 그대로 적습니다.
             stand: true 를 넣으면 "일어섭니다(※)" 표시가 붙습니다.
   services: 주일 오후 예배 · 수요 예배 — 제목, 본문, 기도자만 적습니다.
   ============================================================ */
window.BULLETINS = [
  {
    date: "2026-09-06",
    dateLabel: "2026. 9. 6",
    motto: "야곱의 축복을 받는 해",

    // 홈 화면 "최근 주보" 칸에 쓰입니다
    title: "주일예배 주보",
    scripture: "갈라디아서 5:16-21",
    preacher: "이재용 목사",

    morning: {
      name: "주일 낮 예배",
      time: "오전 11시",
      note: "10시 45분부터 경배와 찬양으로 · 찬양인도 중창단",
      verse: "“하나님은 영이시니 영과 진리로 예배할지니라” (요 4:24)",
      order: [
        { part: "예배의 부름", detail: "지존하신 주님 이름 앞에", who: "인도자", stand: true },
        { part: "감사와 자백의 기도", detail: "", who: "다 같이", stand: true },
        { part: "신앙고백", detail: "사도신경", who: "다 같이", stand: true },
        { part: "찬송", detail: "620장", who: "다 같이" },
        { part: "대표기도", detail: "", who: "남경희 장로" },
        { part: "찬송", detail: "288장", who: "다 같이" },
        { part: "성경봉독", detail: "갈 5:16-21절", who: "다 같이" },
        { part: "설교", detail: "성령을 따라 행하라!", who: "이재용 목사", highlight: true },
        { part: "합심기도", detail: "", who: "다 같이" },
        { part: "봉헌 및 찬송", detail: "406장", who: "다 같이" },
        { part: "광고", detail: "", who: "인도자" },
        { part: "폐회송", detail: "54장", who: "다 함께" },
        { part: "축도", detail: "", who: "이재용 목사", stand: true }
      ]
    },

    services: [
      {
        name: "주일 오후 예배",
        title: "기독교인이 가져야 할 국가관",
        scripture: "디모데전서 2:1-4",
        prayer: "이송희 집사"
      },
      {
        name: "수요 예배",
        title: "부르짖는 믿음의 힘",
        scripture: "시편 119:145-152절",
        prayer: "박수자 권사"
      }
    ]
  }
];
