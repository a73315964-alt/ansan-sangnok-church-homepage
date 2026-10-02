-- ============================================================
-- 안산상록교회 — 교적부 확장 ("교인기록카드" 항목 그대로)
-- 01, 02 를 실행한 뒤 Supabase SQL Editor 에서 이 파일을 실행하세요.
-- 기존 성도 자료는 그대로 두고 칸만 추가합니다. 여러 번 실행해도 안전합니다.
-- 접근 권한은 02 의 RLS 그대로 — admin_emails 에 등록된 관리자만 보고 고칠 수 있습니다.
-- ============================================================

alter table public.members
  -- 카드 윗부분
  add column if not exists card_no        text,          -- 번호
  add column if not exists written_at     date,          -- 작성일
  add column if not exists district       text,          -- 교구   (group_label = 구역(속))
  add column if not exists photo_path     text,          -- 사진 (Storage member-photos 안의 경로)
  -- 본인
  add column if not exists name_hanja     text,          -- 이름 (한문)
  add column if not exists gender         text,          -- 남 / 여
  add column if not exists birth_date     date,          -- 생년월일
  add column if not exists birth_calendar text not null default '양',  -- 양 / 음
  add column if not exists housing        text,          -- 주거환경
  add column if not exists faith_level    text,          -- 신급 (원입·학습·세례·유아세례·입교)
  add column if not exists service_orgs   text[] not null default '{}',  -- 봉사기관 (여러 개)
  add column if not exists email          text,
  add column if not exists address        text,
  add column if not exists awards         text,          -- 수상경력
  add column if not exists hobby          text,          -- 취미
  add column if not exists education      text,          -- 학력
  add column if not exists guide          text,          -- 인도자
  add column if not exists workplace      text,          -- 직장
  add column if not exists job_title      text,          -- 직위
  add column if not exists work_phone     text,          -- 직장 전화
  add column if not exists baptism_date   date,          -- 세례일
  add column if not exists registered_at  date,          -- 교회 등록일
  -- 가족사항 (카드 아래 표) — 한 줄에 한 사람:
  --   { name, relation, gender, birth_date, birth_calendar, faith_level, position, job, education, religion, note, member_id }
  --   member_id 는 그 가족이 우리 교회 교인일 때 연결 (선택)
  add column if not exists family_members jsonb not null default '[]'::jsonb;

-- 허용 값 (화면의 선택 목록과 같습니다)
alter table public.members drop constraint if exists members_gender_chk;
alter table public.members add constraint members_gender_chk
  check (gender is null or gender in ('남', '여'));

alter table public.members drop constraint if exists members_birth_calendar_chk;
alter table public.members add constraint members_birth_calendar_chk
  check (birth_calendar in ('양', '음'));

alter table public.members drop constraint if exists members_service_orgs_chk;
alter table public.members add constraint members_service_orgs_chk
  check (service_orgs <@ array['주일학교','중등부','고등부','청년부','구역장','성가대','찬양대']::text[]);

alter table public.members drop constraint if exists members_family_members_chk;
alter table public.members add constraint members_family_members_chk
  check (jsonb_typeof(family_members) = 'array');

-- 직분·신급·주거환경은 기존 자료에 다른 표기가 있을 수 있어 DB 에서 막지 않고, 화면에서 목록으로 고르게 합니다.
-- 직분: 성도, 권찰, 집사, 권사, 안수집사, 장로, 원로목사, 목사

-- 기존 "생년월일" 글자(예: 68.10.08, 1968-10-08, 19681008)를 날짜 칸으로 옮기기
-- 두 자리 연도는 올해 끝 두 자리보다 크면 19xx, 아니면 20xx 로 봅니다. 못 읽은 것은 비워 둡니다.
create or replace function pg_temp.try_birth(raw text)
returns date
language plpgsql
as $$
declare
  b text := regexp_replace(coalesce(raw, ''), '\s', '', 'g');
  p text[];
begin
  if b ~ '^\d{8}$' then
    return (substr(b, 1, 4) || '-' || substr(b, 5, 2) || '-' || substr(b, 7, 2))::date;
  end if;
  p := regexp_split_to_array(b, '[.\-/]');
  if array_length(p, 1) = 3 and b ~ '^\d{2,4}[.\-/]\d{1,2}[.\-/]\d{1,2}$' then
    if length(p[1]) = 2 then
      p[1] := (case when p[1]::int > extract(year from now())::int % 100 then '19' else '20' end) || p[1];
    end if;
    return (p[1] || '-' || p[2] || '-' || p[3])::date;
  end if;
  return null;
exception when others then
  return null;  -- 13월 40일 같은 잘못된 날짜는 비워 둠
end;
$$;

update public.members
set birth_date = pg_temp.try_birth(birth)
where birth_date is null and pg_temp.try_birth(birth) is not null;

-- 확인용: 날짜로 못 옮긴 생년월일
-- select name, birth from public.members where birth is not null and birth <> '' and birth_date is null;

-- ── 사진 저장소 (비공개) ─────────────────────────────────────────
-- 공개 주소가 없는 비공개 버킷입니다. 관리자만 올리고/보고/지울 수 있습니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-photos', 'member-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false;

drop policy if exists "member_photos_admin_select" on storage.objects;
create policy "member_photos_admin_select" on storage.objects for select to authenticated
  using (bucket_id = 'member-photos' and public.is_church_admin());

drop policy if exists "member_photos_admin_insert" on storage.objects;
create policy "member_photos_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'member-photos' and public.is_church_admin());

drop policy if exists "member_photos_admin_update" on storage.objects;
create policy "member_photos_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'member-photos' and public.is_church_admin());

drop policy if exists "member_photos_admin_delete" on storage.objects;
create policy "member_photos_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'member-photos' and public.is_church_admin());
