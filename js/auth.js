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

// 성도 회원가입 — 가입 후 목사님 승인이 있어야 성경읽기 체크가 가능합니다.
// Supabase 에서 이메일 확인이 켜져 있으면 확인 메일의 링크를 눌러야 로그인됩니다.
async function sbSignup(name, email, password) {
  if (!window.SB_READY) throw new Error("Supabase 설정이 비어 있습니다.");
  const { data, error } = await window.SB.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: new URL("login.html", location.href).href,
    },
  });
  if (error) throw error;
  return data;
}

async function sbSendPasswordReset(email) {
  if (!window.SB_READY) throw new Error("Supabase 설정이 비어 있습니다.");
  const { error } = await window.SB.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("login.html?mode=reset", location.href).href,
  });
  if (error) throw error;
}

async function sbUpdatePassword(password) {
  const { error } = await window.SB.auth.updateUser({ password });
  if (error) throw error;
}

// 목사님/관리자(admin_emails 에 등록된 계정) 여부
async function sbIsAdmin() {
  if (!window.SB_READY) return false;
  const { data, error } = await window.SB.rpc("is_church_admin");
  return !error && data === true;
}

// "super" (최고 관리자) / "admin" (관리자) / null (일반 회원)
async function sbMyRole() {
  if (!window.SB_READY) return null;
  const { data, error } = await window.SB.rpc("my_admin_role");
  return error ? null : data || null;
}

async function sbMyProfile() {
  const session = await sbCurrentSession();
  if (!session) return null;
  const { data } = await window.SB.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
  return data;
}

async function sbLogout() {
  if (!window.SB_READY) return;
  await window.SB.auth.signOut();
  location.href = "index.html";
}

async function sbCurrentSession() {
  if (!window.SB_READY) return null;
  const { data } = await window.SB.auth.getSession();
  return data.session;
}

// 로그인이 필요한 화면 맨 위에서 호출: 로그인 안 되어 있으면 login.html 로 보내고,
// 로그인 후 원래 화면으로 돌아오게 한다.
async function sbRequireAuth() {
  if (!window.SB_READY) return "unconfigured";
  const session = await sbCurrentSession();
  if (!session) {
    var here = location.pathname.split("/").pop() || "index.html";
    location.href = "login.html?next=" + encodeURIComponent(here);
    return "redirect";
  }
  return session;
}
