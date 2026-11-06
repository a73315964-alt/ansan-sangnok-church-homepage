-- ============================================================
-- 안산상록교회 — 오늘의 말씀 은혜 나눔 글을 본인이 수정할 수 있게
-- 11, 18, 19 를 먼저 실행한 뒤 Supabase SQL Editor 에서 이 파일을 실행하세요. 여러 번 실행해도 안전합니다.
--   · 수정은 "내가 쓴 글의 내용" 한 가지만 가능 (날짜·방·작성자·작성 시각은 바꿀 수 없음)
--   · 청년부 나눔방 글은 청년부 소속일 때만 수정 가능
-- ============================================================

alter table public.devotion_shares add column if not exists edited_at timestamptz;

create or replace function public.devotion_shares_touch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.content := btrim(new.content);
  if new.content is distinct from old.content then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists devotion_shares_touch on public.devotion_shares;
create trigger devotion_shares_touch
  before update on public.devotion_shares
  for each row execute function public.devotion_shares_touch();

drop policy if exists "devotion_shares_update" on public.devotion_shares;
create policy "devotion_shares_update" on public.devotion_shares for update to authenticated
  using (
    user_id = auth.uid()
    and (
      (room = 'adult' and public.is_approved_member())
      or (room = 'youth' and (public.is_youth_member() or (public.is_church_admin() and public.is_approved_member())))
    )
  )
  with check (user_id = auth.uid());

-- 고칠 수 있는 칸은 content 하나뿐
revoke update on public.devotion_shares from authenticated;
grant update (content) on public.devotion_shares to authenticated;

notify pgrst, 'reload schema';
