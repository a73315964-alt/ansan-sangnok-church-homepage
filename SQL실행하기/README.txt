Supabase 대시보드 → SQL Editor 에서 01_members_schema.sql 을 실행하세요.
그다음 02_admin_allowlist.sql 을 실행하고, 파일 맨 아래 안내대로 관리자 이메일을 추가하세요.
(02 를 실행하면 admin_emails 에 등록된 계정만 교적을 볼 수 있습니다.)
1년 성경읽기를 쓰려면 이어서 03_bible_reading.sql 을 실행하세요.
(성도 회원 profiles, 읽기 기록 bible_reads, 시작일 reading_settings 가 만들어집니다.)
교적부를 "교인기록카드" 항목으로 쓰려면 04_members_registry.sql 을 실행하세요.
(기존 교적 자료는 그대로 두고 칸·가족사항·사진 저장소만 추가합니다.)
관리자 등급(최고 관리자/관리자)과 회원관리는 05_admin_roles.sql 입니다.
(최고 관리자 이메일은 이 파일 안에서 지정합니다.)
06_my_dashboard.sql — 나의 대시보드에서 본인 교적 카드 보기
07_bible_text.sql   — 성경 본문 표 (본문은 scripts\import-bible-text.ps1 로 넣음, 저장소에 올리지 않음)
08_member_verification.sql — 가입 시 성명·생년월일로 교적 대조 → 정회원 자동 인증, 회원 정지·승인 함수
이 폴더에는 개인정보가 들어있지 않습니다 (테이블 구조·권한 설정만 있음).

실제 성도 명단(이름/전화번호 등)을 넣는 SQL은 이 폴더가 아니라
바탕화면의 "안산상록교회-교적-비공개자료" 폴더에 따로 있습니다.
그 폴더는 GitHub 등 어디에도 절대 올리지 마세요 — README_주의.md 를 꼭 읽어주세요.
