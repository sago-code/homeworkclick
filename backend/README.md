# Webhook de ChatGPT en Java

Un webhook sencillo desarrollado en Java con Spring Boot que se conecta con la API de ChatGPT de OpenAI.

## Características

- ✅ API REST sencilla para enviar mensajes a ChatGPT
- ✅ Respuestas en formato JSON
- ✅ Manejo de errores robusto
- ✅ Logging detallado
- ✅ Endpoints de salud y prueba
- ✅ Validación de entrada
- ✅ Soporte para CORS

## Requisitos

- Java 17 o superior
- Maven 3.6 o superior
- Clave de API de OpenAI

## Configuración

1. **Obtener una clave de API de OpenAI:**
   - Ve a [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Crea una nueva clave de API
   - Copia la clave

2. **Configurar la aplicación:**
   - Crea un archivo `.env` en la raíz del proyecto
   - Agrega tu clave de API de OpenAI:
     ```properties
     OPENAI_API_KEY=tu-clave-real-aqui
     ```
   - El archivo `application.properties` ya está configurado para usar esta variable de entorno
   - Abre el archivo `src/main/resources/application.properties`
   - Reemplaza `tu-api-key-aqui` con tu clave real de OpenAI:
     ```properties
     openai.api.key=sk-tu-clave-real-aqui
     ```

## Instalación y Ejecución

1. **Clonar/descargar el proyecto**

2. **Compilar el proyecto:**
   ```bash
   mvn clean compile
   ```

3. **Ejecutar la aplicación:**
   ```bash
   mvn spring-boot:run
   ```

4. **La aplicación estará disponible en:**
   ```
   http://localhost:8080
   ```

## Endpoints Disponibles

### 1. Enviar mensaje a ChatGPT
- **URL:** `POST /webhook/chat`
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "mensaje": "Hola, ¿cómo estás?",
    "usuario": "juan123"
  }
  ```
- **Respuesta:**
  ```json
  {
    "respuesta": "¡Hola! Estoy bien, gracias por preguntar. ¿En qué puedo ayudarte hoy?",
    "estado": "exitoso",
    "usuario": "juan123"
  }
  ```

### 2. Verificar salud del webhook
- **URL:** `GET /webhook/health`
- **Respuesta:**
  ```json
  {
    "respuesta": "Webhook funcionando correctamente",
    "estado": "activo",
    "usuario": "sistema"
  }
  ```

### 3. Endpoint de prueba
- **URL:** `GET /webhook/test`
- **Respuesta:** Mensaje de texto simple

## Ejemplo de Uso con cURL

```bash
# Verificar que el webhook está funcionando
curl http://localhost:8080/webhook/test

# Enviar un mensaje a ChatGPT
curl -X POST http://localhost:8080/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "mensaje": "Explica qué es la inteligencia artificial",
    "usuario": "usuario_ejemplo"
  }'

# Verificar salud del servicio
curl http://localhost:8080/webhook/health
```

## Estructura del Proyecto

```
src/
├── main/
│   ├── java/com/ejemplo/chatgptwebhook/
│   │   ├── ChatGptWebhookApplication.java    # Clase principal
│   │   ├── controller/
│   │   │   └── WebhookController.java        # Controlador REST
│   │   ├── service/
│   │   │   └── ChatGptService.java           # Servicio para ChatGPT
│   │   └── model/
│   │       ├── WebhookRequest.java           # Modelo de petición
│   │       ├── WebhookResponse.java          # Modelo de respuesta
│   │       ├── ChatGptRequest.java           # Modelo para API ChatGPT
│   │       └── ChatGptResponse.java          # Respuesta de ChatGPT
│   └── resources/
│       └── application.properties            # Configuración
└── pom.xml                                   # Dependencias Maven
```

## Personalización

### Cambiar el modelo de ChatGPT
Edita el archivo `ChatGptService.java` y modifica:
```java
request.setModel("gpt-4"); // Cambiar a gpt-4 u otro modelo
```

### Ajustar parámetros de respuesta
En `ChatGptService.java`:
```java
request.setMaxTokens(300);     // Más tokens = respuestas más largas
request.setTemperature(0.9);   // Mayor temperatura = más creatividad
```

### Cambiar el puerto
En `application.properties`:
```properties
server.port=9090
```

## Manejo de Errores

El webhook maneja varios tipos de errores:
- **Clave de API inválida:** Retorna mensaje de error apropiado
- **Problemas de conectividad:** Manejo de timeouts y errores de red
- **Validación de entrada:** Valida que el mensaje no esté vacío
- **Errores internos:** Logging detallado para debugging

## Logs

Los logs se muestran en la consola con información sobre:
- Peticiones recibidas
- Mensajes enviados a ChatGPT
- Respuestas recibidas
- Errores y excepciones

## Consideraciones de Seguridad

- ⚠️ No incluyas tu clave de API en el código fuente
- ⚠️ Usa variables de entorno en producción
- ⚠️ Considera implementar autenticación para el webhook
- ⚠️ Limita las peticiones para evitar uso excesivo de la API

## Soporte

Si encuentras algún problema:
1. Verifica que tu clave de API sea válida
2. Revisa los logs en la consola
3. Asegúrate de tener conexión a internet
4. Verifica que tengas créditos suficientes en tu cuenta de OpenAI
