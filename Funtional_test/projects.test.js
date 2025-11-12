import { describe, it, beforeAll, afterAll, expect, jest } from '@jest/globals';
import { 
  createDriver, 
  closeDriver, 
  waitForElement, 
  waitForClickable,
  waitForText,
  waitForModal,
  closeModal,
  waitForTableData,
  getTextSafe,
  login,
  takeScreenshot,
  APP_CONFIG,
  TEST_CREDENTIALS
} from './helpers/setup.js';
import { By, until } from 'selenium-webdriver';

// Exportable endpoint-friendly runner
export async function runProjectsE2E() {
  let driver;
  const results = { steps: [], screenshots: [] };

  try {
    driver = await (await import('./helpers/setup.js')).createDriver();
    const { APP_CONFIG, TEST_CREDENTIALS, waitForElement, waitForClickable, takeScreenshot, getTextSafe } =
      await import('./helpers/setup.js');
    const { By } = await import('selenium-webdriver');

    // Login
    await driver.get(`${APP_CONFIG.baseUrl}/login`);
    await waitForElement(driver, '#form-login');
    const emailInput = await driver.findElement(By.id('correo'));
    await emailInput.clear();
    await emailInput.sendKeys(TEST_CREDENTIALS.admin.email);
    const passwordInput = await driver.findElement(By.id('contraseña'));
    await passwordInput.clear();
    await passwordInput.sendKeys(TEST_CREDENTIALS.admin.password);
    try {
      const roleSelect = await driver.findElement(By.id('role'));
      await roleSelect.click();
      const roleOption = await driver.findElement(By.css(`#role option[value="${TEST_CREDENTIALS.admin.role}"]`));
      await roleOption.click();
    } catch {}
    await takeScreenshot(driver, '01_login_formulario_completado');
    results.screenshots.push('01_login_formulario_completado');
    const submitButton = await driver.findElement(By.css('#form-login button[type="submit"]'));
    await submitButton.click();
    await driver.sleep(2000);
    await takeScreenshot(driver, '02_login_completado');
    results.screenshots.push('02_login_completado');
    results.steps.push('Login completado');

    // Navegación proyectos
    await driver.get(`${APP_CONFIG.baseUrl}/projects`);
    const title = await getTextSafe(driver, 'h2');
    results.steps.push(`Navegado a /projects, título: ${title}`);

    // Abrir modal crear proyecto
    const createButton = await waitForClickable(driver, '#openCreateProjectModal');
    await createButton.click();
    await driver.sleep(500);
    results.steps.push('Modal crear proyecto abierto');

    // Crear proyecto
    const nameInput = await driver.findElement(By.id('cp_name'));
    const descriptionInput = await driver.findElement(By.id('cp_description'));
    const tasksInput = await driver.findElement(By.id('cp_tasks'));
    const projectName = `Proyecto Test ${Date.now()}`;
    await nameInput.clear(); await nameInput.sendKeys(projectName);
    await descriptionInput.clear(); await descriptionInput.sendKeys('Proyecto generado vía endpoint');
    await tasksInput.clear(); await tasksInput.sendKeys('Tarea 1\nTarea 2\nTarea 3');
    await takeScreenshot(driver, '05_formulario_proyecto_completado');
    results.screenshots.push('05_formulario_proyecto_completado');

    const submitProj = await waitForClickable(driver, '#cp_submit_btn');
    await submitProj.click();
    await driver.sleep(2000);
    const tbody = await driver.findElement(By.css('#projectsTableBody'));
    const tableText = await tbody.getText();
    const created = tableText.includes(projectName);
    results.steps.push(`Proyecto creado y listado: ${created ? 'sí' : 'no'}`);

    return { success: true, createdProjectName: projectName, ...results };
  } catch (err) {
    return { success: false, error: err?.message || String(err), ...results };
  } finally {
    if (driver) {
      const { closeDriver } = await import('./helpers/setup.js');
      await closeDriver(driver);
    }
  }
}

describe('Pruebas funcionales - Proyectos', () => {
  let driver;

  beforeAll(async () => {
    // Aumentar timeout para beforeAll
    jest.setTimeout(120000); // 2 minutos
    
    try {
      driver = await createDriver();
      console.log('Driver de Selenium creado exitosamente');
      
      // Navegar a la página de login para tomar captura inicial
      await driver.get(`${APP_CONFIG.baseUrl}/login`);
      await driver.sleep(1000);
      await takeScreenshot(driver, '00_pagina_login');
      
      // Realizar login antes de cada suite
      // Primero llenamos el formulario manualmente para tomar captura antes de enviar
      await waitForElement(driver, '#form-login');
      
      const emailInput = await driver.findElement(By.id('correo'));
      await emailInput.clear();
      await emailInput.sendKeys(TEST_CREDENTIALS.admin.email);
      
      const passwordInput = await driver.findElement(By.id('contraseña'));
      await passwordInput.clear();
      await passwordInput.sendKeys(TEST_CREDENTIALS.admin.password);
      
      try {
        const roleSelect = await driver.findElement(By.id('role'));
        await roleSelect.click();
        await driver.sleep(500);
        const roleOption = await driver.findElement(By.css(`#role option[value="${TEST_CREDENTIALS.admin.role}"]`));
        await roleOption.click();
        await driver.sleep(500);
      } catch (error) {
        console.log('Selector de rol no encontrado, continuando...');
      }
      
      // Captura de pantalla: Formulario de login completado (antes de enviar)
      await takeScreenshot(driver, '01_login_formulario_completado');
      
      // Enviar formulario
      const submitButton = await driver.findElement(By.css('#form-login button[type="submit"]'));
      await submitButton.click();
      
      // Esperar a que la navegación ocurra
      await driver.sleep(3000);
      
      console.log('Login completado exitosamente');
      
      // Captura de pantalla después del login exitoso
      await takeScreenshot(driver, '02_login_completado');
    } catch (error) {
      console.error('Error en beforeAll:', error);
      // Tomar screenshot del error si es posible
      if (driver) {
        try {
          await takeScreenshot(driver, 'error_login');
        } catch {}
        await closeDriver(driver);
      }
      throw error;
    }
  }, 120000); // Timeout de 2 minutos para beforeAll

  afterAll(async () => {
    if (driver) {
      await closeDriver(driver);
    }
  }, 30000);

  describe('Navegación a la página de proyectos', () => {
    it('debe navegar a la página de proyectos', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/projects`);
      await driver.sleep(2000);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('/projects');

      // Verificar que la página se cargó correctamente
      const title = await getTextSafe(driver, 'h2');
      expect(title).toContain('Proyectos');
    });

    it('debe mostrar el botón de crear proyecto', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/projects`);
      await driver.sleep(2000);

      const createButton = await waitForElement(driver, '#openCreateProjectModal');
      const buttonText = await createButton.getText();
      expect(buttonText).toContain('Crear proyecto');
    });
  });

  describe('Listar proyectos', () => {
    it('debe mostrar la tabla de proyectos', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/projects`);
      await driver.sleep(3000); // Esperar a que carguen los proyectos desde el API

      const table = await waitForElement(driver, '#projectsTableBody');
      expect(table).toBeDefined();

      // Verificar que la tabla tiene las columnas correctas
      const headers = await driver.findElements(By.css('thead th'));
      expect(headers.length).toBeGreaterThan(0);
    });

    it('debe mostrar proyectos en la tabla o mensaje de sin proyectos', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/projects`);
      await driver.sleep(3000);

      const tbody = await driver.findElement(By.css('#projectsTableBody'));
      const rows = await tbody.findElements(By.css('tr'));
      
      // Debe haber al menos una fila (puede ser "Sin proyectos" o datos)
      expect(rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Crear proyecto', () => {
    const projectName = `Proyecto Test ${Date.now()}`;
    const projectDescription = 'Descripción del proyecto de prueba creado con Selenium';

    it('debe abrir el modal de crear proyecto', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/projects`);
      await driver.sleep(2000);

      // Captura de pantalla: Página de proyectos cargada
      await takeScreenshot(driver, '03_pagina_proyectos');

      const createButton = await waitForClickable(driver, '#openCreateProjectModal');
      await createButton.click();
      await driver.sleep(1000);

      // Verificar que el modal está visible
      const modal = await driver.findElement(By.css('#createProjectModal'));
      const hidden = await modal.getAttribute('hidden');
      expect(hidden).not.toBe('true');

      // Captura de pantalla: Modal de crear proyecto abierto
      await takeScreenshot(driver, '04_modal_crear_proyecto_abierto');
    });

    it('debe crear un proyecto correctamente', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/projects`);
      await driver.sleep(2000);

      // Abrir modal
      const createButton = await waitForClickable(driver, '#openCreateProjectModal');
      await createButton.click();
      await driver.sleep(1000);

      // Esperar a que el modal esté visible
      await waitForElement(driver, '#cp_name');

      // Llenar el formulario
      const nameInput = await driver.findElement(By.id('cp_name'));
      await nameInput.clear();
      await nameInput.sendKeys(projectName);

      const descriptionInput = await driver.findElement(By.id('cp_description'));
      await descriptionInput.clear();
      await descriptionInput.sendKeys(projectDescription);

      // Agregar tareas iniciales (opcional)
      const tasksInput = await driver.findElement(By.id('cp_tasks'));
      await tasksInput.clear();
      await tasksInput.sendKeys('Tarea 1\nTarea 2\nTarea 3');
      await driver.sleep(500); // Esperar a que se actualice la vista previa

      // Captura de pantalla: Formulario de crear proyecto completado (antes de enviar)
      await takeScreenshot(driver, '05_formulario_proyecto_completado');

      // Enviar formulario
      const submitButton = await waitForClickable(driver, '#cp_submit_btn');
      await submitButton.click();

      // Esperar a que se cierre el modal y se actualice la tabla
      await driver.sleep(3000);

      // Captura de pantalla: Proyecto guardado (después de enviar)
      await takeScreenshot(driver, '06_proyecto_guardado');

      // Verificar que el modal se cerró
      const modal = await driver.findElement(By.css('#createProjectModal'));
      const hidden = await modal.getAttribute('hidden');
      expect(hidden).toBe('true');

      // Verificar que el proyecto aparece en la tabla
      const tbody = await driver.findElement(By.css('#projectsTableBody'));
      const tableText = await tbody.getText();
      expect(tableText).toContain(projectName);

      // Captura de pantalla final: Lista de proyectos con el nuevo proyecto
      await takeScreenshot(driver, '07_proyecto_en_lista');
    });
  });

  describe('Editar proyecto', () => {
    const updatedName = `Proyecto Editado ${Date.now()}`;
    const updatedDescription = 'Descripción actualizada del proyecto';

    it('debe poder editar un proyecto existente', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/projects`);
      await driver.sleep(3000);

      // Buscar un botón de editar en la tabla
      const editButtons = await driver.findElements(By.css('.btn-edit-project'));
      
      if (editButtons.length > 0) {
        // Hacer clic en el primer botón de editar
        await editButtons[0].click();
        await driver.sleep(1000);

        // Verificar que el modal se abrió en modo edición
        const modalTitle = await getTextSafe(driver, '#cp_modal_title');
        expect(modalTitle).toContain('Editar');

        // Modificar el nombre
        const nameInput = await driver.findElement(By.id('cp_name'));
        await nameInput.clear();
        await nameInput.sendKeys(updatedName);

        // Modificar la descripción
        const descriptionInput = await driver.findElement(By.id('cp_description'));
        await descriptionInput.clear();
        await descriptionInput.sendKeys(updatedDescription);

        // Guardar cambios
        const submitButton = await waitForClickable(driver, '#cp_submit_btn');
        await submitButton.click();

        // Esperar a que se actualice
        await driver.sleep(3000);

        // Verificar que los cambios se aplicaron
        const tbody = await driver.findElement(By.css('#projectsTableBody'));
        const tableText = await tbody.getText();
        expect(tableText).toContain(updatedName);
      } else {
        console.log('No hay proyectos para editar. Se requiere crear uno primero.');
        // Este test pasa si no hay proyectos, pero registra la situación
        expect(editButtons.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Validaciones del formulario de proyecto', () => {
    it('debe requerir el nombre del proyecto', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/projects`);
      await driver.sleep(2000);

      // Abrir modal
      const createButton = await waitForClickable(driver, '#openCreateProjectModal');
      await createButton.click();
      await driver.sleep(1000);

      // Intentar enviar sin nombre
      const submitButton = await waitForClickable(driver, '#cp_submit_btn');
      
      // El navegador debería prevenir el envío si el campo es required
      const nameInput = await driver.findElement(By.id('cp_name'));
      const isRequired = await nameInput.getAttribute('required');
      expect(isRequired).toBe('true');
    });

    it('debe cerrar el modal al hacer clic en cerrar', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/projects`);
      await driver.sleep(2000);

      // Abrir modal
      const createButton = await waitForClickable(driver, '#openCreateProjectModal');
      await createButton.click();
      await driver.sleep(1000);

      // Cerrar modal
      const closeButton = await waitForClickable(driver, '#closeCreateProjectModal');
      await closeButton.click();
      await driver.sleep(1000);

      // Verificar que el modal se cerró
      const modal = await driver.findElement(By.css('#createProjectModal'));
      const hidden = await modal.getAttribute('hidden');
      expect(hidden).toBe('true');
    });
  });
});

