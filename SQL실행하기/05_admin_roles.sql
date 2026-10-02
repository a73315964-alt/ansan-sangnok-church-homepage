-- ============================================================
-- 안산상록교회 — 관리자 등급(최고 관리자 / 관리자) + 회원관리
-- 02, 03 을 실행한 뒤 Supabase SQL Editor 에서 실행하세요. 여러 번 실행해도 안전합니다.
--
--   최고 관리자(super) : 관리자 임명·해제, 회원 계정 삭제, 그 밖의 모든 관리 기능
--   관리자(admin)      : 교적부, 성경읽기 관리, 회원 승인
--   최고 관리자는 이 SQL 로만 지정합니다 (화면에서는 바꿀 수 없음).
-- ============================================================

alter table public.admin_emails add column if not exists role text not null default 'admin';
alter table public.admin_emails drop constraint if exists admin_emails_role_chk;
alter table public.admin_emails add constraint admin_emails_role_chk check (role in ('super', 'admin'));
alter table public.admin_emails add column if not exists appointed_by text;

-- 최고 관리자
insert into public.admin_emails (email, role, appointed_by)
values ('ljy9054@naver.com', 'super', 'SQL')
on conflict (email) do update set role = 'super';

-- ── 권한 확인 함수 ─────────────────────────────────────────────
create or replace function public.my_admin_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.role from public.admin_emails a
  where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_admin_role() = 'super', false);
$$;

revoke execute on function public.my_admin_role() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.my_admin_role() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- ── 회원가입: 관리자로 지정된 이메일은 자동 승인 ───────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, approved)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── 회원 목록 (관리자 이상) ─────────────────────────────────────
--   가입한 회원 + 아직 가입 전인 관리자 지정 이메일까지 함께 보여줍니다.
create or replace function public.admin_list_users()
returns table (
  user_id          uuid,
  email            text,
  name             text,
  approved         boolean,
  role             text,      -- super / admin / null(일반 회원)
  joined_at        timestamptz,
  last_sign_in_at  timestamptz,
  email_confirmed  boolean,
  chapters_read    int
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, coalesce(p.name, ''), coalesce(p.approved, false), a.role,
         u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
         (select count(*)::int from public.bible_reads r where r.user_id = u.id)
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.admin_emails a on lower(a.email) = lower(u.email)
  where public.is_church_admin()
  union all
  select null, a.email, '', false, a.role, null, null, false, 0
  from public.admin_emails a
  where public.is_church_admin()
    and not exists (select 1 from auth.users u where lower(u.email) = lower(a.email))
  order by 6 desc nulls last;
$$;
revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- ── 관리자 임명 / 해제 (최고 관리자만) ───────────────────────────
--   new_role: 'admin' = 관리자로 임명, null = 일반 회원으로 (관리자 해제)
create or replace function public.admin_set_role(target_email text, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  em text := lower(trim(target_email));
begin
  if not public.is_super_admin() then
    raise exception '최고 관리자만 관리자를 임명하거나 해제할 수 있습니다.';
  end if;
  if em is null or em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception '이메일 형식이 올바르지 않습니다.';
  end if;
  if exists (select 1 from public.admin_emails a where lower(a.email) = em and a.role = 'super') then
    raise exception '최고 관리자의 권한은 화면에서 바꿀 수 없습니다.';
  end if;

  if new_role = 'admin' then
    insert into public.admin_emails (email, role, appointed_by)
    values (em, 'admin', auth.jwt() ->> 'email')
    on conflict (email) do update set role = 'admin', appointed_by = excluded.appointed_by;
    -- 이미 가입한 회원이면 승인도 함께
    update public.profiles set approved = true where lower(email) = em;
  elsif new_role is null then
    delete from public.admin_emails where lower(email) = em;
  else
    raise exception '알 수 없는 권한입니다: %', new_role;
  end if;
end;
$$;
revoke execute on function public.admin_set_role(text, text) from public, anon;
grant execute on function public.admin_set_role(text, text) to authenticated;

-- ── 내 정보: 본인 이름 변경 (승인 여부 등 다른 칸은 못 바꿈) ─────
create or replace function public.update_my_name(new_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  n text := trim(coalesce(new_name, ''));
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if n = '' or length(n) > 30 then raise exception '이름은 1~30자로 적어주세요.'; end if;
  update public.profiles set name = n where id = auth.uid();
end;
$$;
revoke execute on function public.update_my_name(text) from public, anon;
grant execute on function public.update_my_name(text) to authenticated;

-- ── 회원 계정 삭제 (최고 관리자만) ───────────────────────────────
--   로그인 계정과 회원 정보, 성경읽기 기록이 함께 지워집니다. (교적부 자료는 별개라 남습니다)
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  em text;
begin
  if not public.is_super_admin() then
    raise exception '최고 관리자만 회원 계정을 삭제할 수 있습니다.';
  end if;
  if target = auth.uid() then
    raise exception '본인 계정은 삭제할 수 없습니다.';
  end if;
  select lower(email) into em from auth.users where id = target;
  if em is null then
    raise exception '회원을 찾을 수 없습니다.';
  end if;
  if exists (select 1 from public.admin_emails a where lower(a.email) = em and a.role = 'super') then
    raise exception '최고 관리자 계정은 삭제할 수 없습니다.';
  end if;
  delete from public.admin_emails where lower(email) = em;
  delete from auth.users where id = target;
end;
$$;
revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;
