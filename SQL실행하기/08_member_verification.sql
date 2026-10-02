-- ============================================================
-- 안산상록교회 — 정회원 인증 (교적 대조) + 홈페이지 회원 승인·정지·삭제
-- 05, 06 을 실행한 뒤 실행하세요. 여러 번 실행해도 안전합니다.
--
--  · 가입할 때 적은 성명 + 생년월일이 교적부(members)의 한 사람과 일치하면 자동으로 정회원 승인 + 교적 연결
--  · 교적에 없으면 승인 대기 → 최고 관리자가 "홈페이지 회원관리"에서 정회원 등록 (교적 연결은 선택)
--  · 정지: 로그인 자체가 막힙니다 (auth.users.banned_until)
--  · 승인·정지·삭제·정회원 등록은 최고 관리자만
-- ============================================================

alter table public.profiles add column if not exists birth_date    date;
alter table public.profiles add column if not exists member_id     uuid references public.members(id) on delete set null;
alter table public.profiles add column if not exists suspended     boolean not null default false;
alter table public.profiles add column if not exists verify_method text;        -- auto(교적 대조) / admin(관리자 등록)
alter table public.profiles add column if not exists verified_at   timestamptz;
alter table public.profiles drop constraint if exists profiles_verify_method_chk;
alter table public.profiles add constraint profiles_verify_method_chk check (verify_method is null or verify_method in ('auto', 'admin'));
create unique index if not exists profiles_member_id_uniq on public.profiles (member_id) where member_id is not null;

-- 정회원 = 승인되었고 정지되지 않은 회원
create or replace function public.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.approved and not p.suspended);
$$;

-- 성명 + 생년월일로 교적에서 "딱 한 사람"을 찾음 (이미 다른 계정과 연결된 교인은 제외)
create or replace function public.find_member_match(p_name text, p_birth date)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case when count(*) = 1 then min(m.id::text)::uuid end
  from public.members m
  where p_birth is not null
    and m.birth_date = p_birth
    and regexp_replace(m.name, '\s', '', 'g') = regexp_replace(coalesce(p_name, ''), '\s', '', 'g')
    and not exists (select 1 from public.profiles p where p.member_id = m.id);
$$;
revoke execute on function public.find_member_match(text, date) from public, anon, authenticated;

-- 회원가입: 관리자 지정 이메일 → 승인 / 교적과 일치 → 정회원 자동 인증 / 그 외 → 승인 대기
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name  text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1));
  v_birth date;
  v_match uuid;
  v_admin boolean := exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email));
begin
  begin
    v_birth := nullif(new.raw_user_meta_data ->> 'birth_date', '')::date;
  exception when others then
    v_birth := null;
  end;
  v_match := public.find_member_match(v_name, v_birth);

  insert into public.profiles (id, email, name, birth_date, member_id, approved, verify_method, verified_at)
  values (
    new.id, new.email, v_name, v_birth, v_match,
    v_admin or v_match is not null,
    case when v_match is not null then 'auto' when v_admin then 'admin' end,
    case when v_admin or v_match is not null then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 내 정보에서 다시 대조 (가입 때 오타가 있었을 때)
create or replace function public.verify_me(p_name text, p_birth date)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match uuid;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and suspended) then
    raise exception '정지된 계정입니다.';
  end if;
  v_match := public.find_member_match(p_name, p_birth);
  update public.profiles
  set birth_date = p_birth,
      member_id = coalesce(v_match, member_id),
      approved = approved or v_match is not null,
      verify_method = case when v_match is not null then 'auto' else verify_method end,
      verified_at = case when v_match is not null then now() else verified_at end
  where id = auth.uid();
  return v_match is not null;
end;
$$;
revoke execute on function public.verify_me(text, date) from public, anon;
grant execute on function public.verify_me(text, date) to authenticated;

-- 승인·정회원 등록·이름 변경은 이제 함수로만 (최고 관리자)
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles for delete to authenticated
  using (public.is_super_admin());

-- ── 정회원 등록 / 승인 취소 (최고 관리자) ─────────────────────────
--   link_member: 교적 카드와 연결 (없으면 null — 교적에 없는 사람도 정회원 등록 가능)
create or replace function public.admin_set_approved(target uuid, approve boolean, link_member uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception '최고 관리자만 정회원 등록·승인 취소를 할 수 있습니다.';
  end if;
  if link_member is not null and exists (select 1 from public.profiles where member_id = link_member and id <> target) then
    raise exception '그 교적 카드는 이미 다른 계정과 연결되어 있습니다.';
  end if;
  if approve then
    update public.profiles
    set approved = true,
        member_id = coalesce(link_member, member_id),
        verify_method = coalesce(verify_method, 'admin'),
        verified_at = coalesce(verified_at, now())
    where id = target;
  else
    if exists (select 1 from auth.users u join public.admin_emails a on lower(a.email) = lower(u.email) where u.id = target) then
      raise exception '관리자의 승인은 취소할 수 없습니다. 먼저 관리자에서 해제하세요.';
    end if;
    update public.profiles set approved = false, verify_method = null, verified_at = null where id = target;
  end if;
end;
$$;
revoke execute on function public.admin_set_approved(uuid, boolean, uuid) from public, anon;
grant execute on function public.admin_set_approved(uuid, boolean, uuid) to authenticated;

-- 교적 연결만 바꾸기 / 끊기 (최고 관리자)
create or replace function public.admin_link_member(target uuid, link_member uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then raise exception '최고 관리자만 할 수 있습니다.'; end if;
  if link_member is not null and exists (select 1 from public.profiles where member_id = link_member and id <> target) then
    raise exception '그 교적 카드는 이미 다른 계정과 연결되어 있습니다.';
  end if;
  update public.profiles set member_id = link_member where id = target;
end;
$$;
revoke execute on function public.admin_link_member(uuid, uuid) from public, anon;
grant execute on function public.admin_link_member(uuid, uuid) to authenticated;

-- ── 정지 / 정지 해제 (최고 관리자) — 정지하면 로그인이 막힙니다 ──────
create or replace function public.admin_set_suspended(target uuid, suspend boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  em text;
begin
  if not public.is_super_admin() then raise exception '최고 관리자만 회원을 정지할 수 있습니다.'; end if;
  if target = auth.uid() then raise exception '본인 계정은 정지할 수 없습니다.'; end if;
  select lower(email) into em from auth.users where id = target;
  if em is null then raise exception '회원을 찾을 수 없습니다.'; end if;
  if exists (select 1 from public.admin_emails a where lower(a.email) = em and a.role = 'super') then
    raise exception '최고 관리자 계정은 정지할 수 없습니다.';
  end if;
  update public.profiles set suspended = suspend where id = target;
  update auth.users set banned_until = case when suspend then 'infinity'::timestamptz else null end where id = target;
  if suspend then
    delete from auth.refresh_tokens where user_id = target::text;  -- 이미 로그인된 기기도 곧 로그아웃
  end if;
end;
$$;
revoke execute on function public.admin_set_suspended(uuid, boolean) from public, anon;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;

-- ── 회원 목록 (관리자 이상) — 인증 방식·정지·교적 연결 포함 ───────────
drop function if exists public.admin_list_users();
create function public.admin_list_users()
returns table (
  user_id          uuid,
  email            text,
  name             text,
  birth_date       date,
  approved         boolean,
  suspended        boolean,
  verify_method    text,
  member_id        uuid,
  member_name      text,
  member_birth     date,
  member_position  text,
  role             text,
  joined_at        timestamptz,
  last_sign_in_at  timestamptz,
  chapters_read    int
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, coalesce(p.name, ''), p.birth_date, coalesce(p.approved, false), coalesce(p.suspended, false),
         p.verify_method, p.member_id, m.name, m.birth_date, m.position, a.role,
         u.created_at, u.last_sign_in_at,
         (select count(*)::int from public.bible_reads r where r.user_id = u.id)
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.members m on m.id = p.member_id
  left join public.admin_emails a on lower(a.email) = lower(u.email)
  where public.is_church_admin()
  union all
  select null, a.email, '', null, false, false, null, null, null, null, null, a.role, null, null, 0
  from public.admin_emails a
  where public.is_church_admin()
    and not exists (select 1 from auth.users u where lower(u.email) = lower(a.email))
  order by 13 desc nulls last;
$$;
revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- 나의 대시보드: 연결된 교적 카드(member_id)도 본인 카드로 보기
drop policy if exists "members_select_own" on public.members;
create policy "members_select_own" on public.members for select to authenticated
  using (
    public.is_approved_member() and (
      id = (select p.member_id from public.profiles p where p.id = auth.uid())
      or (email is not null and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );
