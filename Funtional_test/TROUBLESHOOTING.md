# Solución de Problemas - Pruebas Funcionales

## Error: Timeout en beforeAll

Si ves errores de timeout al ejecutar las pruebas, verifica lo siguiente:

### 1. Verificar que los servidores estén ejecutándose

**Backend:**
```bash
# En otra terminal, desde la raíz del proyecto:
cd backend
mvn spring-boot:run
```

**Frontend:**
```bash
# En otra terminal, desde la raíz del proyecto:
npm run dev
```

Asegúrate de que:
- Backend esté corriendo en `http://localhost:8080`
- Frontend esté corriendo en `http://localhost:5173`

### 2. Verificar ChromeDriver

Selenium WebDriver debería descargar ChromeDriver automáticamente. Si tienes problemas:

**Windows:**
- Asegúrate de tener Chrome instalado
- Si es necesario, descarga ChromeDriver desde: https://chromedriver.chromium.org/downloads
- Agrega ChromeDriver al PATH o colócalo en la carpeta del proyecto

**Verificar versión de Chrome:**
```bash
# En PowerShell:
Get-ItemProperty "HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Google Chrome" | Select-Object version
```

### 3. Verificar credenciales

Edita `helpers/setup.js` y verifica que las credenciales sean correctas:

```javascript
export const TEST_CREDENTIALS = {
  admin: {
    email: 'tu-email@ejemplo.com',  // Cambiar por tu email real
    password: 'TuContraseña123!',    // Cambiar por tu contraseña real
    role: 'admin'
  }
};
```

### 4. Ejecutar una prueba simple

Crea un archivo `test-simple.js` para verificar que Selenium funciona:

```javascript
import { createDriver, closeDriver } from './helpers/setup.js';

async function testSimple() {
  let driver;
  try {
    console.log('Creando driver...');
    driver = await createDriver();
    console.log('Driver creado exitosamente');
    
    console.log('Navegando a Google...');
    await driver.get('https://www.google.com');
    console.log('Navegación exitosa');
    
    const title = await driver.getTitle();
    console.log(`Título de la página: ${title}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (driver) {
      await closeDriver(driver);
    }
  }
}

testSimple();
```

Ejecuta:
```bash
node test-simple.js
```

### 5. Modo Headless

Si tienes problemas con la interfaz gráfica, puedes habilitar el modo headless editando `helpers/setup.js`:

```javascript
options.addArguments('--headless'); // Descomentar esta línea
```

### 6. Aumentar timeouts

Si los servidores son lentos, puedes aumentar los timeouts en `helpers/setup.js`:

```javascript
export const APP_CONFIG = {
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:8080',
  timeout: 20000,      // Aumentar de 10000 a 20000
  implicitWait: 5000   // Aumentar de 3000 a 5000
};
```

## Error: No se puede encontrar Chrome

**Solución:**
1. Instala Google Chrome desde: https://www.google.com/chrome/
2. Reinicia tu terminal
3. Vuelve a ejecutar las pruebas

## Error: Connection refused

**Solución:**
1. Verifica que el backend esté corriendo en el puerto 8080:
   ```bash
   curl http://localhost:8080/webhook/health
   ```

2. Verifica que el frontend esté corriendo en el puerto 5173:
   ```bash
   curl http://localhost:5173
   ```

## Error: Elemento no encontrado

**Solución:**
1. Verifica que la aplicación esté cargada correctamente
2. Aumenta los timeouts en `helpers/setup.js`
3. Verifica que los selectores CSS sean correctos (pueden haber cambiado en el HTML)

## Logs útiles

Las pruebas ahora incluyen logs detallados. Busca en la salida:

- `Driver de Selenium creado exitosamente` - Driver funciona
- `Login completado exitosamente` - Login funciona
- `URL actual: ...` - Muestra dónde está el navegador

## Contacto

Si sigues teniendo problemas, verifica:
1. Versión de Node.js (debe ser 18 o superior)
2. Versión de Chrome
3. Que todos los servicios estén ejecutándose
4. Los logs de error en la consola

