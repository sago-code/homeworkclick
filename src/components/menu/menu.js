// Funciones: mountMenu, autoMountMenu
import './menu.css';
import menuTemplate from './menu.html?raw';
import { navigateTo } from '../../main';

// Monta el menú cuando exista el contenedor
export function mountMenu(rootId = 'appMenu') {
    const root = document.getElementById(rootId);
    if (!root) return false;

    root.innerHTML = menuTemplate;

    const toggle = root.querySelector('.menu-toggle');
    const items = root.querySelector('.menu-items');
    const links = [...root.querySelectorAll('.menu-link')];

    toggle?.addEventListener('click', () => {
        const open = items.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });

    links.forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            items.classList.remove('open');
            toggle?.setAttribute('aria-expanded', 'false');

            const action = a.dataset.action;
            const route = a.dataset.route;

            if (action === 'logout') {
                try { localStorage.removeItem('user'); } catch {}
                navigateTo('/login');
            } else if (route) {
                try { navigateTo(route); } catch { history.pushState({}, '', route); }
                if (route === '/proyectos' || route === '/projects') {
                    import('../../pages/projects/projects.js')
                      .then(m => m.autoMountProjects && m.autoMountProjects())
                      .catch(() => {});
                }
                if (route === '/tareas') {
                    import('../../pages/Tasks/task.js')
                      .then(m => m.autoMountTasks && m.autoMountTasks())
                      .catch(() => {});
                }
            }

            setActiveByRoute(root, route || window.location.pathname);
        });
    });

    setActiveByRoute(root, window.location.pathname);
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            items.classList.remove('open');
            toggle?.setAttribute('aria-expanded', 'false');
        }
    });

    return true;
}

// Auto-montaje para SPA: observa hasta que aparezca #appMenu
export function autoMountMenu(rootId = 'appMenu') {
    if (mountMenu(rootId)) return;

    const observer = new MutationObserver(() => {
        if (mountMenu(rootId)) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// Alias para compatibilidad con app.js
export function injectMenu(rootId = 'appMenu') {
    // Usa el auto-montaje para evitar carreras en SPA
    return autoMountMenu(rootId);
}

function setActiveByRoute(root, route) {
    const links = root.querySelectorAll('.menu-link');
    links.forEach(l => l.classList.remove('active'));
    const match = [...links].find(l => {
        const r = l.dataset.route;
        return r && (route.startsWith(r) || (route === '/' && r === '/dashboard'));
    });
    if (match) match.classList.add('active');
}