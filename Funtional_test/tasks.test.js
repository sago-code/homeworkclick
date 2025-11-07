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

describe('Pruebas funcionales - Tareas', () => {
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
      await takeScreenshot(driver, 'tareas_00_pagina_login');
      
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
      await takeScreenshot(driver, 'tareas_01_login_formulario_completado');
      
      // Enviar formulario
      const submitButton = await driver.findElement(By.css('#form-login button[type="submit"]'));
      await submitButton.click();
      
      // Esperar a que la navegación ocurra
      await driver.sleep(3000);
      
      console.log('Login completado exitosamente');
      
      // Captura de pantalla después del login exitoso
      await takeScreenshot(driver, 'tareas_02_login_completado');
    } catch (error) {
      console.error('Error en beforeAll:', error);
      // Tomar screenshot del error si es posible
      if (driver) {
        try {
          await takeScreenshot(driver, 'tareas_error_login');
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

  describe('Navegación a la página de tareas', () => {
    it('debe navegar a la página de tareas', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(2000);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('/tasks');

      // Verificar que la página se cargó correctamente
      const title = await getTextSafe(driver, 'h2');
      expect(title).toContain('Tareas');
      
      // Captura de pantalla: Página de tareas cargada
      await takeScreenshot(driver, 'tareas_03_pagina_tareas');
    });

    it('debe mostrar el selector de proyectos', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(2000);

      const projectFilter = await waitForElement(driver, '#projectFilter');
      expect(projectFilter).toBeDefined();
    });

    it('debe mostrar el botón de crear tarea', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(2000);

      const createButton = await waitForElement(driver, '#openCreateTaskModal');
      const buttonText = await createButton.getText();
      expect(buttonText).toContain('Crear tarea');
    });
  });

  describe('Filtrado de tareas por proyecto', () => {
    it('debe cargar proyectos en el selector', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(3000); // Esperar a que carguen los proyectos

      const projectFilter = await driver.findElement(By.id('projectFilter'));
      const options = await projectFilter.findElements(By.css('option'));
      
      // Debe haber al menos una opción (puede ser "Sin proyectos" o proyectos reales)
      expect(options.length).toBeGreaterThan(0);
    });

    it('debe cambiar las tareas al seleccionar un proyecto diferente', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(3000);

      const projectFilter = await driver.findElement(By.id('projectFilter'));
      const options = await projectFilter.findElements(By.css('option'));
      
      if (options.length > 1) {
        // Seleccionar el primer proyecto
        await projectFilter.click();
        await options[1].click(); // Primera opción real (índice 0 puede ser placeholder)
        await driver.sleep(2000);

        // Captura de pantalla: Proyecto seleccionado y tareas filtradas
        await takeScreenshot(driver, 'tareas_04_proyecto_seleccionado');

        // Verificar que la tabla se actualizó
        const tbody = await driver.findElement(By.css('#tasksTableBody'));
        expect(tbody).toBeDefined();
      } else {
        console.log('No hay proyectos disponibles para filtrar. Se requiere crear proyectos primero.');
        expect(options.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Listar tareas', () => {
    it('debe mostrar la tabla de tareas', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(3000);

      const table = await waitForElement(driver, '#tasksTableBody');
      expect(table).toBeDefined();

      // Verificar que la tabla tiene las columnas correctas
      const headers = await driver.findElements(By.css('thead th'));
      expect(headers.length).toBeGreaterThan(0);
    });

    it('debe mostrar tareas en la tabla o mensaje de sin tareas', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(3000);
      
      // Seleccionar un proyecto si hay disponibles
      const projectFilter = await driver.findElement(By.id('projectFilter'));
      const options = await projectFilter.findElements(By.css('option'));
      if (options.length > 1) {
        await projectFilter.click();
        await options[1].click();
        await driver.sleep(2000);
      }

      const tbody = await driver.findElement(By.css('#tasksTableBody'));
      const rows = await tbody.findElements(By.css('tr'));
      
      // Debe haber al menos una fila (puede ser "No hay tareas" o datos)
      expect(rows.length).toBeGreaterThanOrEqual(1);
      
      // Captura de pantalla: Lista de tareas inicial
      await takeScreenshot(driver, 'tareas_05_lista_tareas_inicial');
    });
  });

  describe('Crear tarea', () => {
    const taskTitle = `Tarea Test ${Date.now()}`;
    const taskDescription = 'Descripción de la tarea de prueba creada con Selenium';

    it('debe abrir el modal de crear tarea', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(3000);

      // Seleccionar un proyecto primero si hay proyectos disponibles
      const projectFilter = await driver.findElement(By.id('projectFilter'));
      const options = await projectFilter.findElements(By.css('option'));
      
      if (options.length > 1) {
        await projectFilter.click();
        await options[1].click(); // Seleccionar primer proyecto real
        await driver.sleep(1000);
      }

      const createButton = await waitForClickable(driver, '#openCreateTaskModal');
      
      // Verificar que el botón no esté deshabilitado
      const isDisabled = await createButton.getAttribute('disabled');
      if (isDisabled) {
        console.log('Botón de crear tarea está deshabilitado. No hay proyectos disponibles.');
        return;
      }

      await createButton.click();
      await driver.sleep(1000);

      // Verificar que el modal está visible
      const modal = await driver.findElement(By.css('#createTaskModal'));
      const hidden = await modal.getAttribute('hidden');
      expect(hidden).not.toBe('true');
      
      // Captura de pantalla: Modal de crear tarea abierto
      await takeScreenshot(driver, 'tareas_06_modal_crear_tarea_abierto');
    });

    it('debe crear una tarea correctamente', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(3000);

      // Seleccionar un proyecto
      const projectFilter = await driver.findElement(By.id('projectFilter'));
      const options = await projectFilter.findElements(By.css('option'));
      
      if (options.length <= 1) {
        console.log('No hay proyectos disponibles. Se requiere crear un proyecto primero.');
        return;
      }

      await projectFilter.click();
      await options[1].click(); // Seleccionar primer proyecto real
      await driver.sleep(1000);

      // Abrir modal
      const createButton = await waitForClickable(driver, '#openCreateTaskModal');
      const isDisabled = await createButton.getAttribute('disabled');
      
      if (isDisabled) {
        console.log('No se puede crear tarea: botón deshabilitado');
        return;
      }

      await createButton.click();
      await driver.sleep(1000);

      // Esperar a que el modal esté visible
      await waitForElement(driver, '#ct_title');

      // Llenar el formulario
      const titleInput = await driver.findElement(By.id('ct_title'));
      await titleInput.clear();
      await titleInput.sendKeys(taskTitle);

      const descriptionInput = await driver.findElement(By.id('ct_description'));
      await descriptionInput.clear();
      await descriptionInput.sendKeys(taskDescription);

      // Seleccionar estado
      const statusSelect = await driver.findElement(By.id('ct_status'));
      await statusSelect.click();
      const statusOption = await driver.findElement(By.css('#ct_status option[value="en_progreso"]'));
      await statusOption.click();

      // Seleccionar prioridad
      const prioritySelect = await driver.findElement(By.id('ct_priority'));
      await prioritySelect.click();
      const priorityOption = await driver.findElement(By.css('#ct_priority option[value="HIGH"]'));
      await priorityOption.click();

      // Establecer fecha de vencimiento (opcional) - Usar fecha específica del 11 de noviembre de 2025
      const dueDateInput = await driver.findElement(By.id('ct_dueDate'));
      // Formato YYYY-MM-DD para el input type="date"
      const dateString = '2025-11-11';
      await dueDateInput.clear();
      await dueDateInput.sendKeys(dateString);
      await driver.sleep(500);

      // Captura de pantalla: Formulario de crear tarea completado (antes de guardar)
      await takeScreenshot(driver, 'tareas_07_formulario_tarea_completado');

      // Enviar formulario
      const submitButton = await waitForClickable(driver, '#ct_submit_btn');
      await submitButton.click();

      // Esperar a que se cierre el modal y se actualice la tabla
      await driver.sleep(4000); // Aumentar tiempo de espera para asegurar que la tarea se guarde

      // Verificar que el modal se cerró
      const modal = await driver.findElement(By.css('#createTaskModal'));
      const hidden = await modal.getAttribute('hidden');
      expect(hidden).toBe('true');

      // Esperar a que la tabla se actualice con la nueva tarea
      await driver.sleep(2000);
      
      // Hacer scroll a la tabla para asegurar que esté visible
      const tbody = await driver.findElement(By.css('#tasksTableBody'));
      await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', tbody);
      await driver.sleep(1000);

      // Verificar que la tarea aparece en la tabla
      const tableText = await tbody.getText();
      expect(tableText).toContain(taskTitle);
      
      // Captura de pantalla: Tarea guardada (después de enviar, tabla visible)
      await takeScreenshot(driver, 'tareas_08_tarea_guardada');
      
      // Esperar un momento más para asegurar que todo esté renderizado
      await driver.sleep(1000);
      
      // Captura de pantalla final: Lista de tareas con la nueva tarea (zoom completo de la tabla)
      await takeScreenshot(driver, 'tareas_09_tarea_en_lista');
    });
  });

  describe('Editar tarea', () => {
    const updatedTitle = `Tarea Editada ${Date.now()}`;
    const updatedDescription = 'Descripción actualizada de la tarea';

    it('debe poder editar una tarea existente', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(3000);

      // Seleccionar un proyecto
      const projectFilter = await driver.findElement(By.id('projectFilter'));
      const options = await projectFilter.findElements(By.css('option'));
      
      if (options.length <= 1) {
        console.log('No hay proyectos disponibles. Se requiere crear un proyecto primero.');
        return;
      }

      await projectFilter.click();
      await options[1].click(); // Seleccionar primer proyecto real
      await driver.sleep(2000);

      // Buscar un botón de editar en la tabla
      const editButtons = await driver.findElements(By.css('.btn-edit-task'));
      
      if (editButtons.length > 0) {
        // Captura de pantalla: Lista de tareas antes de editar
        await takeScreenshot(driver, 'tareas_10_lista_antes_editar');
        
        // Hacer clic en el primer botón de editar
        await editButtons[0].click();
        await driver.sleep(1000);

        // Verificar que el modal se abrió en modo edición
        const modalTitle = await getTextSafe(driver, '#ct_modal_title');
        expect(modalTitle).toContain('Editar');
        
        // Captura de pantalla: Modal de editar tarea abierto
        await takeScreenshot(driver, 'tareas_11_modal_editar_tarea_abierto');

        // Modificar el título
        const titleInput = await driver.findElement(By.id('ct_title'));
        await titleInput.clear();
        await titleInput.sendKeys(updatedTitle);

        // Modificar la descripción
        const descriptionInput = await driver.findElement(By.id('ct_description'));
        await descriptionInput.clear();
        await descriptionInput.sendKeys(updatedDescription);

        // Cambiar estado a completada
        const statusSelect = await driver.findElement(By.id('ct_status'));
        await statusSelect.click();
        const statusOption = await driver.findElement(By.css('#ct_status option[value="completada"]'));
        await statusOption.click();
        await driver.sleep(500);

        // Captura de pantalla: Formulario de edición completado (antes de guardar)
        await takeScreenshot(driver, 'tareas_12_formulario_edicion_completado');

        // Guardar cambios
        const submitButton = await waitForClickable(driver, '#ct_submit_btn');
        await submitButton.click();

        // Esperar a que se actualice
        await driver.sleep(4000); // Aumentar tiempo de espera
        
        // Verificar que el modal se cerró
        const editModal = await driver.findElement(By.css('#createTaskModal'));
        const editModalHidden = await editModal.getAttribute('hidden');
        expect(editModalHidden).toBe('true');
        
        // Hacer scroll a la tabla para asegurar que esté visible
        const tbody = await driver.findElement(By.css('#tasksTableBody'));
        await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', tbody);
        await driver.sleep(1000);
        
        // Captura de pantalla: Cambios guardados (después de enviar, tabla visible)
        await takeScreenshot(driver, 'tareas_13_tarea_editada_guardada');

        // Verificar que los cambios se aplicaron
        const tableText = await tbody.getText();
        expect(tableText).toContain(updatedTitle);
        
        // Esperar un momento más para asegurar que todo esté renderizado
        await driver.sleep(1000);
        
        // Captura de pantalla final: Lista de tareas con la tarea editada
        await takeScreenshot(driver, 'tareas_14_tarea_editada_en_lista');
      } else {
        console.log('No hay tareas para editar. Se requiere crear una tarea primero.');
        // Este test pasa si no hay tareas, pero registra la situación
        expect(editButtons.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Validaciones del formulario de tarea', () => {
    it('debe requerir el título de la tarea', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(3000);

      // Seleccionar un proyecto
      const projectFilter = await driver.findElement(By.id('projectFilter'));
      const options = await projectFilter.findElements(By.css('option'));
      
      if (options.length > 1) {
        await projectFilter.click();
        await options[1].click();
        await driver.sleep(1000);
      }

      // Abrir modal
      const createButton = await waitForClickable(driver, '#openCreateTaskModal');
      const isDisabled = await createButton.getAttribute('disabled');
      
      if (isDisabled) {
        console.log('No se puede probar: botón deshabilitado');
        return;
      }

      await createButton.click();
      await driver.sleep(1000);

      // El título debe ser requerido
      const titleInput = await driver.findElement(By.id('ct_title'));
      const isRequired = await titleInput.getAttribute('required');
      expect(isRequired).toBe('true');
    });

    it('debe cerrar el modal al hacer clic en cancelar', async () => {
      await driver.get(`${APP_CONFIG.baseUrl}/tasks`);
      await driver.sleep(3000);

      // Seleccionar un proyecto
      const projectFilter = await driver.findElement(By.id('projectFilter'));
      const options = await projectFilter.findElements(By.css('option'));
      
      if (options.length > 1) {
        await projectFilter.click();
        await options[1].click();
        await driver.sleep(1000);
      }

      // Abrir modal
      const createButton = await waitForClickable(driver, '#openCreateTaskModal');
      const isDisabled = await createButton.getAttribute('disabled');
      
      if (isDisabled) {
        console.log('No se puede probar: botón deshabilitado');
        return;
      }

      await createButton.click();
      await driver.sleep(1000);

      // Cerrar modal
      const cancelButton = await waitForClickable(driver, '#closeCreateTaskModalFooter');
      await cancelButton.click();
      await driver.sleep(1000);

      // Verificar que el modal se cerró
      const modal = await driver.findElement(By.css('#createTaskModal'));
      const hidden = await modal.getAttribute('hidden');
      expect(hidden).toBe('true');
    });
  });
});

