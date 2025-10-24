import './style.css'; // Importar CSS global
import Login from './pages/login/login.js';
import loginHTML from './pages/login/login.html?raw';
import chatbotHTML from './pages/chatbot/chatbot.html?raw';
import projectsHTML from './pages/projects/projects.html?raw';
import { autoMountMenu } from './components/menu/menu.js';
import { autoMountProjects } from './pages/projects/projects.js';
import tasksHTML from './pages/Tasks/task.html?raw';
import { autoMountTasks } from './pages/Tasks/task.js';

// Función para navegar
export function navigateTo(url) {
  history.pushState(null, null, url);
  router();
}

// Router
export default async function router() {
  const path = window.location.pathname;
  const container = document.getElementById('app');

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
}

// Cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
  autoMountMenu('appMenu');
  router();
});

// Manejo de back/forward del navegador
window.addEventListener('popstate', router);
