import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// Configuración de la aplicación
export const APP_CONFIG = {
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:8080',
  timeout: 10000,
  implicitWait: 3000
};

// Credenciales de prueba (ajustar según tu base de datos)
export const TEST_CREDENTIALS = {
  admin: {
    email: 'pruebabase@gmail.com',
    password: '12345678**',
    role: 'admin'
  },
  user: {
    email: 'user@test.com',
    password: 'User123!',
    role: 'user'
  }
};

/**
 * Crea y configura el driver de Selenium
 */
export async function createDriver() {
  try {
    const options = new chrome.Options();
    // options.addArguments('--headless'); // Descomentar para ejecutar sin interfaz gráfica
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-software-rasterizer');

    console.log('Intentando crear driver de Chrome...');
    
    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    console.log('Driver creado, maximizando ventana...');
    driver.manage().window().maximize();
    
    driver.manage().setTimeouts({
      implicit: APP_CONFIG.implicitWait,
      pageLoad: APP_CONFIG.timeout,
      script: 30000
    });

    console.log('Driver configurado exitosamente');
    return driver;
  } catch (error) {
    console.error('Error al crear driver de Selenium:', error.message);
    console.error('Asegúrate de que:');
    console.error('1. Chrome/Chromium está instalado');
    console.error('2. ChromeDriver está en el PATH o Selenium puede descargarlo automáticamente');
    throw error;
  }
}

/**
 * Cierra el driver
 */
export async function closeDriver(driver) {
  if (driver) {
    await driver.quit();
  }
}

/**
 * Espera a que un elemento sea visible
 */
export async function waitForElement(driver, selector, timeout = APP_CONFIG.timeout) {
  return await driver.wait(
    until.elementLocated(By.css(selector)),
    timeout,
    `Elemento ${selector} no encontrado en ${timeout}ms`
  );
}

/**
 * Espera a que un elemento sea clickeable
 */
export async function waitForClickable(driver, selector, timeout = APP_CONFIG.timeout) {
  const element = await waitForElement(driver, selector, timeout);
  return await driver.wait(
    until.elementIsVisible(element),
    timeout,
    `Elemento ${selector} no es clickeable en ${timeout}ms`
  );
}

/**
 * Espera a que el texto aparezca en un elemento
 */
export async function waitForText(driver, selector, text, timeout = APP_CONFIG.timeout) {
  await driver.wait(async () => {
    try {
      const element = await driver.findElement(By.css(selector));
      const elementText = await element.getText();
      return elementText.includes(text);
    } catch {
      return false;
    }
  }, timeout);
}

/**
 * Realiza login en la aplicación
 */
export async function login(driver, email, password, role = 'admin') {
  try {
    console.log(`Intentando login con email: ${email}`);
    
    // Navegar a la página de login
    console.log(`Navegando a ${APP_CONFIG.baseUrl}/login...`);
    await driver.get(`${APP_CONFIG.baseUrl}/login`);
    
    // Esperar un momento para que la página cargue
    await driver.sleep(2000);

    // Esperar a que el formulario de login esté visible
    console.log('Esperando formulario de login...');
    await waitForElement(driver, '#form-login', 15000);

    // Ingresar email
    console.log('Ingresando email...');
    const emailInput = await driver.findElement(By.id('correo'));
    await emailInput.clear();
    await emailInput.sendKeys(email);

    // Ingresar contraseña
    console.log('Ingresando contraseña...');
    const passwordInput = await driver.findElement(By.id('contraseña'));
    await passwordInput.clear();
    await passwordInput.sendKeys(password);

    // Seleccionar rol si existe el selector
    try {
      console.log('Seleccionando rol...');
      const roleSelect = await driver.findElement(By.id('role'));
      await roleSelect.click();
      await driver.sleep(500);
      const roleOption = await driver.findElement(By.css(`#role option[value="${role}"]`));
      await roleOption.click();
      await driver.sleep(500);
    } catch (error) {
      console.log('Selector de rol no encontrado, continuando sin seleccionar rol...');
    }

    // Enviar formulario
    console.log('Enviando formulario de login...');
    const submitButton = await driver.findElement(By.css('#form-login button[type="submit"]'));
    await submitButton.click();

    // Esperar a que la navegación ocurra (redirige a /chatbot o /admin según el código)
    console.log('Esperando redirección después del login...');
    await driver.sleep(3000); // Aumentar tiempo de espera

    // Verificar que el login fue exitoso (puede estar en /chatbot, /admin o /user)
    const currentUrl = await driver.getCurrentUrl();
    console.log(`Login completado. URL actual: ${currentUrl}`);
    
    // Verificar que no estamos todavía en la página de login
    if (currentUrl.includes('/login')) {
      console.warn('Aún estamos en la página de login. Verifica las credenciales.');
      // Esperar un poco más por si acaso
      await driver.sleep(2000);
    }
    
    return true;
  } catch (error) {
    console.error('Error durante el login:', error.message);
    const currentUrl = await driver.getCurrentUrl();
    console.error(`URL actual: ${currentUrl}`);
    throw error;
  }
}

/**
 * Espera a que el modal esté visible
 */
export async function waitForModal(driver, modalSelector, timeout = APP_CONFIG.timeout) {
  await driver.wait(async () => {
    try {
      const modal = await driver.findElement(By.css(modalSelector));
      const isDisplayed = await modal.isDisplayed();
      const hidden = await modal.getAttribute('hidden');
      return isDisplayed && hidden !== 'true';
    } catch {
      return false;
    }
  }, timeout);
}

/**
 * Cierra un modal haciendo clic en el botón de cerrar
 */
export async function closeModal(driver, closeButtonSelector) {
  try {
    const closeButton = await waitForClickable(driver, closeButtonSelector);
    await closeButton.click();
    await driver.sleep(500); // Esperar a que se cierre
  } catch (error) {
    console.log(`Error al cerrar modal: ${error.message}`);
  }
}

/**
 * Espera a que la tabla tenga datos
 */
export async function waitForTableData(driver, tableBodySelector, timeout = APP_CONFIG.timeout) {
  await driver.wait(async () => {
    try {
      const tbody = await driver.findElement(By.css(tableBodySelector));
      const rows = await tbody.findElements(By.css('tr'));
      return rows.length > 0;
    } catch {
      return false;
    }
  }, timeout);
}

/**
 * Obtiene el texto de un elemento de forma segura
 */
export async function getTextSafe(driver, selector, defaultValue = '') {
  try {
    const element = await driver.findElement(By.css(selector));
    return await element.getText();
  } catch {
    return defaultValue;
  }
}

/**
 * Realiza scroll a un elemento
 */
export async function scrollToElement(driver, selector) {
  const element = await driver.findElement(By.css(selector));
  await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', element);
  await driver.sleep(500);
}

/**
 * Hace scroll a la parte superior de la página
 */
export async function scrollToTop(driver) {
  await driver.executeScript('window.scrollTo({top: 0, behavior: "smooth"});');
  await driver.sleep(500);
}

/**
 * Hace scroll a la parte inferior de la página
 */
export async function scrollToBottom(driver) {
  await driver.executeScript('window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"});');
  await driver.sleep(500);
}

/**
 * Toma una captura de pantalla y la guarda
 * @param {WebDriver} driver - El driver de Selenium
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @returns {Promise<string>} - Ruta del archivo guardado
 */
export async function takeScreenshot(driver, filename) {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Crear directorio de screenshots si no existe
    const screenshotsDir = path.resolve(process.cwd(), 'screenshots');
    try {
      await fs.access(screenshotsDir);
    } catch {
      await fs.mkdir(screenshotsDir, { recursive: true });
    }
    
    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotPath = path.join(screenshotsDir, `${filename}_${timestamp}.png`);
    
    // Tomar captura de pantalla
    const screenshot = await driver.takeScreenshot();
    const base64Data = screenshot.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Guardar archivo
    await fs.writeFile(screenshotPath, buffer);
    console.log(`📸 Captura de pantalla guardada: ${screenshotPath}`);
    
    return screenshotPath;
  } catch (error) {
    console.error(`Error al tomar captura de pantalla: ${error.message}`);
    // Intentar tomar screenshot de forma básica
    try {
      const screenshot = await driver.takeScreenshot();
      console.log(`📸 Screenshot tomado (base64), pero no se pudo guardar: ${error.message}`);
      return screenshot;
    } catch (err) {
      console.error(`Error crítico al tomar screenshot: ${err.message}`);
      return null;
    }
  }
}

