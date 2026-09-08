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

  /* 자료실(Cloudflare R2) 주소 — 사진·문서를 올리면 이 주소 뒤에 파일 경로가 붙습니다.
     예) filesBase + "/photos/2026추수감사절.jpg"
     바탕화면 "교회자료업로드" 폴더에 넣고 업로드.bat 을 실행하면 자동으로 올라갑니다. */
  filesBase: "https://files.ansansangrok.or.kr",

  /* 홈페이지 대표 주소 */
  siteUrl: "https://ansansangrok.or.kr",

  worship: [
    { name: "주일 오전 예배", time: "오전 11:00", desc: "" },
    { name: "주일 오후 예배", time: "오후 1:30", desc: "" },
    { name: "수요 예배", time: "오후 7:30", desc: "" },
    { name: "금요 기도회", time: "오후 9:00", desc: "" },
    { name: "새벽 기도회", time: "오전 5:00", desc: "" },
  ],

  // SNS 주소 — youtube 에 교회 유튜브 채널 주소를 넣으면 상단 메뉴 "유튜브"가 그 채널로 연결됩니다.
  // 예: "https://www.youtube.com/@안산상록교회"  (비워두면 유튜브 검색 결과로 연결됩니다)
  sns: {
    youtube: "https://www.youtube.com/@an-sangrok-church",
    instagram: "",
    kakao: "",
  },
};

/* --- 비공개 교적 관리(gyojeok.html) — Supabase 연결 정보 -----------------
   두 값을 채우면 켜집니다. anon key 는 "공개돼도 되는" 키입니다 — 실제 보안은
   Supabase 쪽 RLS(SQL실행하기/01_members_schema.sql)가 담당합니다.
   로그인 계정은 Supabase 대시보드 → Authentication → Users 에서 직접 만드세요. */
window.SUPABASE_URL = "https://mhdcsjdmcswxldjjatgk.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZGNzamRtY3N3eGxkamphdGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTgyNDMsImV4cCI6MjEwNDM5NDI0M30.pnJ0oOcIMdlwT9gpRVXzewBfx_JpbMvWb0VUBGs3lKk";
