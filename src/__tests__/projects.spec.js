import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountProjectsPage } from '../pages/projects/projects.js';

describe('Projects Page', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <!-- DOM de projects -->
      <section>
        <button id="openCreateProjectModal"></button>
        <div id="createProjectModal" hidden></div>
        <div id="createProjectBackdrop" hidden></div>
        <button id="closeCreateProjectModal"></button>
        <button id="closeCreateProjectModalFooter"></button>
        <form id="createProjectForm">
          <input id="cp_name" name="name" />
          <textarea id="cp_description" name="description"></textarea>
          <textarea id="cp_tasks" name="tasks"></textarea>
          <span id="cp_tasks_count"></span>
          <ol id="cp_tasks_preview"></ol>
          <button id="cp_submit_btn" type="submit"></button>
        </form>
        <div class="table-responsive">
          <table><tbody id="projectsTableBody"></tbody></table>
        </div>
      </section>
    `;
    window.localStorage.setItem('user', JSON.stringify({ id: 1, email: 'yttye@gmail.com', nombre: 'User Test', token: 'TOK' }));
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it('carga proyectos usando userId del storage y renderiza filas', async () => {
    axios.get.mockResolvedValueOnce({ data: [
      { id: 10, name: 'Proyecto A', description: 'Desc A', adminUserId: 1, tasksCount: 3 },
      { id: 11, name: 'Proyecto B', description: 'Desc B', adminUserId: 1, tasksCount: 0 },
    ] });

    const mounted = mountProjectsPage();
    expect(mounted).toBe(true);

    await new Promise(r => setTimeout(r, 0));

    expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/projects', { params: { userId: 1, role: 'ADMIN' } });

    const tbody = document.getElementById('projectsTableBody');
    expect(tbody.children.length).toBeGreaterThanOrEqual(1);
  });

  it('alerta y renderiza vacío si falla la carga', async () => {
    const alertSpy = vi.spyOn(window, 'alert');
    axios.get.mockRejectedValueOnce(new Error('boom'));

    mountProjectsPage();
    await new Promise(r => setTimeout(r, 0));

    expect(alertSpy).toHaveBeenCalledWith('No se pudieron cargar los proyectos.');
    const tbody = document.getElementById('projectsTableBody');
    expect(tbody.children.length).toBe(0);
  });
});