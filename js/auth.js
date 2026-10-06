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

// 일반 회원의 로그인 비밀번호 — 생년월일(YYYY-MM-DD)에서 만듭니다.
// SQL실행하기/10_birth_login.sql 의 birth_login_password 와 반드시 같아야 합니다.
function birthPassword(birthDate) {
  return "sangnok:" + birthDate;
}

// "19650312", "1965-03-12", "1965.3.12" 등 → "1965-03-12" (잘못된 날짜면 null)
function normalizeBirth(text) {
  var s = String(text || "").trim();
  var m = /^(\d{4})(\d{2})(\d{2})$/.exec(s) || /^(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D*$/.exec(s);
  if (!m) return null;
  var y = +m[1], mo = +m[2], d = +m[3];
  var dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return y + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0");
}

// 생년월일 로그인 (일반 회원) — 생년월일로 계정을 찾고, 생년월일 비밀번호로 로그인
async function sbBirthLogin(birthDate) {
  if (!window.SB_READY) throw new Error("Supabase 설정이 비어 있습니다.");
  const { data: email, error } = await window.SB.rpc("birth_login_email", { p_birth: birthDate });
  if (error) throw error;
  if (!email) throw new Error("BIRTH_NOT_FOUND");
  return sbLogin(email, birthPassword(birthDate));
}

// 성도 회원가입 — 성명·생년월일이 교적부와 일치하면 DB 에서 자동으로 정회원 인증됩니다.
// (SQL실행하기/08_member_verification.sql 의 handle_new_user). 일치하지 않으면 관리자 승인 대기.
// 비밀번호는 따로 받지 않고 생년월일로 만듭니다 (로그인은 생년월일만).
// 이메일도 받지 않고 계정용 내부 주소를 자동으로 만듭니다 (메일은 보내지 않음).
// ※ Supabase → Authentication → Sign In / Providers → Email 의 "Confirm email" 이 꺼져 있어야 합니다.
function memberEmail(birthDate) {
  var rand = Math.random().toString(36).slice(2, 8);
  return "m" + String(birthDate).replace(/-/g, "") + "-" + rand + "@member.ansansangrok.or.kr";
}

async function sbSignup(name, birthDate) {
  if (!window.SB_READY) throw new Error("Supabase 설정이 비어 있습니다.");
  const { data, error } = await window.SB.auth.signUp({
    email: memberEmail(birthDate),
    password: birthPassword(birthDate),
    options: {
      data: { name, birth_date: birthDate || null },
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
