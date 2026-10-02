-- ============================================================
-- 안산상록교회 — 나의 대시보드: 본인 교적 카드 보기
-- 교적부(members)에 적힌 E-mail 이 로그인 이메일과 같으면, 승인된 회원은 "자기 카드 한 장"만 볼 수 있습니다.
-- (다른 교인의 교적은 여전히 관리자만 봅니다. 수정·삭제도 관리자만)
-- 05 를 실행한 뒤 실행하세요. 여러 번 실행해도 안전합니다.
-- ============================================================

drop policy if exists "members_select_own" on public.members;
create policy "members_select_own" on public.members for select to authenticated
  using (
    email is not null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and public.is_approved_member()
  );

create index if not exists members_email_idx on public.members (lower(email));
