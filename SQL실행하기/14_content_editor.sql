-- ============================================================
-- 안산상록교회 — 주보·주일 설교 편집 권한 (관리자 중 지정된 사람만)
-- 02 와 05 를 실행한 뒤 Supabase SQL Editor 에서 이 파일을 실행하세요. 여러 번 실행해도 안전합니다.
--
-- 지금은 권한 칸과 확인 함수만 만듭니다. 주보·설교를 웹에서 고치는 화면은 아직 없습니다.
-- 권한을 주거나 빼는 것은 아래 맨 아래 안내대로 SQL Editor 에서 이메일만 바꿔 실행합니다.
-- 이 파일에는 실제 이메일을 적지 마세요 (GitHub 에 공개됩니다).
-- ============================================================

alter table public.admin_emails
  add column if not exists can_edit_content boolean not null default false;  -- 주보·주일 설교 편집

-- 현재 로그인한 사람이 주보·설교 편집 권한이 있는지 확인 (관리자이면서 권한이 켜진 경우만 true)
create or replace function public.can_edit_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select a.can_edit_content from public.admin_emails a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ), false);
$$;

revoke execute on function public.can_edit_content() from public, anon;
grant execute on function public.can_edit_content() to authenticated;

-- ============================================================
-- 권한 주기 / 빼기 (SQL Editor 에서 이메일만 바꿔 실행 — 이 파일에 저장하지 마세요)
--
--   update public.admin_emails set can_edit_content = true  where lower(email) = lower('이메일@example.com');
--   update public.admin_emails set can_edit_content = false where lower(email) = lower('이메일@example.com');
--
-- 확인:       select email, role, can_edit_content from public.admin_emails;
-- 주의: 대상이 먼저 관리자(admin_emails)로 등록되어 있어야 합니다 (05 의 관리자 임명).
-- ============================================================
