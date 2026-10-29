-- ============================================================
-- 안산상록교회 — 오늘의 말씀 나눔방 하트(♥)
-- 11_devotion_shares.sql 을 먼저 실행한 뒤 이 파일을 실행하세요.
--   devotion_share_hearts : 나눔 글에 다른 성도가 남기는 하트 (한 글에 한 사람 1개)
-- 권한: 정회원만 보기·누르기 / 내가 쓴 글에는 누를 수 없음 / 취소는 본인만
-- ============================================================

create table if not exists public.devotion_share_hearts (
  share_id   bigint not null references public.devotion_shares(id) on delete cascade,
  user_id    uuid   not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (share_id, user_id)
);
alter table public.devotion_share_hearts enable row level security;

drop policy if exists "dsh_select" on public.devotion_share_hearts;
create policy "dsh_select" on public.devotion_share_hearts for select to authenticated
  using (public.is_approved_member() or public.is_church_admin());

drop policy if exists "dsh_insert" on public.devotion_share_hearts;
create policy "dsh_insert" on public.devotion_share_hearts for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_approved_member()
    and not exists (select 1 from public.devotion_shares s where s.id = share_id and s.user_id = auth.uid())
  );

drop policy if exists "dsh_delete" on public.devotion_share_hearts;
create policy "dsh_delete" on public.devotion_share_hearts for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.devotion_share_hearts from anon;
revoke update on public.devotion_share_hearts from authenticated;
grant select, insert, delete on public.devotion_share_hearts to authenticated;

notify pgrst, 'reload schema';
