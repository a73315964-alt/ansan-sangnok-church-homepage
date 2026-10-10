-- ============================================================
-- 안산상록교회 — 교적부 카드: "수상경력" 칸을 "소속기관" 으로 바꿈
-- 04_members_registry.sql 을 실행한 뒤 Supabase SQL Editor 에서 이 파일을 실행하세요.
-- 기존 awards(수상경력) 자료는 지우지 않고 그대로 둡니다. 여러 번 실행해도 안전합니다.
-- ============================================================

alter table public.members
  add column if not exists affiliation text;  -- 소속기관
