-- ============================================================
-- 안산상록교회 — 새벽기도 말씀 묵상 나눔방 (장년부 / 청년부)
-- 03, 05, 08 을 먼저 실행한 뒤, Supabase SQL Editor 에서 이 파일을 실행하세요.
--
-- 만드는 것
--   devotion_shares : 날짜별 묵상에 남기는 짧은 은혜 나눔
--     room = 'adult' (장년부 나눔방) / 'youth' (청년부 나눔방)
-- 권한
--   읽기·쓰기 : 정회원(승인 + 정지 아님)만
--   삭제      : 본인 글 또는 관리자
--   작성자 이름은 profiles 의 이름으로 자동 기록 (다른 이름으로 쓸 수 없음)
-- ============================================================

create table if not exists public.devotion_shares (
  id            bigint generated always as identity primary key,
  devotion_date date not null,
  room          text not null check (room in ('adult', 'youth')),
  user_id       uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  author_name   text not null default '',
  content       text not null check (char_length(btrim(content)) between 1 and 500),
  created_at    timestamptz not null default now()
);
create index if not exists devotion_shares_day_room_idx
  on public.devotion_shares (devotion_date, room, created_at desc);
alter table public.devotion_shares enable row level security;

-- 작성자 이름·작성 시각은 서버에서 채움
create or replace function public.devotion_shares_fill()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := auth.uid();
  new.author_name := coalesce((select p.name from public.profiles p where p.id = auth.uid()), '');
  new.content := btrim(new.content);
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists devotion_shares_fill on public.devotion_shares;
create trigger devotion_shares_fill
  before insert on public.devotion_shares
  for each row execute function public.devotion_shares_fill();

drop policy if exists "devotion_shares_select" on public.devotion_shares;
create policy "devotion_shares_select" on public.devotion_shares for select to authenticated
  using (public.is_approved_member() or public.is_church_admin());

drop policy if exists "devotion_shares_insert" on public.devotion_shares;
create policy "devotion_shares_insert" on public.devotion_shares for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved_member());

drop policy if exists "devotion_shares_delete" on public.devotion_shares;
create policy "devotion_shares_delete" on public.devotion_shares for delete to authenticated
  using (user_id = auth.uid() or public.is_church_admin());

revoke all on public.devotion_shares from anon;
revoke update on public.devotion_shares from authenticated;
grant select, insert, delete on public.devotion_shares to authenticated;
