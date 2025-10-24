// src/pages/util/ui.js
import { getCurrentUser, logout } from "./auth.js";
import { navigate } from "./router.js";

export function header(title = "HomeworkClick") {
  const user = getCurrentUser();
  const name = user?.username ?? "Invitado";
  return `
    <header class="topbar">
      <h1>${title}</h1>
      <div class="right">
        <span>👤 ${name}</span>
        ${user ? `<button id="btn-logout">Salir</button>` : ""}
      </div>
    </header>
  `;
}

export function attachHeaderEvents() {
  const btn = document.getElementById("btn-logout");
  if (btn) {
    btn.addEventListener("click", () => {
      logout();
      navigate("/login");
    });
  }
}
