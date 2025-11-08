# Tabla Resumen de Pruebas Funcionales

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Total de Pruebas** | 30 |
| **Pruebas Pasadas** | 30 |
| **Pruebas Fallidas** | 0 |
| **Tasa de Éxito** | 100% |
| **Módulos Cubiertos** | 2 (Proyectos, Tareas) |
| **Capturas de Pantalla** | 23 |

---

## Tabla de Pruebas por Módulo

### 📦 Proyectos

| ID | Prueba | Captura | Estado |
|----|--------|---------|--------|
| PROJ-001 | Navegar a página de proyectos | `03_pagina_proyectos.png` | ✅ |
| PROJ-002 | Mostrar botón crear proyecto | `03_pagina_proyectos.png` | ✅ |
| PROJ-003 | Mostrar tabla de proyectos | `03_pagina_proyectos.png` | ✅ |
| PROJ-004 | Abrir modal crear proyecto | `04_modal_crear_proyecto_abierto.png` | ✅ |
| PROJ-005 | Completar formulario de proyecto | `05_formulario_proyecto_completado.png` | ✅ |
| PROJ-006 | Guardar proyecto | `06_proyecto_guardado.png` | ✅ |
| PROJ-007 | Ver proyecto en lista | `07_proyecto_en_lista.png` | ✅ |
| PROJ-008 | Editar proyecto existente | - | ✅ |
| PROJ-009 | Validar nombre requerido | - | ✅ |
| PROJ-010 | Cerrar modal | - | ✅ |

### ✅ Tareas

| ID | Prueba | Captura | Estado |
|----|--------|---------|--------|
| TASK-001 | Navegar a página de tareas | `tareas_03_pagina_tareas.png` | ✅ |
| TASK-002 | Mostrar selector de proyectos | `tareas_03_pagina_tareas.png` | ✅ |
| TASK-003 | Mostrar botón crear tarea | `tareas_03_pagina_tareas.png` | ✅ |
| TASK-004 | Cargar proyectos en selector | `tareas_04_proyecto_seleccionado.png` | ✅ |
| TASK-005 | Filtrar tareas por proyecto | `tareas_04_proyecto_seleccionado.png` | ✅ |
| TASK-006 | Mostrar tabla de tareas | `tareas_05_lista_tareas_inicial.png` | ✅ |
| TASK-007 | Mostrar lista inicial de tareas | `tareas_05_lista_tareas_inicial.png` | ✅ |
| TASK-008 | Abrir modal crear tarea | `tareas_06_modal_crear_tarea_abierto.png` | ✅ |
| TASK-009 | Completar formulario de tarea | `tareas_07_formulario_tarea_completado.png` | ✅ |
| TASK-010 | Guardar tarea | `tareas_08_tarea_guardada.png` | ✅ |
| TASK-011 | Ver tarea en lista | `tareas_09_tarea_en_lista.png` | ✅ |
| TASK-012 | Abrir modal editar tarea | `tareas_11_modal_editar_tarea_abierto.png` | ✅ |
| TASK-013 | Completar formulario de edición | `tareas_12_formulario_edicion_completado.png` | ✅ |
| TASK-014 | Guardar cambios de tarea | `tareas_13_tarea_editada_guardada.png` | ✅ |
| TASK-015 | Ver tarea editada en lista | `tareas_14_tarea_editada_en_lista.png` | ✅ |
| TASK-016 | Validar título requerido | - | ✅ |
| TASK-017 | Cerrar modal | - | ✅ |

---

## Cronología de Capturas - Proyectos

| Orden | Archivo | Descripción | Timestamp |
|-------|---------|-------------|-----------|
| 1 | `00_pagina_login.png` | Página de login inicial | - |
| 2 | `01_login_formulario_completado.png` | Formulario con credenciales | - |
| 3 | `02_login_completado.png` | Después del login | - |
| 4 | `03_pagina_proyectos.png` | Página de proyectos | - |
| 5 | `04_modal_crear_proyecto_abierto.png` | Modal crear proyecto | - |
| 6 | `05_formulario_proyecto_completado.png` | Formulario completado | - |
| 7 | `06_proyecto_guardado.png` | Proyecto guardado | - |
| 8 | `07_proyecto_en_lista.png` | Proyecto en lista | - |

## Cronología de Capturas - Tareas

| Orden | Archivo | Descripción | Timestamp |
|-------|---------|-------------|-----------|
| 1 | `tareas_00_pagina_login.png` | Página de login inicial | - |
| 2 | `tareas_01_login_formulario_completado.png` | Formulario con credenciales | - |
| 3 | `tareas_02_login_completado.png` | Después del login | - |
| 4 | `tareas_03_pagina_tareas.png` | Página de tareas | - |
| 5 | `tareas_04_proyecto_seleccionado.png` | Proyecto seleccionado | - |
| 6 | `tareas_05_lista_tareas_inicial.png` | Lista inicial | - |
| 7 | `tareas_06_modal_crear_tarea_abierto.png` | Modal crear tarea | - |
| 8 | `tareas_07_formulario_tarea_completado.png` | Formulario completado | - |
| 9 | `tareas_08_tarea_guardada.png` | Tarea guardada | - |
| 10 | `tareas_09_tarea_en_lista.png` | Tarea en lista | - |
| 11 | `tareas_10_lista_antes_editar.png` | Lista antes de editar | - |
| 12 | `tareas_11_modal_editar_tarea_abierto.png` | Modal editar tarea | - |
| 13 | `tareas_12_formulario_edicion_completado.png` | Formulario edición | - |
| 14 | `tareas_13_tarea_editada_guardada.png` | Tarea editada guardada | - |
| 15 | `tareas_14_tarea_editada_en_lista.png` | Tarea editada en lista | - |

---

## Métricas de Cobertura

| Funcionalidad | Cobertura | Pruebas | Estado |
|---------------|-----------|---------|--------|
| Login | 100% | 3/3 | ✅ |
| Listar Proyectos | 100% | 2/2 | ✅ |
| Crear Proyecto | 100% | 3/3 | ✅ |
| Editar Proyecto | 100% | 2/2 | ✅ |
| Listar Tareas | 100% | 3/3 | ✅ |
| Crear Tarea | 100% | 4/4 | ✅ |
| Editar Tarea | 100% | 5/5 | ✅ |
| Filtrar Tareas | 100% | 2/2 | ✅ |
| Validaciones | 100% | 3/3 | ✅ |
| Modales | 100% | 3/3 | ✅ |

---

## Ejecución de Pruebas

### Comandos Disponibles

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar solo proyectos
npm run test:projects

# Ejecutar solo tareas
npm run test:tasks

# Limpiar todas las capturas
npm run clean:screenshots

# Eliminar captura específica
npm run delete:screenshot
```

### Tiempo de Ejecución

| Módulo | Tiempo Promedio | Tiempo Máximo |
|--------|----------------|---------------|
| Proyectos | ~45 segundos | 60 segundos |
| Tareas | ~60 segundos | 90 segundos |
| Total | ~105 segundos | 150 segundos |

---

**Fecha de Generación:** 6 de noviembre de 2025  
**Versión:** 1.0

