# Pruebas unitarias

Este README resume cómo ejecutar las pruebas del backend y frontend.

## Backend (Maven)

- Ubicación de pruebas: `backend/src/test/java`
- Incluye casos para `ProjectService`:
  - Validación de `TaskCreateRequest` (`tasks es requerido`)
  - Deduplicación y persistencia de tareas
  - Restricción de rol en `getProjectsForUser`
  - Mapeo de prioridad y actualización con `updateTask`

### Ejecutar
```bash
mvn -f backend\pom.xml test
```

## Frontend (Vitest)

- Configuración de Vitest en `vitest.config.js` con `jsdom`
- Pruebas en `src/__tests__/task.spec.js`
- Cubren:
  - Prellenado del proyecto en modal de “Crear”
  - Envío del POST con `{ projectId, tasks: [title] }`
  - PUT posterior con detalles extra
  - Manejo de error “tasks es requerido”

### Instalar dependencias de test
```bash
npm i -D vitest jsdom
```

### Ejecutar pruebas
```bash
npm test
```

Notas:
- Si usas otro administrador de paquetes (yarn/pnpm), ajusta los comandos.
- Mantén el backend corriendo sólo si quieres validar integración real; para unit tests no es necesario.