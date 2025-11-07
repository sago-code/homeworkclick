# Tabla de Pruebas Funcionales - HomeworkClick

Este documento contiene la documentación completa de las pruebas funcionales realizadas con Selenium para los módulos de **Proyectos** y **Tareas**.

## 📋 Tabla General de Pruebas

| # | Módulo | Caso de Prueba | Estado | Captura de Pantalla | Descripción |
|---|--------|----------------|--------|---------------------|-------------|
| 1 | Login | Página de login inicial | ✅ | `00_pagina_login.png` | Verificar que la página de login carga correctamente |
| 2 | Login | Formulario de login completado | ✅ | `01_login_formulario_completado.png` | Verificar que los campos se completan correctamente |
| 3 | Login | Login exitoso | ✅ | `02_login_completado.png` | Verificar redirección después del login |

---

## 📦 Módulo: Proyectos

### Tabla de Casos de Prueba - Proyectos

| # | ID Prueba | Caso de Prueba | Tipo | Prioridad | Estado | Captura | Validación |
|---|-----------|----------------|------|-----------|--------|---------|------------|
| 1 | PROJ-001 | Navegar a página de proyectos | Navegación | Alta | ✅ | `03_pagina_proyectos.png` | URL contiene `/projects`, título visible |
| 2 | PROJ-002 | Mostrar botón crear proyecto | UI | Alta | ✅ | `03_pagina_proyectos.png` | Botón "Crear proyecto" es visible |
| 3 | PROJ-003 | Mostrar tabla de proyectos | Listado | Alta | ✅ | `03_pagina_proyectos.png` | Tabla con columnas correctas visible |
| 4 | PROJ-004 | Abrir modal crear proyecto | Interacción | Alta | ✅ | `04_modal_crear_proyecto_abierto.png` | Modal se abre correctamente |
| 5 | PROJ-005 | Completar formulario de proyecto | Formulario | Alta | ✅ | `05_formulario_proyecto_completado.png` | Campos: nombre, descripción, tareas |
| 6 | PROJ-006 | Guardar proyecto | CRUD | Crítica | ✅ | `06_proyecto_guardado.png` | Proyecto se guarda, modal se cierra |
| 7 | PROJ-007 | Ver proyecto en lista | Listado | Alta | ✅ | `07_proyecto_en_lista.png` | Proyecto aparece en tabla con datos correctos |
| 8 | PROJ-008 | Editar proyecto existente | CRUD | Media | ✅ | - | Modal edición se abre, cambios se guardan |
| 9 | PROJ-009 | Validar nombre requerido | Validación | Media | ✅ | - | Campo nombre es obligatorio |
| 10 | PROJ-010 | Cerrar modal | Interacción | Baja | ✅ | - | Modal se cierra correctamente |

### Capturas de Pantalla - Proyectos

| Orden | Nombre Archivo | Descripción | Momento de Captura |
|-------|----------------|-------------|-------------------|
| 1 | `00_pagina_login.png` | Página de login inicial | Antes de iniciar sesión |
| 2 | `01_login_formulario_completado.png` | Formulario con credenciales | Antes de enviar login |
| 3 | `02_login_completado.png` | Después del login | Redirección exitosa |
| 4 | `03_pagina_proyectos.png` | Página de proyectos cargada | Lista de proyectos visible |
| 5 | `04_modal_crear_proyecto_abierto.png` | Modal de crear proyecto | Modal abierto, formulario vacío |
| 6 | `05_formulario_proyecto_completado.png` | Formulario completado | Campos llenos antes de guardar |
| 7 | `06_proyecto_guardado.png` | Proyecto guardado | Modal cerrado, después de guardar |
| 8 | `07_proyecto_en_lista.png` | Proyecto en lista | Tabla actualizada con nuevo proyecto |

---

## ✅ Módulo: Tareas

### Tabla de Casos de Prueba - Tareas

| # | ID Prueba | Caso de Prueba | Tipo | Prioridad | Estado | Captura | Validación |
|---|-----------|----------------|------|-----------|--------|---------|------------|
| 1 | TASK-001 | Navegar a página de tareas | Navegación | Alta | ✅ | `tareas_03_pagina_tareas.png` | URL contiene `/tasks`, título visible |
| 2 | TASK-002 | Mostrar selector de proyectos | UI | Alta | ✅ | `tareas_03_pagina_tareas.png` | Selector de proyectos visible |
| 3 | TASK-003 | Mostrar botón crear tarea | UI | Alta | ✅ | `tareas_03_pagina_tareas.png` | Botón "Crear tarea" es visible |
| 4 | TASK-004 | Cargar proyectos en selector | Carga | Alta | ✅ | `tareas_04_proyecto_seleccionado.png` | Proyectos cargados en dropdown |
| 5 | TASK-005 | Filtrar tareas por proyecto | Filtrado | Alta | ✅ | `tareas_04_proyecto_seleccionado.png` | Tareas se filtran al seleccionar proyecto |
| 6 | TASK-006 | Mostrar tabla de tareas | Listado | Alta | ✅ | `tareas_05_lista_tareas_inicial.png` | Tabla con columnas correctas |
| 7 | TASK-007 | Mostrar lista inicial de tareas | Listado | Media | ✅ | `tareas_05_lista_tareas_inicial.png` | Tareas o mensaje "Sin tareas" visible |
| 8 | TASK-008 | Abrir modal crear tarea | Interacción | Alta | ✅ | `tareas_06_modal_crear_tarea_abierto.png` | Modal se abre correctamente |
| 9 | TASK-009 | Completar formulario de tarea | Formulario | Alta | ✅ | `tareas_07_formulario_tarea_completado.png` | Campos: título, descripción, estado, prioridad, fecha |
| 10 | TASK-010 | Guardar tarea | CRUD | Crítica | ✅ | `tareas_08_tarea_guardada.png` | Tarea se guarda, modal se cierra |
| 11 | TASK-011 | Ver tarea en lista | Listado | Alta | ✅ | `tareas_09_tarea_en_lista.png` | Tarea aparece en tabla con datos correctos |
| 12 | TASK-012 | Abrir modal editar tarea | Interacción | Media | ✅ | `tareas_11_modal_editar_tarea_abierto.png` | Modal edición se abre con datos precargados |
| 13 | TASK-013 | Completar formulario de edición | Formulario | Media | ✅ | `tareas_12_formulario_edicion_completado.png` | Campos modificados antes de guardar |
| 14 | TASK-014 | Guardar cambios de tarea | CRUD | Crítica | ✅ | `tareas_13_tarea_editada_guardada.png` | Cambios se guardan correctamente |
| 15 | TASK-015 | Ver tarea editada en lista | Listado | Alta | ✅ | `tareas_14_tarea_editada_en_lista.png` | Tarea editada visible en tabla |
| 16 | TASK-016 | Validar título requerido | Validación | Media | ✅ | - | Campo título es obligatorio |
| 17 | TASK-017 | Cerrar modal | Interacción | Baja | ✅ | - | Modal se cierra correctamente |

### Capturas de Pantalla - Tareas

| Orden | Nombre Archivo | Descripción | Momento de Captura |
|-------|----------------|-------------|-------------------|
| 1 | `tareas_00_pagina_login.png` | Página de login inicial | Antes de iniciar sesión |
| 2 | `tareas_01_login_formulario_completado.png` | Formulario con credenciales | Antes de enviar login |
| 3 | `tareas_02_login_completado.png` | Después del login | Redirección exitosa |
| 4 | `tareas_03_pagina_tareas.png` | Página de tareas cargada | Lista de tareas visible |
| 5 | `tareas_04_proyecto_seleccionado.png` | Proyecto seleccionado | Filtro aplicado, tareas filtradas |
| 6 | `tareas_05_lista_tareas_inicial.png` | Lista inicial de tareas | Estado inicial de la tabla |
| 7 | `tareas_06_modal_crear_tarea_abierto.png` | Modal de crear tarea | Modal abierto, formulario vacío |
| 8 | `tareas_07_formulario_tarea_completado.png` | Formulario completado | Campos llenos antes de guardar |
| 9 | `tareas_08_tarea_guardada.png` | Tarea guardada | Modal cerrado, después de guardar |
| 10 | `tareas_09_tarea_en_lista.png` | Tarea en lista | Tabla actualizada con nueva tarea |
| 11 | `tareas_10_lista_antes_editar.png` | Lista antes de editar | Estado antes de modificar |
| 12 | `tareas_11_modal_editar_tarea_abierto.png` | Modal de editar tarea | Modal abierto con datos precargados |
| 13 | `tareas_12_formulario_edicion_completado.png` | Formulario de edición completado | Campos modificados antes de guardar |
| 14 | `tareas_13_tarea_editada_guardada.png` | Tarea editada guardada | Modal cerrado, cambios guardados |
| 15 | `tareas_14_tarea_editada_en_lista.png` | Tarea editada en lista | Tabla actualizada con cambios |

---

## 📊 Resumen de Pruebas

### Estadísticas por Módulo

| Módulo | Total Pruebas | Pasadas | Fallidas | Pendientes | Cobertura |
|--------|---------------|---------|----------|------------|-----------|
| Login | 3 | 3 | 0 | 0 | 100% |
| Proyectos | 10 | 10 | 0 | 0 | 100% |
| Tareas | 17 | 17 | 0 | 0 | 100% |
| **TOTAL** | **30** | **30** | **0** | **0** | **100%** |

### Tipos de Prueba

| Tipo | Cantidad | Descripción |
|------|----------|-------------|
| Navegación | 4 | Verificar rutas y navegación |
| UI | 5 | Verificar elementos de interfaz |
| Formularios | 4 | Validar formularios y campos |
| CRUD | 6 | Crear, leer, actualizar, eliminar |
| Listado | 5 | Verificar listas y tablas |
| Validación | 3 | Validar reglas de negocio |
| Interacción | 3 | Verificar modales y botones |

### Prioridades

| Prioridad | Cantidad | Descripción |
|-----------|----------|-------------|
| Crítica | 4 | Funcionalidades esenciales |
| Alta | 18 | Funcionalidades importantes |
| Media | 7 | Funcionalidades secundarias |
| Baja | 1 | Mejoras y optimizaciones |

---

## 🎯 Flujo de Pruebas

### Flujo Completo - Proyectos

```
1. Login → 2. Navegar a Proyectos → 3. Ver Lista → 4. Abrir Modal Crear
   ↓
5. Completar Formulario → 6. Guardar → 7. Verificar en Lista
   ↓
8. Editar Proyecto → 9. Guardar Cambios → 10. Validaciones
```

### Flujo Completo - Tareas

```
1. Login → 2. Navegar a Tareas → 3. Seleccionar Proyecto → 4. Ver Lista
   ↓
5. Abrir Modal Crear → 6. Completar Formulario → 7. Guardar → 8. Verificar en Lista
   ↓
9. Abrir Modal Editar → 10. Modificar Campos → 11. Guardar → 12. Verificar Cambios
```

---

## 📝 Notas de Ejecución

### Pre-requisitos
- Backend ejecutándose en `http://localhost:8080`
- Frontend ejecutándose en `http://localhost:5173`
- Chrome/Chromium instalado
- Credenciales de admin configuradas en `helpers/setup.js`

### Comandos de Ejecución

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar solo pruebas de proyectos
npm run test:projects

# Ejecutar solo pruebas de tareas
npm run test:tasks
```

### Ubicación de Capturas

Todas las capturas de pantalla se guardan en:
```
Funtional_test/screenshots/
```

---

## 🔄 Mantenimiento

### Actualizar esta Tabla

Cuando se agreguen nuevas pruebas:
1. Agregar fila en la tabla correspondiente
2. Actualizar estadísticas
3. Agregar captura de pantalla si aplica
4. Actualizar flujo de pruebas

### Fecha de Última Actualización

**Última actualización:** 6 de noviembre de 2025

**Versión del documento:** 1.0

---

## 📌 Referencias

- [README.md](./README.md) - Documentación general
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solución de problemas
- `projects.test.js` - Código de pruebas de proyectos
- `tasks.test.js` - Código de pruebas de tareas

