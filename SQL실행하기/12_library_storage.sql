-- ============================================================
-- 안산상록교회 — 디지털 도서 저장소 (회원 전용)
-- 08 을 먼저 실행한 뒤, Supabase SQL Editor 에서 이 파일을 실행하세요.
--
-- 만드는 것
--   library 버킷 (비공개) : 디지털 도서 PDF 보관
-- 권한
--   읽기  : 승인된 정회원(정지 아님)만 — 로그인 후 임시 링크로 열림
--   올리기·지우기 : 관리자만 (대시보드 Storage 에서 직접 올려도 됩니다)
-- 파일 이름은 영문·숫자·하이픈으로 올려 주세요 (library.js 의 file 값과 같아야 함)
-- ============================================================

-- 1) 비공개 버킷 만들기 (이미 있으면 그대로 둠)
insert into storage.buckets (id, name, public)
values ('library', 'library', false)
on conflict (id) do nothing;

-- 2) 정회원만 읽기
drop policy if exists "library_members_read" on storage.objects;
create policy "library_members_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'library'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.approved and not p.suspended
    )
  );

-- 3) 관리자만 올리기 / 바꾸기 / 지우기
drop policy if exists "library_admin_insert" on storage.objects;
create policy "library_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'library' and public.is_church_admin());

drop policy if exists "library_admin_update" on storage.objects;
create policy "library_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'library' and public.is_church_admin())
  with check (bucket_id = 'library' and public.is_church_admin());

drop policy if exists "library_admin_delete" on storage.objects;
create policy "library_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'library' and public.is_church_admin());
