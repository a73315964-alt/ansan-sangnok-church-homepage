/* 도서관(자료실) 데이터 — 맨 앞이 최신입니다.
   - 공개 책 소개(표지·설명)는 누구나 볼 수 있습니다.
   - 디지털 도서(file)는 승인된 정회원만 내려받을 수 있습니다.
   1) Supabase 대시보드 → Storage → library 버킷에 PDF 를 올립니다
      (SQL실행하기/12_library_storage.sql 을 먼저 실행해야 버킷이 생깁니다)
   2) 올릴 때의 파일 이름을 아래 file 항목에 똑같이 적습니다 (예: "faith-cover.pdf")
   3) file 을 비워두면 "준비 중"으로 표시됩니다 */
window.LIBRARY = [
  {
    category: "신앙도서",
    title: "그래도 믿음이 필요하다",
    author: "강정훈",
    desc: "강정훈 저자의 신앙 도서입니다.",
    file: "",
  },
  {
    category: "신앙도서",
    title: "그리스도인으로 산다는 것은",
    author: "이재용",
    desc: "담임목사 이재용의 신앙 도서입니다.",
    file: "",
  },
];
