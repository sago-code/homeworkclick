// src/pages/util/auth.js
const STORAGE_KEY = "hc_user"; // { username, role: 'admin' | 'user' }

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function login({ username, role }) {
  if (!username || !role) throw new Error("username y role son obligatorios");
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ username, role }));
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

// 👇 Agrega esta función para que router.js pueda importarla
export function requireRole(roles) {
  const user = getCurrentUser();
  if (!user) return { ok: false, reason: "NO_AUTH" };
  if (Array.isArray(roles) && !roles.includes(user.role)) {
    return { ok: false, reason: "FORBIDDEN", role: user.role };
  }
  return { ok: true, user };
}
