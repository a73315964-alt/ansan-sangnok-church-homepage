-- ============================================================
-- 안산상록교회 — 생년월일 로그인 (일반 회원)
-- 08 을 실행한 뒤 실행하세요. 여러 번 실행해도 안전합니다.
--
--  · 일반 회원은 생년월일만 입력해 로그인합니다.
--    (내부적으로는 생년월일에서 만든 비밀번호로 Supabase 로그인 — js/auth.js 의 birthPassword 와 같은 규칙)
--  · 관리자(admin_emails)는 지금처럼 이메일 + 본인 비밀번호로 로그인합니다. 관리자 비밀번호는 건드리지 않습니다.
--  · 같은 생년월일의 회원이 두 명 이상이면 생년월일 로그인이 되지 않습니다 (교회 사무실 문의).
-- ============================================================

-- 생년월일 → 로그인 비밀번호 (js/auth.js 의 birthPassword 와 반드시 같아야 함)
create or replace function public.birth_login_password(p_birth date)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'sangnok:' || to_char(p_birth, 'YYYY-MM-DD');
$$;
revoke execute on function public.birth_login_password(date) from public, anon, authenticated;

-- 관리자 계정인지
create or replace function public.is_admin_user(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u join public.admin_emails a on lower(a.email) = lower(u.email)
    where u.id = target
  );
$$;
revoke execute on function public.is_admin_user(uuid) from public, anon, authenticated;

-- 생년월일 → 로그인할 계정의 이메일 (관리자 제외, 딱 한 명일 때만)
create or replace function public.birth_login_email(p_birth date)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when count(*) = 1 then min(u.email)::text end
  from public.profiles p
  join auth.users u on u.id = p.id
  where p_birth is not null
    and p.birth_date = p_birth
    and not public.is_admin_user(u.id);
$$;
revoke execute on function public.birth_login_email(date) from public;
grant execute on function public.birth_login_email(date) to anon, authenticated;

-- 회원의 비밀번호를 생년월일 규칙으로 맞춤 (관리자는 제외)
create or replace function public.sync_birth_password()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.birth_date is not null and not public.is_admin_user(new.id) then
    update auth.users
    set encrypted_password = extensions.crypt(public.birth_login_password(new.birth_date), extensions.gen_salt('bf'))
    where id = new.id;
  end if;
  return new;
end;
$$;

-- 내 정보에서 생년월일을 고치면(verify_me) 비밀번호도 따라 바뀜
drop trigger if exists trg_profiles_birth_password on public.profiles;
create trigger trg_profiles_birth_password
  after update of birth_date on public.profiles
  for each row
  when (new.birth_date is distinct from old.birth_date)
  execute function public.sync_birth_password();

-- ── 기존 회원 정리 ──────────────────────────────────────────────
-- 1) 가입 때 생년월일을 안 적었지만 교적과 연결된 회원 → 교적의 생년월일을 채움
update public.profiles p
set birth_date = m.birth_date
from public.members m
where p.member_id = m.id
  and p.birth_date is null
  and m.birth_date is not null;

-- 2) 기존 일반 회원의 비밀번호를 생년월일 규칙으로 맞춤 (관리자 제외)
update auth.users u
set encrypted_password = extensions.crypt(public.birth_login_password(p.birth_date), extensions.gen_salt('bf'))
from public.profiles p
where p.id = u.id
  and p.birth_date is not null
  and not public.is_admin_user(u.id);

-- 확인: 생년월일이 없어 생년월일 로그인을 못 하는 회원 / 생년월일이 겹치는 회원
--   select p.name, u.email from public.profiles p join auth.users u on u.id = p.id
--   where p.birth_date is null and not public.is_admin_user(u.id);
--   select birth_date, count(*) from public.profiles group by birth_date having count(*) > 1;
