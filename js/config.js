/* ============================================================
   안산상록교회 — 기본 정보 설정
   실제 정보로 바꾸실 항목은 아래 값들입니다. (README.md 참고)
   ============================================================ */
window.CHURCH = {
  name: "안산상록교회",
  shortName: "상록교회",
  englishName: "ANSAN SANGNOK CHURCH",
  pastorTitle: "담임목사",
  pastor: "이재용",
  founded: "", // 예: "1998" — 설립 연도를 입력하시면 홈페이지에 표시됩니다.
  denomination: "대한예수교장로회", // 소속 교단 (필요 시 수정)

  address: "경기도 안산시 단원구 신촌5길 40",
  addressDetail: "",
  phone: "031-480-5964",
  fax: "",
  email: "info@example.org",

  // 오시는 길 지도 — address 를 실제 주소로 바꾸면 자동으로 지도에 반영됩니다.
  mapQuery: "경기도 안산시 단원구 신촌5길 40",

  accent: "#2a4a75",

  worship: [
    { name: "주일 오전 예배", time: "오전 11:00", desc: "" },
    { name: "주일 오후 예배", time: "오후 1:30", desc: "" },
    { name: "수요 예배", time: "오후 7:30", desc: "" },
    { name: "금요 기도회", time: "오후 9:00", desc: "" },
    { name: "새벽 기도회", time: "오전 5:00", desc: "" },
  ],

  sns: {
    youtube: "",
    instagram: "",
    kakao: "",
  },
};

/* --- 비공개 교적 관리(gyojeok.html) — Supabase 연결 정보 -----------------
   두 값을 채우면 켜집니다. anon key 는 "공개돼도 되는" 키입니다 — 실제 보안은
   Supabase 쪽 RLS(SQL실행하기/01_members_schema.sql)가 담당합니다.
   로그인 계정은 Supabase 대시보드 → Authentication → Users 에서 직접 만드세요. */
window.SUPABASE_URL = "";
window.SUPABASE_ANON_KEY = "";
