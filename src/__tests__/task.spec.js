import { mountTasksPage } from '../pages/Tasks/task.js';
import axios from 'axios';
import { describe, it, expect, beforeEach, vi } from 'vitest';

function mountDom() {
  document.body.innerHTML = `
    <button id="openCreateTaskModal">Crear tarea para este proyecto</button>

    <div class="modal-backdrop-custom" id="createTaskBackdrop" hidden></div>
    <div class="modal-custom" id="createTaskModal" hidden>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="ct_modal_title">Crear tarea</h5>
          </div>
          <div class="modal-body">
            <form id="createTaskForm">
              <div class="form-floating mb-3">
                <input type="text" class="form-control" id="ct_project_name" placeholder="Proyecto" readonly />
                <label for="ct_project_name">Proyecto</label>
              </div>

              <div class="form-floating mb-3">
                <input type="text" id="ct_title" class="form-control" placeholder="Título" />
                <label for="ct_title">Título</label>
              </div>

              <div class="form-floating mb-3">
                <textarea id="ct_description" class="form-control" placeholder="Descripción (opcional)"></textarea>
                <label for="ct_description">Descripción (opcional)</label>
              </div>

              <div class="row g-3 mb-3">
                <div class="col">
                  <select id="ct_status" class="form-select">
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>
                <div class="col">
                  <select id="ct_priority" class="form-select">
                    <option value="HIGH">Alta</option>
                    <option value="MEDIUM">Media</option>
                    <option value="LOW">Baja</option>
                  </select>
                </div>
              </div>

              <div class="form-floating mb-3">
                <input type="date" id="ct_dueDate" class="form-control" />
                <label for="ct_dueDate">Fecha de vencimiento (opcional)</label>
              </div>

              <button type="submit" id="ct_submit_btn" class="btn btn-primary">Crear tarea para este proyecto</button>
            </form>
          </div>
          <div class="modal-footer">
            <button id="closeCreateTaskModalFooter" type="button" class="btn btn-secondary">Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <button id="closeCreateTaskModal" hidden>cerrar</button>

    <select id="projectFilter">
      <option value="1">Panaderia</option>
      <option value="2">Carniceria</option>
    </select>

    <table>
      <tbody id="tasksTableBody"></tbody>
    </table>
  `;
  window.localStorage.setItem('user', JSON.stringify({ id: 1 }));
}

// Helper para esperar micro/macro-tasks de los handlers async
async function flush() {
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

describe('Tasks page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mountDom();
    // Inyecta userId para que loadProjectsOptions no haga fallback
    window.localStorage.setItem('user', JSON.stringify({ id: 1 }));
  });

  it('prellena proyecto y crea tarea enviando { projectId, tasks: [title] }', async () => {
    // Mock de carga inicial (lista de proyectos/tareas)
    axios.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Panaderia' }] }); // loadProjectsOptions
    axios.get.mockResolvedValueOnce({ data: [] }); // fetchTasksForProject inicial

    const mounted = mountTasksPage();
    expect(mounted).toBe(true);
    await flush(); // espera a que se poblen opciones del select

    // Abrir modal de "Crear"
    document.getElementById('openCreateTaskModal').click();
    await flush(); // asegura que setProjectFromSelect() corra

    // Verificar proyecto pre-rellenado y no editable
    const projectInput = document.getElementById('ct_project_name');
    expect(projectInput.value).toBe('Panaderia');
    expect(projectInput.readOnly).toBe(true);

    // Completar datos
    document.getElementById('ct_title').value = 'arina';
    document.getElementById('ct_description').value = 'comprar arina';
    document.getElementById('ct_status').value = 'pendiente';
    document.getElementById('ct_priority').value = 'HIGH';
    document.getElementById('ct_dueDate').value = '2025-10-24';

    // Mock de creación: devuelve una única tarea creada
    axios.post.mockResolvedValueOnce({ data: [{ id: 123, title: 'arina' }] });
    // Mock de actualización posterior con detalles extra
    axios.put.mockResolvedValueOnce({ data: { id: 123, title: 'arina' } });
    // Mock de refresco de tareas
    axios.get.mockResolvedValueOnce({ data: [{ id: 123, title: 'arina', status: 'pendiente', priority: 'HIGH' }] });

    // Disparar submit y esperar procesamiento
    const form = document.getElementById('createTaskForm');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flush();

    // Assert del POST payload
    expect(axios.post).toHaveBeenCalledTimes(1);
    const [postUrl, postBody] = axios.post.mock.calls[0];
    expect(postUrl.endsWith('/api/projects/tasks')).toBe(true);
    expect(postBody).toEqual({ projectId: 1, tasks: ['arina'] });

    // Assert del PUT con detalles extra
    expect(axios.put).toHaveBeenCalledTimes(1);
    const [putUrl, putBody] = axios.put.mock.calls[0];
    expect(putUrl.endsWith('/api/projects/tasks/123')).toBe(true);
    expect(putBody).toMatchObject({
      title: 'arina',
      description: 'comprar arina',
      status: 'pendiente',
      priority: 'HIGH',
      dueDate: '2025-10-24',
    });
  });

  it('muestra error cuando backend responde "tasks es requerido"', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Panaderia' }] }); // loadProjectsOptions
    axios.get.mockResolvedValueOnce({ data: [] }); // fetchTasksForProject inicial

    const mounted = mountTasksPage();
    expect(mounted).toBe(true);
    await flush(); // espera a que se poblen opciones del select

    document.getElementById('openCreateTaskModal').click();
    await flush(); // asegura que setProjectFromSelect() corra

    document.getElementById('ct_title').value = 'arina';

    // Backend responde error de validación
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'tasks es requerido' } },
    });

    // Espía alert
    const alertSpy = vi.spyOn(window, 'alert');

    const form = document.getElementById('createTaskForm');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flush(); // permite que el catch ejecute alert

    expect(alertSpy).toHaveBeenCalled();
    const msg = alertSpy.mock.calls[0][0];
    expect(msg).toContain('Error al crear tarea');
    expect(msg).toContain('tasks es requerido');
  });
});