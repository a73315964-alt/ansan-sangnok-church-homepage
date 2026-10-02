-- ============================================================
-- 안산상록교회 — 교적 접근을 "허용된 관리자 이메일"로만 제한
-- 01_members_schema.sql 을 실행한 뒤, Supabase SQL Editor 에서 이 파일을 실행하세요.
--
-- 왜 필요한가요?
--   01 파일의 정책은 "로그인한 사람이면 누구나" 허용입니다. 그런데 anon key 는
--   공개되어 있어서, 회원가입이 켜져 있으면 외부인이 직접 가입해 로그인할 수 있습니다.
--   이 파일은 아래 admin_emails 목록에 있는 계정만 교적을 보고 고칠 수 있게 바꿉니다.
--
-- 이 파일에는 실제 이메일을 적지 마세요 (GitHub 에 공개됩니다).
-- 관리자 이메일은 맨 아래 안내대로 SQL Editor 에서 직접 추가합니다.
-- ============================================================

-- 1) 관리자 이메일 목록 — RLS 를 켜고 정책을 만들지 않아서
--    웹(anon/authenticated)에서는 읽기·쓰기가 전혀 안 됩니다. SQL Editor 에서만 관리.
create table if not exists public.admin_emails (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_emails enable row level security;
revoke all on public.admin_emails from anon, authenticated;

-- 2) 현재 로그인한 사용자가 관리자인지 확인하는 함수
--    security definer: 사용자는 admin_emails 를 직접 못 읽지만, 이 함수는 확인 가능
create or replace function public.is_church_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_emails a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke execute on function public.is_church_admin() from public, anon;
grant execute on function public.is_church_admin() to authenticated;

-- 3) members 정책 교체: "로그인한 누구나" → "로그인한 관리자만"
drop policy if exists "members_select_authenticated" on public.members;
drop policy if exists "members_insert_authenticated" on public.members;
drop policy if exists "members_update_authenticated" on public.members;
drop policy if exists "members_delete_authenticated" on public.members;

drop policy if exists "members_select_admin" on public.members;
create policy "members_select_admin"
  on public.members for select
  to authenticated
  using (public.is_church_admin());

drop policy if exists "members_insert_admin" on public.members;
create policy "members_insert_admin"
  on public.members for insert
  to authenticated
  with check (public.is_church_admin());

drop policy if exists "members_update_admin" on public.members;
create policy "members_update_admin"
  on public.members for update
  to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());

drop policy if exists "members_delete_admin" on public.members;
create policy "members_delete_admin"
  on public.members for delete
  to authenticated
  using (public.is_church_admin());

-- ============================================================
-- 관리자 이메일 추가 (SQL Editor 에서 이메일만 바꿔 실행 — 이 파일에 저장하지 마세요)
--
--   insert into public.admin_emails (email) values ('관리자이메일@example.com');
--
-- 목록 확인:   select * from public.admin_emails;
-- 관리자 삭제: delete from public.admin_emails where email = '관리자이메일@example.com';
-- ============================================================
