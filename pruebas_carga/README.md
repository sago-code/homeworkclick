# Pruebas de Carga - HomeworkClick

Este directorio contiene las pruebas de carga para el proyecto HomeworkClick usando Locust.

## Estructura de Archivos

- `locustfile.py` - Archivo principal de pruebas de carga
- `requirements.txt` - Dependencias de Python necesarias
- `config/` - Configuraciones adicionales
- `results/` - Resultados de las pruebas (se crea automáticamente)

## Instalación

1. Instalar Python 3.8+ si no está instalado
2. Instalar las dependencias:
```bash
pip install -r requirements.txt
```

## Uso

### Ejecución Básica

```bash
# Ejecutar con interfaz web (recomendado)
locust -f locustfile.py --host=http://localhost:8080

# Ejecutar sin interfaz web (línea de comandos)
locust -f locustfile.py --host=http://localhost:8080 --headless -u 10 -r 2 -t 30s
```

### Parámetros de Ejecución

- `--host`: URL base del servidor (por defecto: http://localhost:8080)
- `-u`: Número de usuarios virtuales
- `-r`: Tasa de spawn (usuarios por segundo)
- `-t`: Duración de la prueba
- `--headless`: Ejecutar sin interfaz web

### Ejemplos de Uso

```bash
# Prueba ligera (10 usuarios por 1 minuto)
locust -f locustfile.py --host=http://localhost:8080 --headless -u 10 -r 2 -t 60s

# Prueba media (50 usuarios por 5 minutos)
locust -f locustfile.py --host=http://localhost:8080 --headless -u 50 -r 5 -t 5m

# Prueba pesada (100 usuarios por 10 minutos)
locust -f locustfile.py --host=http://localhost:8080 --headless -u 100 -r 10 -t 10m

# Prueba específica solo de webhook
locust -f locustfile.py --host=http://localhost:8080 --headless -u 20 -r 2 -t 2m --class WebhookOnlyUser

# Prueba específica solo de menú
locust -f locustfile.py --host=http://localhost:8080 --headless -u 15 -r 1 -t 3m --class MenuOnlyUser
```

## Tipos de Usuarios Virtuales

### 1. HomeworkClickUser (Por defecto)
- Simula el flujo completo de un usuario
- Registra usuario, hace login, prueba todos los endpoints
- Peso de tareas:
  - Chat webhook: 5
  - Health checks: 3
  - Test endpoints: 2
  - Menu opciones: 2
  - Procesar opciones: 1

### 2. WebhookOnlyUser
- Se enfoca únicamente en los endpoints del webhook
- Ideal para probar la carga del chat
- Peso de tareas:
  - Chat webhook: 10
  - Health endpoints: 3

### 3. MenuOnlyUser
- Se enfoca únicamente en los endpoints del menú
- Requiere autenticación
- Peso de tareas:
  - Menu opciones: 5
  - Procesar opciones: 3

## Métricas Importantes

- **RPS (Requests Per Second)**: Peticiones por segundo
- **Response Time**: Tiempo de respuesta promedio
- **95th Percentile**: 95% de las respuestas están por debajo de este tiempo
- **Failure Rate**: Porcentaje de peticiones fallidas

## Interpretación de Resultados

### Tiempos de Respuesta Aceptables
- **< 200ms**: Excelente
- **200-500ms**: Bueno
- **500ms-1s**: Aceptable
- **> 1s**: Necesita optimización

### Tasa de Errores Aceptable
- **< 1%**: Excelente
- **1-5%**: Aceptable
- **> 5%**: Necesita investigación

## Configuración del Servidor

Antes de ejecutar las pruebas, asegúrate de que:

1. El servidor backend esté ejecutándose en el puerto 8080
2. La base de datos PostgreSQL esté configurada y funcionando
3. Los endpoints estén accesibles

## Troubleshooting

### Error: "Connection refused"
- Verificar que el servidor esté ejecutándose
- Verificar la URL del host

### Error: "Database connection failed"
- Verificar que PostgreSQL esté ejecutándose
- Verificar las credenciales en application.properties

### Error: "Module not found"
- Ejecutar: `pip install -r requirements.txt`

## Escalabilidad

Para pruebas de alta carga, considera:

1. Ejecutar Locust en modo distribuido
2. Usar múltiples máquinas para generar carga
3. Monitorear recursos del servidor durante las pruebas

```bash
# Modo distribuido (master)
locust -f locustfile.py --host=http://localhost:8080 --master

# Modo distribuido (worker)
locust -f locustfile.py --host=http://localhost:8080 --worker --master-host=localhost
```
