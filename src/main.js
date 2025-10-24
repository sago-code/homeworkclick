import './style.css';

// Vistas existentes
import Login from './pages/login/login.js';
import loginHTML from './pages/login/login.html?raw';

import ChatbotApp from './pages/chatbot/app.js';
import chatbotHTML from './pages/chatbot/chatbot.html?raw';
import projectsHTML from './pages/projects/projects.html?raw';
import { autoMountMenu } from './components/menu/menu.js';
import { autoMountProjects } from './pages/projects/projects.js';
import tasksHTML from './pages/Tasks/task.html?raw';
import { autoMountTasks } from './pages/Tasks/task.js';

// NUEVAS vistas por rol
import AdminDashboard from './pages/admin/dashboard.js';
import adminHTML from './pages/admin/dashboard.html?raw';

import UserDashboard from './pages/user/dashboard.js';
import userHTML from './pages/user/dashboard.html?raw';

// Auth helpers (front-only)
import { getCurrentUser } from "./pages/util/auth.js";

// ---------- Navegación ----------
export function navigateTo(url) {
  if (window.location.pathname !== url) {
    history.pushState(null, null, url);
  }
  router();
}

// ---------- Guards ----------
function ensureLoggedIn() {
  const u = getCurrentUser();
  if (!u) {
    navigateTo('/login');
    return null;
  }
  return u;
}

function redirectByRole(u) {
  navigateTo(u.role === 'admin' ? '/admin' : '/user');
}

// ---------- Router ----------
export default async function router() {
  const path = window.location.pathname;
  const container = document.getElementById('app');
  const user = getCurrentUser(); // puede ser null

  if (user && (path === '/' || path === '/login')) {
    navigateTo(user.role === 'admin' ? '/admin' : '/user');
    return;
    
  console.log("👉 Router cargado con path:", path); // DEBUG

  if (path === '/' || path === '/login') {
    container.innerHTML = loginHTML;
    Login();
    if (path === '/') history.replaceState(null, null, '/login');
  } else if (path === '/chatbot') {
    container.innerHTML = chatbotHTML;
    const { default: ChatbotApp } = await import('./pages/chatbot/app.js');
    new ChatbotApp();
  } else if (path === '/projects') {
    container.innerHTML = projectsHTML;
    autoMountProjects();
  } else if (path === '/tasks') {
    container.innerHTML = tasksHTML;
    autoMountTasks();
  } else {
    console.warn("Ruta no encontrada:", path);
  }

  // DEBUG
  // console.log("👉 Router:", { path, user });

  switch (path) {
    case '/':
      // Si no hay sesión → /login; si hay → por rol
      if (!user) {
        history.replaceState(null, null, '/login');
        container.innerHTML = loginHTML;
        Login(navigateTo); // pasa navigateTo por si lo necesitas
      } else {
        redirectByRole(user);
      }
      break;

    case '/login':
      // Si ya hay sesión, no dejes ver login: redirige por rol
      if (user) {
        redirectByRole(user);
        return;
      }
      container.innerHTML = loginHTML;
      Login(navigateTo);
      break;

    case '/admin': {
      const u = ensureLoggedIn();
      if (!u) return;
      if (u.role !== 'admin') {
        // rol equivocado → a su dashboard
        redirectByRole(u);
        return;
      }
      container.innerHTML = adminHTML;
      AdminDashboard(navigateTo);
      break;
    }

    case '/user': {
      const u = ensureLoggedIn();
      if (!u) return;
      // Permitimos que admin también vea /user si quieres, o cambia a (u.role === 'user')
      container.innerHTML = userHTML;
      UserDashboard(navigateTo);
      break;
    }

    case '/chatbot': {
      // Si quieres que solo logueados vean el chatbot, activa esta línea:
      // if (!ensureLoggedIn()) return;
      container.innerHTML = chatbotHTML;
      new ChatbotApp();
      break;
    }

    default:
      console.warn("Ruta no encontrada:", path);
      // Fallback mínimo
      history.replaceState(null, null, '/login');
      container.innerHTML = loginHTML;
      Login(navigateTo);
  }
}
  
// Cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
  autoMountMenu('appMenu');
  router();
});

// Arranque
document.addEventListener('DOMContentLoaded', router);
window.addEventListener('popstate', router);
