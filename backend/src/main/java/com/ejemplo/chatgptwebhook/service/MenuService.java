package com.ejemplo.chatgptwebhook.service;

import com.ejemplo.chatgptwebhook.model.MenuOption;
import com.ejemplo.chatgptwebhook.model.MenuResponse;
import com.ejemplo.chatgptwebhook.datastructures.TablaHash;
import com.ejemplo.chatgptwebhook.datastructures.Grafo;
import com.ejemplo.chatgptwebhook.datastructures.ListaEnlazada;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio para gestionar las opciones del menú principal (versión web únicamente)
 */
@Service
public class MenuService {
    
    private static final Logger logger = LoggerFactory.getLogger(MenuService.class);
    
    // Mapa para almacenar el estado de las sesiones del menú (do-while)
    private final Map<String, Boolean> sesionesActivas = new ConcurrentHashMap<>();
    private final Map<String, Integer> contadorInteracciones = new ConcurrentHashMap<>();
    
    // Mapa para almacenar el contexto del proyecto por sesión
    private final Map<String, String> contextoyProyectoSesion = new ConcurrentHashMap<>();
    
    // Usando estructuras de datos personalizadas
    private final TablaHash<String, String> nombreProyectoSesion = new TablaHash<>();
    private final TablaHash<String, String> tareasProyectoSesion = new TablaHash<>();
    private final TablaHash<String, Set<Integer>> tareasCompletadasSesion = new TablaHash<>();
    
    // Grafo para relaciones entre proyectos
    private final Grafo<String> relacionesProyectos = new Grafo<>();
    
    // Inyección del servicio de ChatGPT
    @Autowired
    private ChatGptService chatGptService;
    
    /**
     * Obtiene las opciones del menú principal (Versión web que usa mostrarMenuPrincipal)
     * Implementa bucle do-while para mantener el menú activo hasta que el usuario seleccione "salir"
     * 
     * @param sessionId ID de sesión para controlar el bucle do-while
     * @return MenuResponse con todas las opciones disponibles
     */
    public MenuResponse obtenerOpcionesMenu(String sessionId) {
        
        // Crear las opciones del menú
        List<MenuOption> opciones = Arrays.asList(
            new MenuOption(1, "Crear un proyecto", "crear_proyecto"),
            new MenuOption(2, "Crear las tareas del proyecto", "crear_tareas"),
            new MenuOption(3, "Consultar tareas del proyecto", "consultar_tareas"),
            new MenuOption(4, "Salir", "salir")
        );
        
        // Si es la primera vez, inicializar como activa
        if (!sesionesActivas.containsKey(sessionId)) {
            sesionesActivas.put(sessionId, true);
        }
        
        String estado ="activo";
        String titulo = "Menú Principal - Gestión de Proyectos";
        
        MenuResponse menuResponse = new MenuResponse(titulo, opciones, estado);

        return menuResponse;
        
    }
    
    /**
     * Sobrecarga del método para compatibilidad
     */
    public MenuResponse obtenerOpcionesMenu() {
        // Generar una sesión por defecto
        String sessionId = "default_" + System.currentTimeMillis();
        return obtenerOpcionesMenu(sessionId);
    }
    
    /**
     * Obtiene una opción específica del menú por su ID
     * 
     * @param id El ID de la opción a buscar
     * @return MenuOption si se encuentra, null en caso contrario
     */
    public MenuOption obtenerOpcionPorId(int id) {
        logger.info("Buscando opción del menú con ID: {}", id);
        
        List<MenuOption> opciones = obtenerOpcionesMenu().getOpciones();
        
        return opciones.stream()
                .filter(opcion -> opcion.getId() == id)
                .findFirst()
                .orElse(null);
    }
    
    /**
     * Valida si una opción del menú es válida
     * 
     * @param id El ID de la opción a validar
     * @return true si la opción es válida, false en caso contrario
     */
    public boolean esOpcionValida(int id) {
        logger.info("Validando opción del menú con ID: {}", id);
        return obtenerOpcionPorId(id) != null;
    }
    
    /**
     * Versión web de procesarOpcion que devuelve una respuesta JSON en lugar de interactuar con consola
     * Controla el bucle do-while cuando se selecciona "salir"
     * 
     * @param opcion La opción seleccionada por el usuario
     * @param sessionId ID de sesión para controlar el bucle do-while
     * @return String con la respuesta de la acción ejecutada
     */
    public String procesarOpcionWeb(int opcion, String sessionId) {
       
        switch (opcion) {
            case 1:
                return crearProyectoWebConSesion(sessionId);
                
            case 2:
                return crearTareasProyectoWebConSesion(sessionId);
                
            case 3:
                return consultarTareasProyectoWebConSesion(sessionId);
                
            case 4:
                // Finalizar el bucle do-while para esta sesión
                return salirWebConSesion(sessionId);
                
            default:
                logger.warn("Opción inválida seleccionada desde web para sesión {}: {}", sessionId, opcion);
                return "❌ Opción inválida. Por favor, seleccione una opción del 1 al 4.";
        }
    }
    
    /**
     * Sobrecarga del método para compatibilidad
     */
    public String procesarOpcionWeb(int opcion) {
        String sessionId = "default_" + System.currentTimeMillis();
        return procesarOpcionWeb(opcion, sessionId);
    }
    
    /**
     * Versión web de procesarOpcion con datos específicos
     * 
     * @param opcion La opción seleccionada por el usuario
     * @param datos Los datos específicos para la opción (puede ser null)
     * @return String con la respuesta de la acción ejecutada
     */
    public String procesarOpcionWebConDatos(int opcion, String datos) {
        logger.info("Procesando opción {} con datos: {}", opcion, datos);
        
        switch (opcion) {
            case 1:
                return crearProyectoWebConDatos(datos);
                
            case 2:
                return crearTareasProyectoWebConDatos(datos);
                
            case 3:
                return consultarTareasProyectoWebConDatos(datos);
                
            case 4:
                return salirWeb();
                
            default:
                logger.warn("Opción inválida seleccionada desde web: {}", opcion);
                return "❌ Opción inválida. Por favor, seleccione una opción del 1 al 4.";
        }
    }
    
    /**
     * Versión web de procesarOpcion con datos específicos y sesión
     * 
     * @param opcion La opción seleccionada por el usuario
     * @param datos Los datos específicos para la opción (puede ser null)
     * @param sessionId ID de sesión para mantener contexto
     * @return String con la respuesta de la acción ejecutada
     */
    public String procesarOpcionWebConDatosYSesion(int opcion, String datos, String sessionId) {
        
        switch (opcion) {
            case 1:
                return crearProyectoWebConDatosYSesion(datos, sessionId);
                
            case 2:
                return crearTareasProyectoWebConDatosYSesion(datos, sessionId);
                
            case 3:
                return consultarTareasProyectoWebConDatosYSesion(datos, sessionId);
                
            case 4:
                return salirWebConSesion(sessionId);
                
            default:
                logger.warn("Opción inválida seleccionada desde web: {}", opcion);
                return "❌ Opción inválida. Por favor, seleccione una opción del 1 al 4.";
        }
    }
    
    /**
     * Versión web de crear proyecto que solicita la idea al usuario
     */
    private String crearProyectoWebConSesion(String sessionId) {
        
        // No enviar a ChatGPT inmediatamente, solo solicitar la idea del proyecto
        return "🚀 **CREAR NUEVO PROYECTO**\n\n" +
               "¡Perfecto! Vamos a crear un nuevo proyecto juntos.\n\n" +
               "💡 **Para comenzar, necesito que me cuentes:**\n" +
               "• ¿Cuál es tu idea de proyecto?\n" +
               "• ¿Qué problema quieres resolver?\n" +
               "• ¿Qué tipo de proyecto tienes en mente?\n\n" +
               "✍️ **Escribe tu idea del proyecto** y te ayudaré a desarrollarla con todos los detalles necesarios.";
    }
    
    /**
     * Versión web de crear proyecto con datos específicos (idea del usuario)
     */
    private String crearProyectoWebConDatos(String datos) {
        logger.info("Procesando idea del proyecto: {}", datos);
        
        if (datos == null || datos.trim().isEmpty()) {
            return "❌ **Error:** No se proporcionó una idea de proyecto.\n\n" +
                   "Por favor, describe tu idea de proyecto para poder ayudarte a desarrollarla.";
        }
        
        String ideaProyecto = datos.trim();
        logger.info("💡 Idea del proyecto recibida: {}", ideaProyecto);
        
        // Ahora sí enviar a ChatGPT con la idea del usuario usando sesión por defecto
        return procesarIdeaProyectoConChatGPT(ideaProyecto, "default_session");
    }
    
    /**
     * Versión web de crear proyecto con datos específicos y sesión (idea del usuario)
     */
    private String crearProyectoWebConDatosYSesion(String datos, String sessionId) {
        
        if (datos == null || datos.trim().isEmpty()) {
            return "❌ **Error:** No se proporcionó una idea de proyecto.\n\n" +
                   "Por favor, describe tu idea de proyecto para poder ayudarte a desarrollarla.";
        }
        
        String ideaProyecto = datos.trim();
        logger.info("💡 Idea del proyecto recibida: {} para sesión: {}", ideaProyecto, sessionId);
        
        // Ahora sí enviar a ChatGPT con la idea del usuario usando la sesión específica
        return procesarIdeaProyectoConChatGPT(ideaProyecto, sessionId);
    }
    
    /**
     * Procesa la idea del proyecto con ChatGPT y guarda el contexto
     */
    private String procesarIdeaProyectoConChatGPT(String ideaProyecto, String sessionId) {
        try {
            // Construir mensaje específico para ChatGPT con la idea del usuario
            String mensajeParaChatGPT = String.format(
                "El usuario tiene la siguiente idea de proyecto: \"%s\"\n\n" +
                "Eres un experto en arquitectura de software de proyectos. Por favor, ayúdalo a desarrollar y definir completamente este proyecto. " +
                "Proporciona 10 tareas principales que se deben realizar para desarrollar este proyecto:\n" +
                "Las tareas deben ser específicas y detalladas, y deben ser realizadas en orden cronológico.\n" +
                "Al final, indica claramente cuál sería el nombre específico del proyecto para usarlo como referencia.",
                ideaProyecto
            );
            
            logger.info("🤖 Enviando idea del proyecto a ChatGPT para sesión: {}", sessionId);
            
            // Usar más tokens para respuestas largas de ChatGPT
            String respuestaChatGPT = chatGptService.enviarMensajeConTokens(mensajeParaChatGPT, 3000).block();
            
            // Guardar el contexto completo de la respuesta
            contextoyProyectoSesion.put(sessionId, respuestaChatGPT);
            
            // Intentar extraer el nombre del proyecto de la respuesta
            String nombreProyecto = extraerNombreProyecto(respuestaChatGPT);
            if (nombreProyecto != null && !nombreProyecto.isEmpty()) {
                nombreProyectoSesion.put(sessionId, nombreProyecto);
                logger.info("📝 Proyecto guardado en sesión {}: {}", sessionId, nombreProyecto);
            }
            
            // Extraer y guardar las tareas del proyecto
            String tareasExtraidas = extraerTareasProyecto(respuestaChatGPT);
            if (tareasExtraidas != null && !tareasExtraidas.isEmpty()) {
                tareasProyectoSesion.put(sessionId, tareasExtraidas);
                logger.info("📋 Tareas guardadas en sesión {}: {} tareas encontradas", sessionId, contarTareas(tareasExtraidas));
            }
            
            logger.info("✅ Respuesta recibida de ChatGPT para idea de proyecto y contexto guardado");
            
            return "🚀 **PROYECTO DESARROLLADO**\n\n" + respuestaChatGPT + "\n\n" +
                   "✅ **Proyecto creado exitosamente**\n" +
                   "🎯 **Siguiente paso:** Puedes gestionar las tareas usando las opciones del menú principal\n\n" +
                   "MOSTRAR_MENU_PRINCIPAL";
            
        } catch (Exception e) {
            logger.error("❌ Error al comunicarse con ChatGPT para procesar idea de proyecto", e);
            return "🚀 **DESARROLLO DE PROYECTO**\n\n" +
                   "❌ No pude conectar con ChatGPT en este momento.\n\n" +
                   "💡 **Tu idea de proyecto:** " + ideaProyecto + "\n\n" +
                   "**Guía básica para desarrollar tu proyecto:**\n" +
                   "1. Define el objetivo principal de tu idea\n" +
                   "2. Identifica tu público objetivo\n" +
                   "3. Establece un presupuesto estimado\n" +
                   "4. Define las fechas de inicio y fin\n" +
                   "5. Crea la lista de características principales\n\n" +
                   "MOSTRAR_MENU_PRINCIPAL";
        }
    }
    
    /**
     * Versión web de gestionar tareas que muestra las existentes y permite agregar nuevas
     */
    private String crearTareasProyectoWebConSesion(String sessionId) {
        
        // Verificar si hay tareas y proyecto en la sesión
        String tareasExistentes = tareasProyectoSesion.get(sessionId);
        String nombreProyecto = nombreProyectoSesion.get(sessionId);
        
        if (tareasExistentes != null && !tareasExistentes.isEmpty()) {
            // Hay tareas en la sesión, mostrarlas y pedir nueva tarea
            String tituloProyecto = nombreProyecto != null ? nombreProyecto : "Proyecto definido anteriormente";
            int numeroTareas = contarTareas(tareasExistentes);
            
           
            return String.format(
                "📋 **GESTIÓN DE TAREAS: %s**\n\n" +
                "📊 **Tareas actuales:** %d tareas\n\n" +
                "**Lista de tareas:**\n%s\n\n" +
                "➕ **AGREGAR NUEVA TAREA**\n\n" +
                "💡 **Para agregar una nueva tarea:**\n" +
                "✍️ Escribe la descripción de la nueva tarea que quieres agregar al proyecto.\n\n" +
                "📝 **Ejemplo:** \"Configurar base de datos PostgreSQL\" o \"Implementar sistema de autenticación\"\n\n" +
                "🔄 **La nueva tarea se agregará automáticamente a la lista existente.**",
                tituloProyecto, numeroTareas, tareasExistentes
            );
            
        } else {
            // No hay tareas, verificar si hay contexto del proyecto
            String contextoProyecto = contextoyProyectoSesion.get(sessionId);
            
            if (contextoProyecto != null && !contextoProyecto.isEmpty()) {
                // Hay contexto pero no tareas (caso raro), solicitar primera tarea
                String tituloProyecto = nombreProyecto != null ? nombreProyecto : "Proyecto definido anteriormente";
                
                return String.format(
                    "📋 **CREAR PRIMERA TAREA: %s**\n\n" +
                    "🎯 **Proyecto definido pero sin tareas.**\n\n" +
                    "➕ **Para comenzar, agrega la primera tarea:**\n" +
                    "✍️ Escribe la descripción de la primera tarea para este proyecto.\n\n" +
                    "📝 **Ejemplo:** \"Definir requisitos del proyecto\" o \"Configurar entorno de desarrollo\"\n\n" +
                    "🔄 **Esta será la primera tarea de tu proyecto.**",
                    tituloProyecto
                );
            } else {
                // No hay contexto ni tareas
                return "📋 **GESTIÓN DE TAREAS DEL PROYECTO**\n\n" +
                       "❗ **No hay proyecto definido en esta sesión.**\n\n" +
                       "💡 **Para gestionar tareas:**\n" +
                       "1. Primero selecciona **'1. Crear un proyecto'** para definir tu proyecto\n" +
                       "2. El sistema generará automáticamente las tareas iniciales\n" +
                       "3. Después podrás agregar más tareas usando esta opción\n\n";
            }
        }
    }
    
    /**
     * Versión web de crear tareas con datos específicos y sesión específica
     */
    private String crearTareasProyectoWebConDatosYSesion(String datos, String sessionId) {
        logger.info("📋 Procesando datos de tarea: {} - sesión: {}", datos, sessionId);
        
        // Si hay datos específicos, agregar como nueva tarea
        if (datos != null && !datos.trim().isEmpty()) {
            return agregarNuevaTareaASesion(datos.trim(), sessionId);
        }
        
        // Si no hay datos específicos, mostrar gestión de tareas
        return crearTareasProyectoWebConSesion(sessionId);
    }
    
    /**
     * Versión web de crear tareas con datos específicos - envía a ChatGPT
     */
    private String crearTareasProyectoWebConDatos(String datos) {
        logger.info("📋 Creando tareas para proyecto con datos: {}", datos);
        
        String nombreProyecto = datos != null && !datos.trim().isEmpty() ? datos : "Proyecto sin nombre";
        
        try {
            // Construir mensaje específico para ChatGPT
            String mensajeParaChatGPT = String.format(
                "Tengo un proyecto llamado '%s'. " +
                "Por favor, proporciona las 10 tareas principales que debo realizar para desarrollar este proyecto. " +
                "Enumera cada tarea de forma clara y específica, del 1 al 10.",
                nombreProyecto
            );
            
            // Usar más tokens para respuestas largas de ChatGPT
            String respuestaChatGPT = chatGptService.enviarMensajeConTokens(mensajeParaChatGPT, 3000).block();
            
            
            return String.format(
                "📋 **TAREAS DEL PROYECTO: %s**\n\n" +
                "🤖 **Tareas generadas por el sistema:**\n\n%s\n\n" +
                "✅ **Tareas creadas exitosamente**\n" +
                "💡 **Siguiente paso:** Puedes usar las opciones del menú para gestionar estas tareas\n\n" +
                "MOSTRAR_MENU_PRINCIPAL",
                nombreProyecto, respuestaChatGPT
            );
            
        } catch (Exception e) {
            logger.error("❌ Error al comunicarse con ChatGPT para generar tareas", e);
            
            return String.format(
                "📋 **TAREAS DEL PROYECTO: %s**\n\n" +
                "❌ No pude conectar con ChatGPT en este momento.\n\n" +
                "💡 **Tareas básicas sugeridas:**\n" +
                "1. Definir requisitos del proyecto\n" +
                "2. Crear plan de trabajo\n" +
                "3. Asignar responsabilidades\n" +
                "4. Establecer cronograma\n" +
                "5. Configurar entorno de desarrollo\n" +
                "6. Diseñar arquitectura del sistema\n" +
                "7. Implementar funcionalidades core\n" +
                "8. Realizar pruebas\n" +
                "9. Documentar el proyecto\n" +
                "10. Desplegar y entregar\n\n" +
                "MOSTRAR_MENU_PRINCIPAL",
                nombreProyecto
            );
        }
    }
    
    
    /**
     * Versión web de consultar tareas con sesión específica
     */
    private String consultarTareasProyectoWebConSesion(String sessionId) {
        
        // Verificar si hay tareas guardadas en la sesión
        String tareasGuardadas = tareasProyectoSesion.get(sessionId);
        String nombreProyecto = nombreProyectoSesion.get(sessionId);
        
        if (tareasGuardadas != null && !tareasGuardadas.isEmpty()) {
            String tituloProyecto = nombreProyecto != null ? nombreProyecto : "Proyecto definido anteriormente";
            int numeroTareas = contarTareas(tareasGuardadas);
            
            // Obtener tareas completadas para esta sesión
            Set<Integer> tareasCompletadas = tareasCompletadasSesion.getOrDefault(sessionId, new HashSet<>());
            
            // Formatear lista de tareas con estado
            String tareasConEstado = formatearTareasConEstado(tareasGuardadas, tareasCompletadas);
            
            // Contar tareas completadas y pendientes
            int tareasCompletadasCount = tareasCompletadas.size();
            int tareasPendientes = numeroTareas - tareasCompletadasCount;
            
            logger.info("✅ Tareas encontradas en sesión {}: {} tareas ({} completadas, {} pendientes) para proyecto '{}'", 
                       sessionId, numeroTareas, tareasCompletadasCount, tareasPendientes, tituloProyecto);
            
            return String.format(
                "📋 **CONSULTAR TAREAS: %s**\n\n" +
                "📊 **Progreso:** %d/%d tareas completadas (%.1f%%)\n" +
                "✅ **Completadas:** %d | ⏳ **Pendientes:** %d\n\n" +
                "**Lista de tareas:**\n%s\n\n" +
                "🎯 **MARCAR TAREA COMO COMPLETADA**\n\n" +
                "💡 **Para completar una tarea:**\n" +
                "✍️ Escribe el **número de la tarea** que has completado.\n\n" +
                "📝 **Ejemplo:** Escribe \"3\" para marcar la tarea #3 como completada\n\n" +
                "🔄 **El estado se actualizará automáticamente en tu proyecto.**",
                tituloProyecto, 
                tareasCompletadasCount, numeroTareas, 
                numeroTareas > 0 ? (tareasCompletadasCount * 100.0 / numeroTareas) : 0.0,
                tareasCompletadasCount, tareasPendientes,
                tareasConEstado
            );
        } else {
            // No hay tareas en la sesión
            return "📋 **CONSULTAR TAREAS DEL PROYECTO**\n\n" +
                   "❗ **No hay tareas guardadas en esta sesión.**\n\n" +
                   "💡 **Para consultar tareas:**\n" +
                   "1. Primero selecciona **'1. Crear un proyecto'** para definir tu proyecto con ChatGPT\n" +
                   "2. El sistema generará automáticamente las 10 tareas principales\n" +
                   "3. Después podrás consultar las tareas generadas\n\n" +
                   "🔄 **Alternativamente:**\n" +
                   "Puedes usar el endpoint `POST /api/menu/procesar/3/datos` con el nombre específico del proyecto.";
        }
    }
    
    /**
     * Versión web de consultar tareas con datos específicos y sesión específica
     */
    private String consultarTareasProyectoWebConDatosYSesion(String datos, String sessionId) {
        logger.info("Procesando número de tarea: {} - sesión: {}", datos, sessionId);
        
        // Si hay datos específicos, intentar marcar tarea como completada
        if (datos != null && !datos.trim().isEmpty()) {
            try {
                int numeroTarea = Integer.parseInt(datos.trim());
                return marcarTareaComoCompletada(numeroTarea, sessionId);
            } catch (NumberFormatException e) {
                return "❌ **Error:** Por favor ingresa un número válido de tarea.\n\n" +
                       "📝 **Ejemplo:** Escribe \"3\" para marcar la tarea #3 como completada.\n\n" +
                       "MOSTRAR_MENU_PRINCIPAL";
            }
        }
        
        // Si no hay datos específicos, mostrar lista de tareas
        return consultarTareasProyectoWebConSesion(sessionId);
    }
    
    /**
     * Versión web de consultar tareas con datos específicos
     */
    private String consultarTareasProyectoWebConDatos(String datos) {
        logger.info("Consultando tareas con datos: {}", datos);
        
        String nombreProyecto = datos != null ? datos : "Proyecto por defecto";
        
        // Aquí se implementaría la lógica real para consultar las tareas
        // Por ejemplo, buscar en base de datos
        
        logger.info("Consulta de tareas realizada desde web para proyecto: {}", nombreProyecto);
        
        return "📊 Tareas del proyecto '" + nombreProyecto + "':\n" +
               "----------------------------------------\n" +
               "1. Tarea de ejemplo 1 - Prioridad: Alta - Estado: En progreso\n" +
               "2. Tarea de ejemplo 2 - Prioridad: Media - Estado: Completada\n" +
               "3. Tarea de ejemplo 3 - Prioridad: Baja - Estado: Pendiente\n\n" +
               "📈 Resumen:\n" +
               "   • Total de tareas: 3\n" +
               "   • Completadas: 1\n" +
               "   • En progreso: 1\n" +
               "   • Pendientes: 1\n\n" +
               "MOSTRAR_MENU_PRINCIPAL";
    }
    
    /**
     * Versión web de salir
     */
    private String salirWeb() {
        logger.info("Usuario ha salido del sistema desde web");
        return "👋 ¡Gracias por usar el sistema de gestión de proyectos! ¡Hasta luego!";
    }
    
    /**
     * Versión web de salir que controla el bucle do-while
     */
    private String salirWebConSesion(String sessionId) {
        logger.info("Usuario ha salido del sistema desde web - sesión: {}", sessionId);
        
        // Finalizar el bucle do-while para esta sesión
        finalizarSesion(sessionId);
        
        return "👋 ¡Gracias por usar el sistema de gestión de proyectos! " +
               "¡Hasta luego! (Sesión " + sessionId + " finalizada)";
    }
    
    /**
     * Finaliza una sesión del menú (termina el bucle do-while)
     */
    public void finalizarSesion(String sessionId) {
        logger.info("Finalizando sesión del menú: {}", sessionId);
        sesionesActivas.put(sessionId, false);
        
        // Limpiar datos de la sesión después de un tiempo
        new Thread(() -> {
            try {
                Thread.sleep(30000); // Esperar 30 segundos
                sesionesActivas.remove(sessionId);
                contadorInteracciones.remove(sessionId);
                contextoyProyectoSesion.remove(sessionId);
                nombreProyectoSesion.remove(sessionId);
                tareasProyectoSesion.remove(sessionId);
                tareasCompletadasSesion.remove(sessionId);
                logger.info("Datos de sesión {} limpiados (incluyendo contexto del proyecto, tareas y estado)", sessionId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }
    
    /**
     * Verifica si una sesión está activa (para el bucle do-while)
     */
    public boolean esSesionActiva(String sessionId) {
        return sesionesActivas.getOrDefault(sessionId, true);
    }
    
    /**
     * Obtiene el número de interacciones de una sesión
     */
    public int getInteraccionesSesion(String sessionId) {
        return contadorInteracciones.getOrDefault(sessionId, 0);
    }
    
    /**
     * Reinicia una sesión del menú (reinicia el bucle do-while)
     */
    public void reiniciarSesion(String sessionId) {
        logger.info("Reiniciando sesión del menú: {}", sessionId);
        sesionesActivas.put(sessionId, true);
        contadorInteracciones.put(sessionId, 0);
        // Limpiar también el contexto del proyecto, tareas y estado
        contextoyProyectoSesion.remove(sessionId);
        nombreProyectoSesion.remove(sessionId);
        tareasProyectoSesion.remove(sessionId);
        tareasCompletadasSesion.remove(sessionId);
    }
    
    /**
     * Extrae el nombre del proyecto de la respuesta de ChatGPT
     */
    private String extraerNombreProyecto(String respuestaChatGPT) {
        // Intentar extraer el nombre del proyecto de la respuesta
        // Buscar patrones comunes como "proyecto llamado", "nombre del proyecto", etc.
        
        if (respuestaChatGPT == null || respuestaChatGPT.isEmpty()) {
            return null;
        }
        
        // Patrones para buscar el nombre del proyecto
        String[] patrones = {
            "proyecto llamado \"([^\"]+)\"",
            "proyecto: ([^\n]+)",
            "nombre del proyecto: ([^\n]+)",
            "proyecto \"([^\"]+)\"",
            "llamado \"([^\"]+)\"",
            "proyecto ([A-Z][^,.\\n]+)"
        };
        
        for (String patron : patrones) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(patron);
            java.util.regex.Matcher matcher = pattern.matcher(respuestaChatGPT);
            if (matcher.find()) {
                String nombreEncontrado = matcher.group(1).trim();
                if (!nombreEncontrado.isEmpty()) {
                    logger.info("📝 Nombre del proyecto extraído: {}", nombreEncontrado);
                    return nombreEncontrado;
                }
            }
        }
        
        logger.info("📝 No se pudo extraer el nombre del proyecto automáticamente");
        return "Proyecto definido con ChatGPT";
    }
    
    /**
     * Extrae las tareas del proyecto de la respuesta de ChatGPT
     */
    private String extraerTareasProyecto(String respuestaChatGPT) {
        if (respuestaChatGPT == null || respuestaChatGPT.isEmpty()) {
            return null;
        }
        
        // Buscar patrones de tareas numeradas (1., 2., 3., etc.)
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
            "(?:^|\\n)(\\d+\\.\\s+[^\\n]+(?:\\n(?!\\d+\\.).*)*)", 
            java.util.regex.Pattern.MULTILINE | java.util.regex.Pattern.DOTALL
        );
        
        java.util.regex.Matcher matcher = pattern.matcher(respuestaChatGPT);
        StringBuilder tareasEncontradas = new StringBuilder();
        
        while (matcher.find()) {
            String tarea = matcher.group(1).trim();
            if (!tarea.isEmpty()) {
                tareasEncontradas.append(tarea).append("\n");
            }
        }
        
        String tareas = tareasEncontradas.toString().trim();
        
        if (!tareas.isEmpty()) {
            logger.info("📋 Tareas extraídas exitosamente de la respuesta de ChatGPT");
            return tareas;
        }
        
        logger.info("📋 No se pudieron extraer tareas numeradas, guardando respuesta completa");
        return respuestaChatGPT; // Si no se encuentran tareas numeradas, guardar toda la respuesta
    }
    
    /**
     * Cuenta el número de tareas en el texto de tareas
     */
    private int contarTareas(String tareas) {
        if (tareas == null || tareas.isEmpty()) {
            return 0;
        }
        
        // Contar líneas que empiezan con número seguido de punto
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^\\d+\\.", java.util.regex.Pattern.MULTILINE);
        java.util.regex.Matcher matcher = pattern.matcher(tareas);
        
        int contador = 0;
        while (matcher.find()) {
            contador++;
        }
        
        return contador;
    }
    
    /**
     * Formatea las tareas con su estado (completada/pendiente)
     */
    private String formatearTareasConEstado(String tareas, Set<Integer> tareasCompletadas) {
        if (tareas == null || tareas.isEmpty()) {
            return "";
        }
        
        String[] lineasTareas = tareas.split("\n");
        StringBuilder tareasFormateadas = new StringBuilder();
        
        for (String linea : lineasTareas) {
            if (linea.trim().isEmpty()) continue;
            
            // Extraer número de tarea
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^(\\d+)\\.");
            java.util.regex.Matcher matcher = pattern.matcher(linea.trim());
            
            if (matcher.find()) {
                int numeroTarea = Integer.parseInt(matcher.group(1));
                boolean completada = tareasCompletadas.contains(numeroTarea);
                
                String estado = completada ? "✅" : "⏳";
                String estadoTexto = completada ? " **(COMPLETADA)**" : " (Pendiente)";
                
                tareasFormateadas.append(estado).append(" ").append(linea.trim()).append(estadoTexto).append("\n");
            } else {
                // Si no tiene número, agregar como está
                tareasFormateadas.append("⏳ ").append(linea.trim()).append(" (Pendiente)").append("\n");
            }
        }
        
        return tareasFormateadas.toString().trim();
    }
    
    /**
     * Agrega una nueva tarea a las tareas existentes en la sesión
     */
    private String agregarNuevaTareaASesion(String nuevaTarea, String sessionId) {
        logger.info("➕ Agregando nueva tarea a sesión {}: {}", sessionId, nuevaTarea);
        
        // Verificar que hay un proyecto en la sesión
        String nombreProyecto = nombreProyectoSesion.get(sessionId);
        if (nombreProyecto == null || nombreProyecto.isEmpty()) {
            return "❌ **Error:** No hay proyecto definido en esta sesión.\n\n" +
                   "💡 Primero debes crear un proyecto usando la **opción 1**.\n\n" +
                   "MOSTRAR_MENU_PRINCIPAL";
        }
        
        // Obtener tareas existentes
        String tareasExistentes = tareasProyectoSesion.get(sessionId);
        
        // Calcular el número de la nueva tarea
        int numeroNuevaTarea = 1;
        if (tareasExistentes != null && !tareasExistentes.isEmpty()) {
            numeroNuevaTarea = contarTareas(tareasExistentes) + 1;
        }
        
        // Formatear la nueva tarea
        String tareaFormateada = String.format("%d. %s", numeroNuevaTarea, nuevaTarea);
        
        // Agregar la nueva tarea a las existentes
        String tareasActualizadas;
        if (tareasExistentes != null && !tareasExistentes.isEmpty()) {
            tareasActualizadas = tareasExistentes + "\n" + tareaFormateada;
        } else {
            tareasActualizadas = tareaFormateada;
        }
        
        // Guardar las tareas actualizadas en la sesión
        tareasProyectoSesion.put(sessionId, tareasActualizadas);
        
        logger.info("✅ Nueva tarea agregada. Total de tareas en sesión {}: {}", sessionId, contarTareas(tareasActualizadas));
        
        return String.format(
            "✅ **TAREA AGREGADA EXITOSAMENTE**\n\n" +
            "📋 **Proyecto:** %s\n" +
            "➕ **Nueva tarea #%d:** %s\n\n" +
            "📊 **Total de tareas:** %d\n\n" +
            "**Lista actualizada:**\n%s\n\n" +
            "💡 **Puedes:**\n" +
            "• Seleccionar **'2. Crear tareas'** para agregar otra tarea\n" +
            "• Seleccionar **'3. Consultar tareas'** para ver todas las tareas\n" +
            "• Continuar con tu proyecto\n\n" +
            "MOSTRAR_MENU_PRINCIPAL",
            nombreProyecto, numeroNuevaTarea, nuevaTarea, contarTareas(tareasActualizadas), tareasActualizadas
        );
    }
    
    /**
     * Marca una tarea como completada en la sesión
     */
    private String marcarTareaComoCompletada(int numeroTarea, String sessionId) {
        logger.info("🎯 Marcando tarea #{} como completada en sesión: {}", numeroTarea, sessionId);
        
        // Verificar que hay un proyecto en la sesión
        String nombreProyecto = nombreProyectoSesion.get(sessionId);
        if (nombreProyecto == null || nombreProyecto.isEmpty()) {
            return "❌ **Error:** No hay proyecto definido en esta sesión.\n\n" +
                   "💡 Primero debes crear un proyecto usando la **opción 1**.\n\n" +
                   "MOSTRAR_MENU_PRINCIPAL";
        }
        
        // Verificar que hay tareas en la sesión
        String tareasGuardadas = tareasProyectoSesion.get(sessionId);
        if (tareasGuardadas == null || tareasGuardadas.isEmpty()) {
            return "❌ **Error:** No hay tareas definidas en esta sesión.\n\n" +
                   "💡 Primero debes crear tareas usando la **opción 1** o **opción 2**.\n\n" +
                   "MOSTRAR_MENU_PRINCIPAL";
        }
        
        // Validar que el número de tarea existe
        int totalTareas = contarTareas(tareasGuardadas);
        if (numeroTarea < 1 || numeroTarea > totalTareas) {
            return String.format(
                "❌ **Error:** Número de tarea inválido.\n\n" +
                "💡 **Tareas disponibles:** del 1 al %d\n" +
                "📝 **Tu entrada:** %d\n\n" +
                "Por favor, ingresa un número válido entre 1 y %d.\n\n" +
                "MOSTRAR_MENU_PRINCIPAL",
                totalTareas, numeroTarea, totalTareas
            );
        }
        
        // Obtener tareas completadas para esta sesión
        Set<Integer> tareasCompletadas = tareasCompletadasSesion.computeIfAbsent(sessionId, k -> new HashSet<>());
        
        // Verificar si la tarea ya está completada
        if (tareasCompletadas.contains(numeroTarea)) {
            return String.format(
                "ℹ️ **TAREA YA COMPLETADA**\n\n" +
                "📋 **Proyecto:** %s\n" +
                "✅ **Tarea #%d** ya estaba marcada como completada.\n\n" +
                "💡 **Estado actual:** Esta tarea ya se encuentra en tu lista de tareas completadas.\n\n" +
                "🔄 **Puedes:**\n" +
                "• Seleccionar **'3. Consultar tareas'** para ver el estado de todas las tareas\n" +
                "• Marcar otra tarea como completada\n" +
                "• Continuar con tu proyecto\n\n" +
                "MOSTRAR_MENU_PRINCIPAL",
                nombreProyecto, numeroTarea
            );
        }
        
        // Extraer el texto de la tarea específica
        String textoTarea = extraerTextoTarea(tareasGuardadas, numeroTarea);
        
        // Marcar la tarea como completada
        tareasCompletadas.add(numeroTarea);
        
        // Calcular estadísticas
        int tareasCompletadasCount = tareasCompletadas.size();
        double porcentajeProgreso = (tareasCompletadasCount * 100.0) / totalTareas;
        
        logger.info("✅ Tarea #{} marcada como completada. Progreso: {}/{} ({}%) para proyecto '{}' en sesión: {}", 
                   numeroTarea, tareasCompletadasCount, totalTareas, String.format("%.1f", porcentajeProgreso), nombreProyecto, sessionId);
        
        return String.format(
            "🎉 **TAREA COMPLETADA EXITOSAMENTE**\n\n" +
            "📋 **Proyecto:** %s\n" +
            "✅ **Tarea #%d completada:** %s\n\n" +
            "📊 **Progreso actualizado:**\n" +
            "• **Completadas:** %d/%d tareas (%.1f%%)\n" +
            "• **Pendientes:** %d tareas\n\n" +
            "🎯 **¡Excelente trabajo!** Has completado una tarea más de tu proyecto.\n\n" +
            "💡 **Puedes:**\n" +
            "• Seleccionar **'3. Consultar tareas'** para marcar otra tarea como completada\n" +
            "• Seleccionar **'2. Crear tareas'** para agregar nuevas tareas\n" +
            "• Continuar trabajando en tu proyecto\n\n" +
            "MOSTRAR_MENU_PRINCIPAL",
            nombreProyecto, numeroTarea, textoTarea,
            tareasCompletadasCount, totalTareas, porcentajeProgreso,
            totalTareas - tareasCompletadasCount
        );
    }
    
    /**
     * Extrae el texto de una tarea específica por su número
     */
    private String extraerTextoTarea(String tareas, int numeroTarea) {
        if (tareas == null || tareas.isEmpty()) {
            return "Descripción no disponible";
        }
        
        String[] lineasTareas = tareas.split("\n");
        
        for (String linea : lineasTareas) {
            if (linea.trim().isEmpty()) continue;
            
            // Buscar línea que comience con el número de tarea
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^" + numeroTarea + "\\. (.+)");
            java.util.regex.Matcher matcher = pattern.matcher(linea.trim());
            
            if (matcher.find()) {
                return matcher.group(1); // Devolver solo el texto sin el número
            }
        }
        
        return "Tarea #" + numeroTarea;
    }
}