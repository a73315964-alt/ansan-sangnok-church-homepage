-- ============================================================
-- 안산상록교회 — 교적(성도) 테이블 + 접근 권한(RLS)
-- Supabase 대시보드 → SQL Editor 에서 이 파일 내용을 그대로 실행하세요.
-- 개인정보가 들어있지 않은 "구조" 파일이라 안전하게 실행/보관할 수 있습니다.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  position     text,        -- 직분 (목사/장로/권사/집사/성도 등)
  home_phone   text,        -- 자택 전화
  mobile_phone text,        -- 휴대폰
  family       text,        -- 가족 이름
  birth        text,        -- 생년월일 (원본 표기 그대로 문자열로 보관)
  note         text,        -- 기타
  group_label  text,        -- 그룹/부서 (관리자 화면에서 자유롭게 수정)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 이름으로 빠르게 찾기 위한 인덱스
create index if not exists members_name_idx on public.members using gin (to_tsvector('simple', coalesce(name,'')));

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_members_updated_at on public.members;
create trigger trg_members_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

-- ── 접근 권한 (RLS) ────────────────────────────────────────────
-- 절대 공개 열람이 되지 않도록, 반드시 아래 RLS 를 함께 실행하세요.
-- "로그인한 사람만" 읽고 쓸 수 있습니다. 로그인 계정은 Supabase 대시보드
-- → Authentication → Users 에서 목사님/교역자용으로 직접 만들어 주세요.
-- (일반 방문자가 회원가입해서 들어오는 구조가 아닙니다.)

alter table public.members enable row level security;

drop policy if exists "members_select_authenticated" on public.members;
create policy "members_select_authenticated"
  on public.members for select
  to authenticated
  using (true);

drop policy if exists "members_insert_authenticated" on public.members;
create policy "members_insert_authenticated"
  on public.members for insert
  to authenticated
  with check (true);

drop policy if exists "members_update_authenticated" on public.members;
create policy "members_update_authenticated"
  on public.members for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "members_delete_authenticated" on public.members;
create policy "members_delete_authenticated"
  on public.members for delete
  to authenticated
  using (true);
