# Pruebas Funcionales con Selenium - HomeworkClick

Este directorio contiene las pruebas funcionales automatizadas con Selenium para las funcionalidades de **Proyectos** y **Tareas** de la aplicación HomeworkClick.

## 📊 Documentación de Pruebas

Para ver la documentación completa de las pruebas funcionales con tablas detalladas:
- **[PRUEBAS_FUNCIONALES.md](./PRUEBAS_FUNCIONALES.md)** - Documentación completa con tablas de casos de prueba
- **[TABLA_RESUMEN.md](./TABLA_RESUMEN.md)** - Tabla resumen ejecutivo de todas las pruebas

## 📋 Requisitos Previos

1. **Node.js** (versión 18 o superior)
2. **Chrome/Chromium** instalado en el sistema
3. **ChromeDriver** (se descarga automáticamente con Selenium WebDriver)
4. **Backend** de HomeworkClick ejecutándose en `http://localhost:8080`
5. **Frontend** de HomeworkClick ejecutándose en `http://localhost:5173`

## 🚀 Instalación

1. **Instalar dependencias:**
   ```bash
   cd Funtional_test
   npm install
   ```

2. **Configurar credenciales de prueba:**
   
   Edita el archivo `helpers/setup.js` y actualiza las credenciales en `TEST_CREDENTIALS`:
   ```javascript
   export const TEST_CREDENTIALS = {
     admin: {
       email: 'admin@test.com',      // Cambiar por tu email de admin
       password: 'Admin123!',         // Cambiar por tu contraseña de admin
       role: 'admin'
     },
     user: {
       email: 'user@test.com',        // Cambiar por tu email de usuario
       password: 'User123!',          // Cambiar por tu contraseña de usuario
       role: 'user'
     }
   };
   ```

## ▶️ Ejecución de las Pruebas

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar solo pruebas de proyectos
```bash
npm run test:projects
```

### Ejecutar solo pruebas de tareas
```bash
npm run test:tasks
```

## 📸 Capturas de Pantalla

Las pruebas automáticamente toman capturas de pantalla en los siguientes momentos:

### Proyectos:
1. **00_pagina_login.png** - Página de login inicial
2. **01_login_formulario_completado.png** - Formulario de login con credenciales ingresadas (antes de enviar)
3. **02_login_completado.png** - Después de realizar el login exitoso y redirección
4. **03_pagina_proyectos.png** - Página de proyectos cargada
5. **04_modal_crear_proyecto_abierto.png** - Modal de crear proyecto abierto
6. **05_formulario_proyecto_completado.png** - Formulario de proyecto completado antes de guardar
7. **06_proyecto_guardado.png** - Después de guardar el proyecto (modal cerrado)
8. **07_proyecto_en_lista.png** - Lista de proyectos mostrando el nuevo proyecto guardado

Las capturas se guardan en la carpeta `screenshots/` con un timestamp para identificar cada ejecución.

## 🗑️ Gestión de Capturas de Pantalla

### Eliminar todas las capturas
```bash
npm run clean:screenshots
```

### Eliminar una captura específica (interactivo)
```bash
npm run delete:screenshot
```

Este comando te permitirá:
- Ver todas las capturas disponibles con su tamaño
- Seleccionar por número
- Buscar por nombre parcial (ej: "tareas_07", "proyectos_05")
- Eliminar una o todas las capturas

### Eliminar manualmente
También puedes eliminar capturas manualmente desde:
```
Funtional_test/screenshots/
```

### Tareas (`tasks.test.js`):
1. **tareas_00_pagina_login.png** - Página de login inicial
2. **tareas_01_login_formulario_completado.png** - Formulario de login con credenciales ingresadas (antes de enviar)
3. **tareas_02_login_completado.png** - Después de realizar el login exitoso y redirección
4. **tareas_03_pagina_tareas.png** - Página de tareas cargada
5. **tareas_04_proyecto_seleccionado.png** - Proyecto seleccionado en el filtro
6. **tareas_05_lista_tareas_inicial.png** - Lista inicial de tareas
7. **tareas_06_modal_crear_tarea_abierto.png** - Modal de crear tarea abierto
8. **tareas_07_formulario_tarea_completado.png** - Formulario de tarea completado antes de guardar
9. **tareas_08_tarea_guardada.png** - Después de guardar la tarea (modal cerrado)
10. **tareas_09_tarea_en_lista.png** - Lista de tareas mostrando la nueva tarea guardada
11. **tareas_10_lista_antes_editar.png** - Lista de tareas antes de editar
12. **tareas_11_modal_editar_tarea_abierto.png** - Modal de editar tarea abierto
13. **tareas_12_formulario_edicion_completado.png** - Formulario de edición completado antes de guardar
14. **tareas_13_tarea_editada_guardada.png** - Después de guardar los cambios de edición
15. **tareas_14_tarea_editada_en_lista.png** - Lista de tareas mostrando la tarea editada

## 📁 Estructura del Proyecto

```
Funtional_test/
├── helpers/
│   └── setup.js              # Configuración y funciones auxiliares de Selenium
├── projects.test.js          # Pruebas funcionales para proyectos
├── tasks.test.js             # Pruebas funcionales para tareas
├── package.json              # Dependencias del proyecto
├── jest.config.js            # Configuración de Jest
└── README.md                 # Este archivo
```

## 🧪 Casos de Prueba Implementados

### Proyectos (`projects.test.js`)

1. **Navegación**
   - ✅ Navegar a la página de proyectos
   - ✅ Verificar que el botón de crear proyecto es visible

2. **Listar proyectos**
   - ✅ Mostrar la tabla de proyectos
   - ✅ Verificar que se muestran proyectos o mensaje de "Sin proyectos"

3. **Crear proyecto**
   - ✅ Abrir el modal de crear proyecto
   - ✅ Crear un proyecto con nombre, descripción y tareas iniciales
   - ✅ Verificar que el proyecto aparece en la tabla después de crearlo

4. **Editar proyecto**
   - ✅ Editar nombre y descripción de un proyecto existente
   - ✅ Verificar que los cambios se aplican correctamente

5. **Validaciones**
   - ✅ Validar que el nombre del proyecto es obligatorio
   - ✅ Verificar que el modal se cierra correctamente

### Tareas (`tasks.test.js`)

1. **Navegación**
   - ✅ Navegar a la página de tareas
   - ✅ Verificar que el selector de proyectos es visible
   - ✅ Verificar que el botón de crear tarea es visible

2. **Filtrado**
   - ✅ Cargar proyectos en el selector
   - ✅ Cambiar las tareas al seleccionar un proyecto diferente

3. **Listar tareas**
   - ✅ Mostrar la tabla de tareas
   - ✅ Verificar que se muestran tareas o mensaje de "No hay tareas"

4. **Crear tarea**
   - ✅ Abrir el modal de crear tarea
   - ✅ Crear una tarea con título, descripción, estado, prioridad y fecha de vencimiento
   - ✅ Verificar que la tarea aparece en la tabla después de crearla

5. **Editar tarea**
   - ✅ Editar título, descripción y estado de una tarea existente
   - ✅ Verificar que los cambios se aplican correctamente

6. **Validaciones**
   - ✅ Validar que el título de la tarea es obligatorio
   - ✅ Verificar que el modal se cierra correctamente

## ⚙️ Configuración

### Modo Headless (sin interfaz gráfica)

Para ejecutar las pruebas sin abrir el navegador, edita `helpers/setup.js` y descomenta la línea:

```javascript
options.addArguments('--headless');
```

### Timeouts

Los timeouts están configurados en `helpers/setup.js`:

```javascript
export const APP_CONFIG = {
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:8080',
  timeout: 10000,        // Timeout general en milisegundos
  implicitWait: 3000     // Espera implícita en milisegundos
};
```

## 🔧 Solución de Problemas

### Error: "ChromeDriver not found"
- Selenium WebDriver debería descargar ChromeDriver automáticamente. Si no, descarga ChromeDriver manualmente desde [ChromeDriver Downloads](https://chromedriver.chromium.org/downloads) y agrégalo al PATH.

### Error: "Connection refused"
- Asegúrate de que el backend esté ejecutándose en `http://localhost:8080`
- Asegúrate de que el frontend esté ejecutándose en `http://localhost:5173`

### Las pruebas fallan por credenciales
- Verifica que las credenciales en `helpers/setup.js` sean correctas
- Asegúrate de que exista un usuario administrador en la base de datos con esas credenciales

### Las pruebas fallan porque no hay proyectos/tareas
- Algunas pruebas requieren que existan proyectos o tareas en la base de datos
- Puedes crear datos de prueba manualmente o ejecutar primero las pruebas de creación

## 📝 Notas

- Las pruebas asumen que tienes al menos un usuario administrador en la base de datos
- Las pruebas de edición solo funcionan si existen proyectos/tareas previos
- Los timeouts pueden necesitar ajustarse según la velocidad de tu sistema
- Las pruebas crean datos de prueba con timestamps para evitar conflictos

## 🤝 Contribuir

Si deseas agregar más pruebas funcionales:

1. Crea un nuevo archivo `*.test.js` en el directorio raíz
2. Importa las funciones auxiliares de `helpers/setup.js`
3. Sigue la estructura de los tests existentes
4. Agrega documentación en este README

## 📄 Licencia

ISC License

