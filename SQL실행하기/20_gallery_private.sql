-- ============================================================
-- 안산상록교회 — 갤러리 사진 비공개 저장소 (로그인한 성도 전용)
-- 08·02 를 먼저 실행한 뒤, Supabase SQL Editor 에서 이 파일을 실행하세요.
--   gallery 버킷(비공개) : 사진 보관 — 승인된 정회원만 임시 링크로 열림
--   gallery_photos 표    : 사진 설명·사진방(청년부/장년) 정보
-- 권한: 보기 = 승인 정회원(정지 아님) · 올리기/바꾸기/지우기 = 관리자만
-- ============================================================

insert into storage.buckets (id, name, public) values ('gallery', 'gallery', false)
on conflict (id) do nothing;

drop policy if exists "gallery_members_read" on storage.objects;
create policy "gallery_members_read" on storage.objects for select to authenticated
  using (bucket_id = 'gallery' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.approved and not p.suspended));

drop policy if exists "gallery_admin_insert" on storage.objects;
create policy "gallery_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_church_admin());

drop policy if exists "gallery_admin_update" on storage.objects;
create policy "gallery_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'gallery' and public.is_church_admin())
  with check (bucket_id = 'gallery' and public.is_church_admin());

drop policy if exists "gallery_admin_delete" on storage.objects;
create policy "gallery_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and public.is_church_admin());

create table if not exists public.gallery_photos (
  id         bigint generated always as identity primary key,
  path       text not null unique,
  thumb_path text not null,
  caption    text not null default '',
  grp        text check (grp in ('youth', 'adult')),
  src_key    text unique,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
alter table public.gallery_photos enable row level security;

drop policy if exists "gp_select" on public.gallery_photos;
create policy "gp_select" on public.gallery_photos for select to authenticated
  using (public.is_approved_member() or public.is_church_admin());

drop policy if exists "gp_insert" on public.gallery_photos;
create policy "gp_insert" on public.gallery_photos for insert to authenticated
  with check (public.is_church_admin());

drop policy if exists "gp_update" on public.gallery_photos;
create policy "gp_update" on public.gallery_photos for update to authenticated
  using (public.is_church_admin()) with check (public.is_church_admin());

drop policy if exists "gp_delete" on public.gallery_photos;
create policy "gp_delete" on public.gallery_photos for delete to authenticated
  using (public.is_church_admin());

revoke all on public.gallery_photos from anon;
grant select, insert, update, delete on public.gallery_photos to authenticated;

notify pgrst, 'reload schema';
