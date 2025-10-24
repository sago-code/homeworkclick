import './task.css';
import axios from 'axios';

const API_BASE = 'http://localhost:8080';

// Handler global para abrir el modal en modo edición
let openEditTaskModalHandler = null;

// Helpers de storage para userId como en projects.js
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
      } catch {}
    }
    const plain = storage.getItem('userId');
    if (plain) {
      const idNum = Number(plain);
      if (!Number.isNaN(idNum) && idNum > 0) return idNum;
    }
  }
  return null;
}

// Formateadores
function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso || '—';
  }
}
function formatDate(isoDate) {
  try {
    return isoDate ? new Date(isoDate).toLocaleDateString('es-ES', { dateStyle: 'medium' }) : '—';
  } catch {
    return isoDate || '—';
  }
}
function priorityBadgeFromDto(p) {
  const v = String(p || '').toUpperCase();
  if (v === 'HIGH') return '<span class="badge text-bg-danger">Alta</span>';
  if (v === 'MEDIUM') return '<span class="badge text-bg-warning text-dark">Media</span>';
  if (v === 'LOW') return '<span class="badge text-bg-secondary">Baja</span>';
  return '<span class="badge text-bg-light text-dark">—</span>';
}
function statusBadge(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'pendiente') return '<span class="badge text-bg-secondary">Pendiente</span>';
  if (v === 'en_progreso') return '<span class="badge text-bg-info text-dark">En progreso</span>';
  if (v === 'completada') return '<span class="badge text-bg-success">Completada</span>';
  return '<span class="badge text-bg-light text-dark">—</span>';
}

// Cargar proyectos para el select
async function loadProjectsOptions(select) {
  const createBtn = document.getElementById('openCreateTaskModal');
  const userId = getStoredUserId();
  if (!userId) {
    console.warn('userId no disponible en storage; no se puede consultar proyectos.');
    // Fallback: placeholder y deshabilitar creación
    select.innerHTML = `<option value="" disabled selected>— Selecciona un proyecto —</option>`;
    if (createBtn) createBtn.setAttribute('disabled', 'true');
    return [];
  }
  try {
    const res = await axios.get(`${API_BASE}/api/projects`, { params: { userId, role: 'ADMIN' } });
    const projects = Array.isArray(res.data) ? res.data : [];
    if (projects.length > 0) {
      select.innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      if (createBtn) createBtn.removeAttribute('disabled');
    } else {
      select.innerHTML = `<option value="" disabled selected>— No hay proyectos —</option>`;
      if (createBtn) createBtn.setAttribute('disabled', 'true');
    }
    return projects;
  } catch (err) {
    console.error('Error cargando proyectos:', err);
    const msg =
      err?.response?.data?.message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message || 'No se pudieron cargar los proyectos';
    alert(msg);
    select.innerHTML = `<option value="" disabled selected>— Error cargando proyectos —</option>`;
    if (createBtn) createBtn.setAttribute('disabled', 'true');
    return [];
  }
}

// Intentar obtener tareas de un proyecto (requiere GET en backend)
async function fetchTasksForProject(projectId) {
  try {
    const res = await axios.get(`${API_BASE}/api/projects/${projectId}/tasks`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    const serverMsg =
      err?.response?.data?.message ||
      (typeof err?.response?.data === 'string' ? err.response.data : null) ||
      err?.message || 'Error consultando tareas';
    console.warn(serverMsg);
    return [];
  }
}

// Render de tabla de tareas
function renderTasks(tbody, tasks, projectName = '—') {
  const rows = tasks.map(t => `
    <tr data-task-id="${t.id ?? ''}">
      <th scope="row">${t.id ?? '—'}</th>
      <td>
        ${t.title ?? '—'}
        <button
          class="btn btn-sm btn-link btn-edit-task"
          data-id="${t.id ?? ''}"
          data-title="${(t.title ?? '').replace(/\"/g, '&quot;')}"
          data-description="${(t.description ?? '').replace(/\"/g, '&quot;')}"
          data-status="${t.status ?? ''}"
          data-priority="${t.priority ?? ''}"
          data-due="${t.dueDate ?? ''}"
          data-project-name="${projectName}"
        >Editar</button>
      </td>
      <td>${statusBadge(t.status)}</td>
      <td>${priorityBadgeFromDto(t.priority)}</td>
      <td>${formatDate(t.dueDate)}</td>
      <td>${formatDateTime(t.createdAt)}</td>
      <td>${formatDateTime(t.updatedAt)}</td>
      <td><span class="badge text-bg-primary">${projectName}</span></td>
    </tr>
  `).join('');
  tbody.innerHTML = rows || `
    <tr>
      <td colspan="8" class="text-center text-muted py-4">No hay tareas para este proyecto.</td>
    </tr>
  `;
  wireTaskEditActions(tbody);
}

// Delegación de eventos para botones "Editar" en la tabla
function wireTaskEditActions(tbodyEl) {
  if (!tbodyEl || tbodyEl.dataset.editWired === 'true') return;

  tbodyEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-edit-task');
    if (!btn) return;

    const id = Number(btn.getAttribute('data-id'));
    if (!id) return;

    const prefill = {
      title: btn.getAttribute('data-title') || '',
      description: btn.getAttribute('data-description') || '',
      status: btn.getAttribute('data-status') || 'pendiente',
      priority: (btn.getAttribute('data-priority') || 'MEDIUM').toUpperCase(),
      dueDate: btn.getAttribute('data-due') || '',
      projectName: btn.getAttribute('data-project-name') || '—',
    };

    // Usa el handler global ya inicializado
    if (typeof openEditTaskModalHandler === 'function') {
      openEditTaskModalHandler(id, prefill);
    } else {
      console.warn('El modal aún no está listo. Intenta nuevamente.');
    }
  });

  // Marca para evitar duplicar listeners en futuros renders
  tbodyEl.dataset.editWired = 'true';
}

// Montaje de página
export function mountTasksPage({ selectId = 'projectFilter', tbodyId = 'tasksTableBody' } = {}) {
  const select = document.getElementById(selectId);
  const tbody = document.getElementById(tbodyId);
  if (!select || !tbody) return false;

  // Función: modal de crear/editar tarea
  function wireCreateTaskModal() {
    const openBtn = document.getElementById('openCreateTaskModal');
    const modal = document.getElementById('createTaskModal');
    const backdrop = document.getElementById('createTaskBackdrop');
    const closeBtn = document.getElementById('closeCreateTaskModal');
    const closeFooterBtn = document.getElementById('closeCreateTaskModalFooter');
    const form = document.getElementById('createTaskForm');
  
    const titleEl = document.getElementById('ct_modal_title');
    const submitBtn = document.getElementById('ct_submit_btn');
  
    const projectNameInput = document.getElementById('ct_project_name');
    const titleInput = document.getElementById('ct_title');
    const descriptionInput = document.getElementById('ct_description');
    const statusSelect = document.getElementById('ct_status');
    const prioritySelect = document.getElementById('ct_priority');
    const dueDateInput = document.getElementById('ct_dueDate');
  
    const select = document.getElementById('projectFilter');
    const tbody = document.getElementById('tasksTableBody');
  
    // Hacer el campo de proyecto NO editable
    projectNameInput.readOnly = true;
    projectNameInput.disabled = true;
  
    // Utilidad para sincronizar proyecto seleccionado en el modal
    const setProjectFromSelect = () => {
      const pid = Number(select?.value || 0);
      form.dataset.projectId = String(pid);
      const projectName = select?.options[select?.selectedIndex]?.text || '—';
      projectNameInput.value = projectName;
    };
  
    // Abrir modal en modo crear
    const openCreateModal = () => {
      form.dataset.mode = 'create';
      form.dataset.taskId = '';
  
      // Primero resetear, luego setear proyecto (evita borrar el nombre)
      form.reset();
      setProjectFromSelect();
  
      titleEl.textContent = 'Crear tarea';
      submitBtn.textContent = 'Crear tarea para este proyecto';
  
      statusSelect.value = 'pendiente';
      prioritySelect.value = 'MEDIUM';
      dueDateInput.value = '';
  
      modal.hidden = false; backdrop.hidden = false;
    };
  
    // Abrir modal en modo editar con prefill
    const openEditModal = (taskId, prefill = {}) => {
      form.dataset.mode = 'update';
      form.dataset.taskId = String(taskId);
  
      setProjectFromSelect();
  
      titleEl.textContent = 'Editar tarea';
      submitBtn.textContent = 'Guardar cambios';
  
      titleInput.value = prefill.title || '';
      descriptionInput.value = prefill.description || '';
      statusSelect.value = prefill.status || 'pendiente';
      prioritySelect.value = (prefill.priority || 'MEDIUM').toUpperCase();
      dueDateInput.value = prefill.dueDate || '';
  
      modal.hidden = false; backdrop.hidden = false;
    };
  
    // Exponer handler global para los botones de edición
    openEditTaskModalHandler = openEditModal;
  
    const closeModal = () => {
      modal.hidden = true; backdrop.hidden = true;
      form.dataset.mode = 'create';
      form.dataset.taskId = '';
      // Reset y sincroniza proyecto actual para el próximo abrir
      form.reset();
      setProjectFromSelect();
      titleEl.textContent = 'Crear tarea';
      submitBtn.textContent = 'Crear tarea para este proyecto';
      statusSelect.value = 'pendiente';
      prioritySelect.value = 'MEDIUM';
      dueDateInput.value = '';
    };
  
    openBtn?.addEventListener('click', openCreateModal);
    closeBtn?.addEventListener('click', closeModal);
    closeFooterBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Cierra correctamente el modal si está abierto
        const modal = document.getElementById('createTaskModal');
        const backdrop = document.getElementById('createTaskBackdrop');
        const isOpen = modal && !modal.hidden;
        if (isOpen) {
          // reutiliza closeModal del scope actual
          const evt = new Event('click');
          document.getElementById('closeCreateTaskModal')?.dispatchEvent(evt);
        }
      }
    });
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const mode = form.dataset.mode || 'create';
      const taskId = Number(form.dataset.taskId || 0);
      const projectId = Number(form.dataset.projectId || select?.value || 0);
  
      const title = (titleInput.value || '').trim();
      const description = (descriptionInput.value || '').trim();
      const status = (statusSelect.value || 'pendiente').trim();
      const priority = (prioritySelect.value || 'MEDIUM').trim().toUpperCase();
      const dueDate = (dueDateInput.value || '').trim();
  
      if (!title) {
        alert('El título es obligatorio.');
        return;
      }
      if (!projectId) {
        alert('Seleccione un proyecto antes de crear/editar tareas.');
        return;
      }
  
      try {
        if (mode === 'update' && taskId > 0) {
          const body = {
            title,
            description: description || null,
            status,
            priority,
            dueDate: dueDate || null,
          };
          await axios.put(`${API_BASE}/api/projects/tasks/${taskId}`, body);
        } else {
          // Adaptación al backend: TaskCreateRequest { projectId, tasks: string[] }
          const createBody = {
            projectId,
            tasks: [title],
          };
          const createRes = await axios.post(`${API_BASE}/api/projects/tasks`, createBody);
          const createdList = Array.isArray(createRes.data) ? createRes.data : [];
  
          // Si hay detalles extra, aplicar con PUT a la tarea recién creada
          if (createdList.length === 1 && (description || status || priority || dueDate)) {
            const createdId = createdList[0]?.id;
            if (createdId) {
              await axios.put(`${API_BASE}/api/projects/tasks/${createdId}`, {
                title,
                description: description || null,
                status,
                priority,
                dueDate: dueDate || null,
              });
            }
          }
        }
  
        closeModal();
  
        // Refrescar tareas del proyecto seleccionado
        const name = select?.options[select?.selectedIndex]?.text || '—';
        const tasks = await fetchTasksForProject(projectId);
        renderTasks(tbody, tasks, name);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          (typeof err?.response?.data === 'string' ? err.response.data : null) ||
          err?.message || 'Error desconocido';
        alert((mode === 'update' ? 'Error al actualizar tarea: ' : 'Error al crear tarea: ') + msg);
        console.error(mode === 'update' ? 'PUT /api/projects/tasks/:id' : 'POST /api/projects/tasks', err);
      }
    });
  }

  // Inicializa el modal una sola vez al montar
  wireCreateTaskModal();

  // Cargar proyectos y render inicial
  loadProjectsOptions(select).then(async (projects) => {
    const initialProjectId = select.value || projects[0]?.id;
    if (initialProjectId) {
      // Asegura que el select tenga el proyecto “activo” seleccionado
      select.value = String(initialProjectId);

      const opt = select.options[select.selectedIndex];
      const name = opt?.text || '—';
      const tasks = await fetchTasksForProject(initialProjectId);
      renderTasks(tbody, tasks, name);
    } else {
      renderTasks(tbody, [], '—');
    }
  });

  select.addEventListener('change', async () => {
    const projectId = select.value;
    const opt = select.options[select.selectedIndex];
    const name = opt?.text || '—';
    if (!projectId) {
      renderTasks(tbody, [], name);
      return;
    }
    const tasks = await fetchTasksForProject(projectId);
    renderTasks(tbody, tasks, name);
  });

  return true;
}

export function autoMountTasks() {
  if (mountTasksPage()) return;
  const observer = new MutationObserver(() => {
    if (mountTasksPage()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}