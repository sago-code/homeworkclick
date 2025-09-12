import './style.css'; // Importar CSS global
import Login from './pages/login/login.js';
import loginHTML from './pages/login/login.html?raw';

// Función para navegar
export function navigateTo(url) {
  history.pushState(null, null, url);
  router();
}

// Router
export default async function router() {
  const path = window.location.pathname;
  const container = document.getElementById('app'); // tu contenedor principal

  if (path === '/' || path === '/login') {
    // Si es "/" o "/login", cargamos login
    container.innerHTML = loginHTML;
    Login(); // Inicializa la lógica del login
    if (path === '/') {
      // Redirigir a /login en el URL si estamos en "/"
      history.replaceState(null, null, '/login');
    }
  }
}

// Cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
  router();
});

// Manejo de back/forward del navegador
window.addEventListener('popstate', router);
