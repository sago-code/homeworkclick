// src/pages/util/router.js
import { requireRole, getCurrentUser } from "./auth.js";

const routes = new Map(); // path -> { loader: () => Promise<string>, guard?: () => {ok:boolean,...} }

export function defineRoute(path, loader, guard) {
  routes.set(path, { loader, guard });
}

export async function navigate(path) {
  if (location.hash !== `#${path}`) {
    location.hash = path;
  } else {
    await render(path);
  }
}

export async function render(pathFromHash) {
  const app = document.getElementById("app");
  const path = pathFromHash || location.hash.replace(/^#/, "") || "/login";

  const route = routes.get(path);
  if (!route) {
    app.innerHTML = `<h1>404</h1><p>Ruta no encontrada: ${path}</p>`;
    return;
  }

  if (route.guard) {
    const g = route.guard();
    if (!g.ok) {
      if (g.reason === "NO_AUTH") return navigate("/login");
      if (g.reason === "FORBIDDEN") {
        const u = getCurrentUser();
        return navigate(u?.role === "admin" ? "/admin" : "/user");
      }
    }
  }

  const html = await route.loader();
  app.innerHTML = html;

  const init = window.__viewInit__;
  if (typeof init === "function") {
    init();
    delete window.__viewInit__;
  }
}

export function startRouter() {
  window.addEventListener("hashchange", () => render());
  render();
}
