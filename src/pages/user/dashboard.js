// src/pages/user/dashboard.js
import { logout, getCurrentUser } from "../util/auth.js";

export default function UserDashboard(navigateTo) {
  const btn = document.getElementById('btn-logout-user');
  if (btn) {
    btn.addEventListener('click', () => {
      logout();
      navigateTo('/login');
    });
  }

  const u = getCurrentUser();
  // console.log('User session:', u);
}
