-- ============================================================
-- 안산상록교회 — 바른 신앙의 길잡이 각 과 아래 "은혜 한마디"
-- 03, 05, 08 을 먼저 실행한 뒤, Supabase SQL Editor 에서 이 파일을 실행하세요.
--
-- 만드는 것
--   faith_shares : 과(lesson_no)별로 남기는 짧은 은혜 한마디
-- 권한
--   읽기·쓰기 : 정회원(승인 + 정지 아님)만
--   삭제      : 본인 글 또는 관리자
--   작성자 이름은 profiles 의 이름으로 자동 기록 (다른 이름으로 쓸 수 없음)
-- ============================================================

create table if not exists public.faith_shares (
  id            bigint generated always as identity primary key,
  lesson_no     integer not null check (lesson_no > 0),
  user_id       uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  author_name   text not null default '',
  content       text not null check (char_length(btrim(content)) between 1 and 500),
  created_at    timestamptz not null default now()
);
create index if not exists faith_shares_lesson_idx
  on public.faith_shares (lesson_no, created_at desc);
alter table public.faith_shares enable row level security;

-- 작성자 이름·작성 시각은 서버에서 채움
create or replace function public.faith_shares_fill()
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

drop trigger if exists faith_shares_fill on public.faith_shares;
create trigger faith_shares_fill
  before insert on public.faith_shares
  for each row execute function public.faith_shares_fill();

drop policy if exists "faith_shares_select" on public.faith_shares;
create policy "faith_shares_select" on public.faith_shares for select to authenticated
  using (public.is_approved_member() or public.is_church_admin());

drop policy if exists "faith_shares_insert" on public.faith_shares;
create policy "faith_shares_insert" on public.faith_shares for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved_member());

drop policy if exists "faith_shares_delete" on public.faith_shares;
create policy "faith_shares_delete" on public.faith_shares for delete to authenticated
  using (user_id = auth.uid() or public.is_church_admin());

revoke all on public.faith_shares from anon;
revoke update on public.faith_shares from authenticated;
grant select, insert, delete on public.faith_shares to authenticated;
