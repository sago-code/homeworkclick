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

  console.log("👉 Router cargado con path:", path); // DEBUG

  switch (path) {
    case '/':
      if (!user) {
        history.replaceState(null, null, '/login');
        container.innerHTML = loginHTML;
        Login(navigateTo);
      } else {
        redirectByRole(user);
      }
      break;

    case '/login':
      container.innerHTML = loginHTML;
      Login(navigateTo);
      break;

    case '/admin': {
      const u = ensureLoggedIn();
      if (!u) return;
      if (u.role !== 'admin') {
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
      container.innerHTML = userHTML;
      UserDashboard(navigateTo);
      break;
    }

    case '/dashboard': {
      const u = ensureLoggedIn();
      if (!u) return;
      redirectByRole(u);
      break;
    }

    case '/chatbot': {
      container.innerHTML = chatbotHTML;
      const { default: ChatbotApp } = await import('./pages/chatbot/app.js');
      new ChatbotApp();
      break;
    }

    case '/projects': {
      const u = ensureLoggedIn();
      if (!u) return;
      container.innerHTML = projectsHTML;
      autoMountProjects();
      break;
    }

    case '/tasks': {
      const u = ensureLoggedIn();
      if (!u) return;
      container.innerHTML = tasksHTML;
      autoMountTasks();
      break;
    }

    default:
      console.warn("Ruta no encontrada:", path);
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
window.addEventListener('popstate', router);
