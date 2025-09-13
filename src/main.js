import './style.css'; // Importar CSS global
import Login from './pages/login/login.js';
import loginHTML from './pages/login/login.html?raw';
import ChatbotApp from './pages/chatbot/app.js';
import chatbotHTML from './pages/chatbot/chatbot.html?raw';

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
    new ChatbotApp();
  } else {
    console.warn("Ruta no encontrada:", path);
  }
}


// Cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
  router();
});

// Manejo de back/forward del navegador
window.addEventListener('popstate', router);
