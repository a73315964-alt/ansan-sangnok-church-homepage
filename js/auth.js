/* ============================================================
   Supabase 로그인 공통 로직 — login.html, gyojeok.html 에서 사용
   ============================================================ */
window.SB_READY = false;
window.SB = null;

(function () {
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
    window.SB = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    window.SB_READY = true;
  }
})();

async function sbLogin(email, password) {
  if (!window.SB_READY) throw new Error("Supabase 설정이 비어 있습니다.");
  const { data, error } = await window.SB.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function sbLogout() {
  if (!window.SB_READY) return;
  await window.SB.auth.signOut();
  location.href = "login.html";
}

async function sbCurrentSession() {
  if (!window.SB_READY) return null;
  const { data } = await window.SB.auth.getSession();
  return data.session;
}

// gyojeok.html 맨 위에서 호출: 로그인 안 되어 있으면 login.html 로 보낸다.
async function sbRequireAuth() {
  if (!window.SB_READY) return "unconfigured";
  const session = await sbCurrentSession();
  if (!session) {
    location.href = "login.html";
    return "redirect";
  }
  return session;
}
