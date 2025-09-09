# 📋 Prueba de Funcionalidad: Crear Tareas del Proyecto

## 🎯 Funcionalidad Implementada

Cuando el usuario seleccione la **opción 2 "Crear las tareas del proyecto"**, el sistema:

1. Solicita el **nombre del proyecto** al usuario
2. Envía a ChatGPT el mensaje: *"Tengo un proyecto llamado '[NOMBRE]'. Por favor, proporciona las 10 tareas principales que debo realizar para desarrollar este proyecto. Enumera cada tarea de forma clara y específica, del 1 al 10."*
3. Muestra la respuesta con las 10 tareas generadas por ChatGPT

## 🧪 Cómo Probar

### 🌐 Opción 1: Frontend Web
```
1. Abrir http://localhost:3000
2. Cuando aparezca el menú, hacer clic en "2. Crear las tareas del proyecto"
3. Seguir las instrucciones para proporcionar el nombre del proyecto
4. Ver las 10 tareas generadas por ChatGPT
```

### 🔗 Opción 2: API Directa
```bash
# Paso 1: Seleccionar opción 2 (sin datos)
curl -X POST "http://localhost:8080/api/menu/procesar/2?sessionId=test123"

# Paso 2: Enviar nombre del proyecto
curl -X POST "http://localhost:8080/api/menu/procesar/2/datos" \
  -H "Content-Type: application/json" \
  -d "Sistema de Gestión de Biblioteca"
```

### 🖥️ Opción 3: Consola
```bash
# Ejecutar menú de consola
curl -X POST "http://localhost:8080/api/menu/ejecutar"
# En la consola del servidor, seleccionar opción 2
# Escribir el nombre del proyecto cuando se solicite
```

## 📝 Ejemplos de Proyectos para Probar

1. **"Sistema de Gestión de Biblioteca"**
2. **"Aplicación de E-commerce"**
3. **"Plataforma de Aprendizaje Online"**
4. **"Sistema de Control de Inventario"**
5. **"App Móvil de Delivery"**

## 🎯 Respuesta Esperada

```
📋 **TAREAS DEL PROYECTO: Sistema de Gestión de Biblioteca**

🤖 **Tareas generadas por ChatGPT:**

1. Análisis de requisitos y definición de funcionalidades
2. Diseño de la base de datos para libros, usuarios y préstamos
3. Diseño de la interfaz de usuario (UI/UX)
4. Implementación del sistema de autenticación y autorización
5. Desarrollo del módulo de gestión de libros (CRUD)
6. Desarrollo del módulo de gestión de usuarios
7. Implementación del sistema de préstamos y devoluciones
8. Desarrollo de reportes y estadísticas
9. Implementación de búsqueda y filtros avanzados
10. Pruebas, documentación y despliegue del sistema
```

## 🛡️ Manejo de Errores

Si ChatGPT no está disponible, el sistema mostrará **10 tareas básicas** como fallback:

```
💡 **Tareas básicas sugeridas:**
1. Definir requisitos del proyecto
2. Crear plan de trabajo
3. Asignar responsabilidades
4. Establecer cronograma
5. Configurar entorno de desarrollo
6. Diseñar arquitectura del sistema
7. Implementar funcionalidades core
8. Realizar pruebas
9. Documentar el proyecto
10. Desplegar y entregar
```
