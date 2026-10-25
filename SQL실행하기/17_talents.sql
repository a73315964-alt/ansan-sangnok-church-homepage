-- ============================================================
-- 안산상록교회 — 달란트 (성경읽기·새벽묵상·나눔 글)
-- 03, 08, 11 을 먼저 실행한 뒤, Supabase SQL Editor 에서 실행하세요. 여러 번 실행해도 안전합니다.
--
-- 규칙 (하루, 한국시간 기준)
--   · 성경을 1장 이상 읽음(체크)        → 1달란트
--   · 새벽 묵상을 읽음("읽었어요" 버튼)  → 1달란트
--   · 나눔방에 글을 남김                → 1달란트
--   하루 최대 3달란트. 달란트는 새 표를 만들지 않고 기존 기록(bible_reads, devotion_shares)과
--   아래 devotion_reads 로 그날그날 계산합니다. (파란 달란트 5개 = 노란 달란트 1개)
-- ============================================================

-- 새벽 묵상 읽음 기록 (하루 한 번)
create table if not exists public.devotion_reads (
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  read_date  date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, read_date)
);
alter table public.devotion_reads enable row level security;

drop policy if exists "devotion_reads_select" on public.devotion_reads;
create policy "devotion_reads_select" on public.devotion_reads for select to authenticated
  using (user_id = auth.uid() or public.is_church_admin());

revoke all on public.devotion_reads from anon;
revoke insert, update, delete on public.devotion_reads from authenticated;
grant select on public.devotion_reads to authenticated;

-- "오늘 묵상 읽었어요" — 정회원만, 날짜는 서버(한국시간 오늘)가 정함
create or replace function public.record_devotion_read()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_approved_member() then
    raise exception 'NOT_APPROVED';
  end if;
  insert into public.devotion_reads (user_id, read_date)
  values (auth.uid(), (now() at time zone 'Asia/Seoul')::date)
  on conflict do nothing;
end;
$$;
revoke execute on function public.record_devotion_read() from public, anon;
grant execute on function public.record_devotion_read() to authenticated;

-- 내 달란트 (한 달, 날짜별) — p_month 는 그 달의 아무 날짜
create or replace function public.my_talents(p_month date)
returns table (day date, bible boolean, devo boolean, share boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with b as (
    select distinct (read_at at time zone 'Asia/Seoul')::date as d
    from public.bible_reads where user_id = auth.uid()
  ), r as (
    select read_date as d from public.devotion_reads where user_id = auth.uid()
  ), s as (
    select distinct (created_at at time zone 'Asia/Seoul')::date as d
    from public.devotion_shares where user_id = auth.uid()
  ), days as (
    select d from b union select d from r union select d from s
  )
  select days.d,
         exists (select 1 from b where b.d = days.d),
         exists (select 1 from r where r.d = days.d),
         exists (select 1 from s where s.d = days.d)
  from days
  where auth.uid() is not null
    and days.d >= date_trunc('month', p_month)::date
    and days.d <  (date_trunc('month', p_month) + interval '1 month')::date
  order by days.d;
$$;
revoke execute on function public.my_talents(date) from public, anon;
grant execute on function public.my_talents(date) to authenticated;

-- 관리자용 월간 통계 (성도별 합계) — 관리자가 아니면 빈 결과
create or replace function public.admin_talent_summary(p_month date)
returns table (user_id uuid, name text, bible_days int, devo_days int, share_days int, total int)
language sql
stable
security definer
set search_path = ''
as $$
  with m as (
    select date_trunc('month', p_month)::date as a, (date_trunc('month', p_month) + interval '1 month')::date as z
  ), b as (
    select br.user_id, (br.read_at at time zone 'Asia/Seoul')::date as d from public.bible_reads br, m
    where (br.read_at at time zone 'Asia/Seoul')::date >= m.a and (br.read_at at time zone 'Asia/Seoul')::date < m.z
    group by 1, 2
  ), r as (
    select dr.user_id, dr.read_date as d from public.devotion_reads dr, m
    where dr.read_date >= m.a and dr.read_date < m.z
  ), s as (
    select ds.user_id, (ds.created_at at time zone 'Asia/Seoul')::date as d from public.devotion_shares ds, m
    where (ds.created_at at time zone 'Asia/Seoul')::date >= m.a and (ds.created_at at time zone 'Asia/Seoul')::date < m.z
    group by 1, 2
  ), agg as (
    select p.id, p.name,
           (select count(*) from b where b.user_id = p.id)::int as bd,
           (select count(*) from r where r.user_id = p.id)::int as rd,
           (select count(*) from s where s.user_id = p.id)::int as sd
    from public.profiles p
    where p.approved
  )
  select id, name, bd, rd, sd, bd + rd + sd
  from agg
  where public.is_church_admin()
  order by bd + rd + sd desc, name;
$$;
revoke execute on function public.admin_talent_summary(date) from public, anon;
grant execute on function public.admin_talent_summary(date) to authenticated;

notify pgrst, 'reload schema';
