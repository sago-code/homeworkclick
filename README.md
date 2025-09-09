# HomeworkClick 🎓
## Descripción 📝
HomeworkClick es una aplicación web que facilita la gestión de tareas y proyectos académicos, integrando un sistema de chat con ChatGPT para asistencia inteligente.

## Estructura del Proyecto 🏗️
```
├── backend/                 # Servidor 
backend en Java Spring Boot
│   ├── src/                 # Código fuente 
del backend
│   │   └── main/
│   │       ├── java/       # Clases Java
│   │       └── resources/  # Configuraciones
│   └── pom.xml             # Dependencias 
Maven
├── src/                    # Frontend
│   ├── assets/             # Recursos 
estáticos
│   │   └── images/        # Imágenes
│   └── pages/              # Páginas de la 
aplicación
│       └── common/         # Componentes 
comunes
├── index.html              # Página 
principal
├── index.js                # Servidor de 
desarrollo
└── package.json            # Dependencias 
npm
```
## Características Principales ✨
- 🔐 Sistema de login con validación de contraseña
- 🤖 Integración con ChatGPT para asistencia
- 📋 Gestión de proyectos y tareas
- 🌐 API REST con Spring Boot
- 💻 Frontend responsive
## Tecnologías Utilizadas 🛠️
### Backend
- Java 17
- Spring Boot 3.1.5
- PostgreSQL
- WebFlux para llamadas asíncronas
### Frontend
- HTML5
- CSS3
- JavaScript Vanilla
- Node.js para desarrollo
## Requisitos Previos 📋
- Java 17 o superior
- Maven 3.9.9 o superior
- Node.js 22.18.0 o superior
- Clave API de OpenAI
## Configuración ⚙️
1. 1.
   Backend
   
   ```
   cd backend
   # Configurar application.properties con 
   tu API key de OpenAI
   mvn clean install
   mvn spring-boot:run
   ```
2. 2.
   Frontend
   
   ```
   npm install
   npm run dev
   ```
## Uso 🚀
1. 1.
   Accede a http://localhost:3000
2. 2.
   Inicia sesión con tus credenciales
3. 3.
   Utiliza el menú principal para:
   - Crear proyectos
   - Gestionar tareas
   - Consultar estado de proyectos
## Características de Seguridad 🔒
- Validación de contraseñas robusta
- CORS configurado para desarrollo
- Validación de entrada en endpoints
## API Endpoints 🔌
### Webhook ChatGPT
- POST /webhook/chat - Enviar mensajes a ChatGPT
- GET /webhook/health - Verificar estado del servicio
- GET /webhook/test - Endpoint de prueba
### Menú
- GET /api/menu/opciones - Obtener opciones del menú
- POST /api/menu/procesar/{optionId} - Procesar opción seleccionada
## Contribución 🤝
Para contribuir al proyecto:

1. 1.
   Haz fork del repositorio
2. 2.
   Crea una rama para tu feature
3. 3.
   Realiza tus cambios
4. 4.
   Envía un pull request
## Licencia 📄
ISC License

## Contacto 📧
Para más información o soporte, por favor contacta al equipo de desarrollo.