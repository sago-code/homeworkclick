import './projects.css';
import axios from 'axios';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

// Reemplazo: eliminar mock y renderizar desde backend (con vacío si no hay datos)
function renderProjectsTable(tbody, projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Sin proyectos</td></tr>`;
    return;
  }
  tbody.innerHTML = projects
    .map((p) => {
      const tasksCount = (typeof p.tasksCount === 'number')
        ? p.tasksCount
        : (Array.isArray(p.tasks) ? p.tasks.length : 0);
      const adminLabel = p.adminName ?? (p.createdBy?.fullName ?? "—");
      return `
        <tr data-project-id="${p.id ?? ''}">
          <th scope="row">${p.id ?? '—'}</th>
          <td>
            ${p.name ?? '—'}
            <button class="btn btn-sm btn-link btn-edit-project" data-id="${p.id ?? ''}">Editar</button>
          </td>
          <td>${p.description ?? '—'}</td>
          <td><span class="badge text-bg-primary">${adminLabel}</span></td>
          <td>${formatDate(p.createdAt)}</td>
          <td>${formatDate(p.updatedAt)}</td>
          <td><span class="badge text-bg-secondary">${tasksCount}</span></td>
        </tr>
      `;
    })
    .join("");
  wireProjectEditActions(tbody);
}

// Habilitar apertura del modal en modo edición desde la tabla
let openEditProjectModalHandler = null;
function wireProjectEditActions(tbodyEl) {
  const buttons = tbodyEl.querySelectorAll('.btn-edit-project');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      if (!id || !openEditProjectModalHandler) return;
      const row = btn.closest('tr');
      const name = row?.children?.[1]?.childNodes?.[0]?.nodeValue?.trim() || '';
      const desc = row?.children?.[2]?.textContent?.trim() || '';
      openEditProjectModalHandler(id, name, desc);
    });
  });
}

// Helpers para obtener el userId desde storage
function getStoredUserId() {
  const candidateKeys = ['user', 'usuario', 'currentUser', 'auth', 'loginUser'];
  const storages = [window.sessionStorage, window.localStorage];

  for (const storage of storages) {
    for (const key of candidateKeys) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        if (obj && obj.id != null) {
          const idNum = Number(obj.id);
          if (!Number.isNaN(idNum) && idNum > 0) return idNum;
        }
      } catch {
        // no JSON, continuamos
      }
    }
    // Fallback a un userId plano
    const plain = storage.getItem('userId');
    if (plain) {
      const idNum = Number(plain);
      if (!Number.isNaN(idNum) && idNum > 0) return idNum;
    }
  }
  return null;
}

// Base URL del backend para evitar 404 en Vite (sin proxy)
const API_BASE = 'http://localhost:8080';

// loadProjectsAndRender() — usar userId desde storage objeto { id, email, nombre, token }
async function loadProjectsAndRender(tbody) {
  try {
    const userId = getStoredUserId();
    if (!userId) {
      console.warn('userId no disponible en storage; no se puede consultar proyectos.');
      renderProjectsTable(tbody, []);
      return;
    }

    const res = await axios.get(`${API_BASE}/api/projects`, {
      params: { userId, role: 'ADMIN' },
    });
    const projects = Array.isArray(res.data) ? res.data : [];
    renderProjectsTable(tbody, projects);
  } catch (err) {
    console.error('Error listando proyectos:', err);
    alert('No se pudieron cargar los proyectos.');
    renderProjectsTable(tbody, []);
  }
}

// En función: wireCreateProjectModal() — usar axios y enviar adminUserId en el body
function wireCreateProjectModal() {
  const openBtn = document.getElementById('openCreateProjectModal');
  const modal = document.getElementById('createProjectModal');
  const backdrop = document.getElementById('createProjectBackdrop');
  const closeBtn = document.getElementById('closeCreateProjectModal');
  const closeFooterBtn = document.getElementById('closeCreateProjectModalFooter');
  const form = document.getElementById('createProjectForm');
  const tasksInput = document.getElementById('cp_tasks');
  const preview = document.getElementById('cp_tasks_preview');
  const countEl = document.getElementById('cp_tasks_count');
  const titleEl = document.getElementById('cp_modal_title');
  const submitBtn = document.getElementById('cp_submit_btn');

  // adminUserId desde storage (objeto con { id, email, nombre, token })
  const adminUserIdParam = getStoredUserId();

  // Abrir modal en modo "create"
  const openCreateModal = () => {
    form.dataset.mode = 'create';
    form.dataset.projectId = '';
    titleEl.textContent = 'Crear proyecto';
    submitBtn.textContent = 'Crear';
    // limpiar campos
    form.reset();
    renderPreview([]);
    modal.hidden = false; backdrop.hidden = false;
  };

  // Abrir modal en modo "update" con prefill
  const openEditModal = (id, name, description) => {
    form.dataset.mode = 'update';
    form.dataset.projectId = String(id);
    titleEl.textContent = 'Editar proyecto';
    submitBtn.textContent = 'Guardar cambios';
    // Prefill
    document.getElementById('cp_name').value = name || '';
    document.getElementById('cp_description').value = description || '';
    // Las tareas no se actualizan en PUT (solo name/description)
    renderPreview([]);
    modal.hidden = false; backdrop.hidden = false;
  };
  openEditProjectModalHandler = openEditModal;

  const closeModal = () => {
    modal.hidden = true; backdrop.hidden = true;
    // reset a create por defecto
    form.dataset.mode = 'create';
    form.dataset.projectId = '';
    titleEl.textContent = 'Crear proyecto';
    submitBtn.textContent = 'Crear';
  };

  openBtn.addEventListener('click', openCreateModal);
  closeBtn?.addEventListener('click', closeModal);
  closeFooterBtn?.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') e.preventDefault(); });

  const parseTasks = (raw) => raw.split('\n').map(s => s.trim()).filter(Boolean);
  const renderPreview = (items) => {
    if (!preview) return;
    preview.innerHTML = items.length
      ? items.map(t => `<li class="list-group-item">${t}</li>`).join('')
      : `<li class="list-group-item text-muted">Sin tareas</li>`;
    if (countEl) countEl.textContent = String(items.length);
  };

  tasksInput?.addEventListener('input', () => renderPreview(parseTasks(tasksInput.value)));
  renderPreview(parseTasks(tasksInput?.value || ''));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const mode = form.dataset.mode || 'create';
    const projectId = Number(form.dataset.projectId || 0);

    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const description = (fd.get('description') || '').toString();

    try {
      if (mode === 'update' && projectId > 0) {
        // PUT: solo name/description
        const body = { name, description };
        await axios.put(`${API_BASE}/api/projects/${projectId}`, body);
        closeModal();
      } else {
        // POST: crear (requiere adminUserId)
        if (!adminUserIdParam) {
          alert('No se encontró el adminUserId en storage. Inicie sesión nuevamente.');
          return;
        }
        const tasks = parseTasks((fd.get('tasks') || '').toString());
        const body = {
          adminUserId: adminUserIdParam,
          name,
          description,
          tasks: tasks.length ? tasks : null,
        };
        const res = await axios.post(`${API_BASE}/api/projects`, body);
        const dto = res.data;
        alert('Proyecto creado: ' + dto.name + ' (ID ' + dto.id + ')');
        closeModal();
      }

      const tbody = document.getElementById('projectsTableBody');
      if (tbody) await loadProjectsAndRender(tbody);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        err?.message || 'Error desconocido';
      alert((mode === 'update' ? 'Error al actualizar proyecto: ' : 'Error al crear proyecto: ') + msg);
      console.error(mode === 'update' ? 'PUT /api/projects/:id' : 'POST /api/projects', err);
    }
  });
}

export function mountProjectsPage(rootTableBodyId = "projectsTableBody") {
  const tbody = document.getElementById(rootTableBodyId);
  if (!tbody) return false;

  wireCreateProjectModal();

  // Cargar lista real con axios
  loadProjectsAndRender(tbody);
  return true;
}

// Auto-monta al aparecer el DOM objetivo (funciona en SPA)
export function autoMountProjects() {
  if (mountProjectsPage()) return;
  const observer = new MutationObserver(() => {
    if (mountProjectsPage()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}