-- ============================================================
-- 안산상록교회 — 1년 성경읽기 (성도 회원 + 읽기 기록 + 목사님 관리)
-- 01, 02 를 먼저 실행한 뒤, Supabase SQL Editor 에서 이 파일을 실행하세요.
-- (02 의 is_church_admin() — admin_emails 에 등록된 계정 = 목사님/관리자 — 을 사용합니다)
--
-- 만드는 것
--   profiles        : 성도 회원 정보 (회원가입하면 자동 생성, 목사님 승인 후 기록 가능)
--   bible_reads     : 성도별 "읽은 장" 기록 (권 1~66, 장)
--   reading_settings: 1년 읽기 시작일 (목사님이 관리자 화면에서 변경)
--   admin_reading_summary(): 목사님 화면용 — 성도별 진도 요약
-- ============================================================

-- 1) 성도 회원 정보 -------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text not null default '',
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 회원가입 시 profiles 자동 생성 (가입 화면에서 입력한 이름 사용)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이미 있는 계정(목사님·교역자)은 승인된 회원으로 등록
insert into public.profiles (id, email, name, approved)
select u.id, u.email, coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1)), true
from auth.users u
on conflict (id) do nothing;

-- 승인된 성도인지 확인
create or replace function public.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.approved);
$$;
revoke execute on function public.is_approved_member() from public, anon;
grant execute on function public.is_approved_member() to authenticated;

-- 본인 것 또는 관리자만 조회 / 승인·이름 변경·삭제는 관리자만
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_church_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update to authenticated
  using (public.is_church_admin()) with check (public.is_church_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles for delete to authenticated
  using (public.is_church_admin());

-- 본인이 approved 를 스스로 바꾸지 못하도록, 일반 회원에게는 컬럼 수정 권한 자체를 주지 않음
revoke insert, update on public.profiles from anon, authenticated;
grant update (name, approved) on public.profiles to authenticated;

-- 2) 읽기 기록 -----------------------------------------------------
create table if not exists public.bible_reads (
  user_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  book     smallint not null check (book between 1 and 66),
  chapter  smallint not null check (chapter between 1 and 150),
  read_at  timestamptz not null default now(),
  primary key (user_id, book, chapter)
);
create index if not exists bible_reads_user_read_at_idx on public.bible_reads (user_id, read_at desc);
alter table public.bible_reads enable row level security;

drop policy if exists "bible_reads_select" on public.bible_reads;
create policy "bible_reads_select" on public.bible_reads for select to authenticated
  using (user_id = auth.uid() or public.is_church_admin());

-- 체크는 "승인된 본인"만
drop policy if exists "bible_reads_insert_own" on public.bible_reads;
create policy "bible_reads_insert_own" on public.bible_reads for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved_member());

drop policy if exists "bible_reads_delete_own" on public.bible_reads;
create policy "bible_reads_delete_own" on public.bible_reads for delete to authenticated
  using (user_id = auth.uid() and public.is_approved_member());

revoke all on public.bible_reads from anon;
revoke update on public.bible_reads from authenticated;

-- 3) 읽기 시작일 설정 (한 줄짜리 표) --------------------------------
create table if not exists public.reading_settings (
  id         int primary key default 1 check (id = 1),
  start_date date not null default date '2027-01-01',
  updated_at timestamptz not null default now()
);
insert into public.reading_settings (id) values (1) on conflict (id) do nothing;
alter table public.reading_settings enable row level security;

drop policy if exists "reading_settings_select" on public.reading_settings;
create policy "reading_settings_select" on public.reading_settings for select to authenticated
  using (true);

drop policy if exists "reading_settings_update_admin" on public.reading_settings;
create policy "reading_settings_update_admin" on public.reading_settings for update to authenticated
  using (public.is_church_admin()) with check (public.is_church_admin());

revoke all on public.reading_settings from anon;
revoke insert, delete on public.reading_settings from authenticated;

-- 4) 목사님 화면용 요약 (성도별 진도 + 권별 읽은 장 수) ----------------
--    관리자가 아니면 빈 결과를 돌려줍니다.
create or replace function public.admin_reading_summary()
returns table (
  user_id       uuid,
  name          text,
  email         text,
  approved      boolean,
  joined_at     timestamptz,
  chapters_read int,
  last_read_at  timestamptz,
  book_counts   int[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id, p.name, p.email, p.approved, p.created_at,
    count(r.user_id)::int,
    max(r.read_at),
    (
      select array_agg(coalesce(c.n, 0) order by g.b)
      from generate_series(1, 66) as g(b)
      left join (
        select r2.book, count(*)::int as n
        from public.bible_reads r2
        where r2.user_id = p.id
        group by r2.book
      ) c on c.book = g.b
    )
  from public.profiles p
  left join public.bible_reads r on r.user_id = p.id
  where public.is_church_admin()
  group by p.id
  order by p.approved, p.name;
$$;
revoke execute on function public.admin_reading_summary() from public, anon;
grant execute on function public.admin_reading_summary() to authenticated;

-- 관리자 여부를 화면에서 확인할 수 있게 (02 에서 이미 authenticated 에 허용됨)
-- select public.is_church_admin();
