-- ============================================================
-- 안산상록교회 — 청년부 나눔방은 청년부 소속 성도만 (읽기·쓰기)
-- 11, 18 을 먼저 실행한 뒤 이 파일을 실행하세요. 여러 번 실행해도 안전합니다.
--
-- "청년부 소속" = 교적부(관리자 화면 → 교적부) 에서 그 성도의 봉사기관에 "청년부" 가 체크되어 있고,
--                 홈페이지 회원 계정이 그 교적 카드와 연결되어 있는 경우
-- 관리자는 모두 볼 수 있습니다. 장년부 나눔방은 지금처럼 정회원 모두 볼 수 있습니다.
-- ============================================================

create or replace function public.is_youth_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_approved_member() and exists (
    select 1
    from public.profiles p
    join public.members m on m.id = p.member_id
    where p.id = auth.uid()
      and m.service_orgs @> array['청년부']::text[]
  );
$$;
revoke execute on function public.is_youth_member() from public, anon;
grant execute on function public.is_youth_member() to authenticated;

-- 읽기: 장년부 = 정회원 / 청년부 = 청년부 소속 (또는 관리자)
drop policy if exists "devotion_shares_select" on public.devotion_shares;
create policy "devotion_shares_select" on public.devotion_shares for select to authenticated
  using (
    public.is_church_admin()
    or (room = 'adult' and public.is_approved_member())
    or (room = 'youth' and public.is_youth_member())
  );

-- 쓰기
drop policy if exists "devotion_shares_insert" on public.devotion_shares;
create policy "devotion_shares_insert" on public.devotion_shares for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      (room = 'adult' and public.is_approved_member())
      or (room = 'youth' and (public.is_youth_member() or (public.is_church_admin() and public.is_approved_member())))
    )
  );

-- 하트: 볼 수 있는 글에만 (devotion_shares 의 읽기 권한을 그대로 따름)
drop policy if exists "dsh_select" on public.devotion_share_hearts;
create policy "dsh_select" on public.devotion_share_hearts for select to authenticated
  using (exists (select 1 from public.devotion_shares s where s.id = share_id));

drop policy if exists "dsh_insert" on public.devotion_share_hearts;
create policy "dsh_insert" on public.devotion_share_hearts for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.devotion_shares s where s.id = share_id)
    and not exists (select 1 from public.devotion_shares s where s.id = share_id and s.user_id = auth.uid())
  );

notify pgrst, 'reload schema';
