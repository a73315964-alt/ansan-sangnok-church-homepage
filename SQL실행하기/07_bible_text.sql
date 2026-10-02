-- ============================================================
-- 안산상록교회 — 성경 본문 (성경읽기 화면에서 장을 누르면 보이는 본문)
-- 이 파일은 "표"만 만듭니다. 본문 자료는 저작권 때문에 GitHub 에 올리지 않고,
-- scripts/import-bible-text.ps1 이 내 컴퓨터의 성경 txt 파일에서 직접 DB 로 넣습니다.
-- 읽기 권한: 승인된 회원과 관리자만 (로그인하지 않은 방문자는 볼 수 없음)
-- ============================================================

create table if not exists public.bible_verses (
  book     smallint not null check (book between 1 and 66),
  chapter  smallint not null check (chapter between 1 and 150),
  verse    smallint not null check (verse between 1 and 200),
  heading  text,             -- 단락 제목 (예: 천지 창조)
  body     text not null,
  primary key (book, chapter, verse)
);
alter table public.bible_verses enable row level security;

drop policy if exists "bible_verses_select_members" on public.bible_verses;
create policy "bible_verses_select_members" on public.bible_verses for select to authenticated
  using (public.is_approved_member() or public.is_church_admin());

revoke all on public.bible_verses from anon;
revoke insert, update, delete on public.bible_verses from authenticated;
