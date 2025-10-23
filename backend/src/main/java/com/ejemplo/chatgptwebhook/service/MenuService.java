package com.ejemplo.chatgptwebhook.service;

import com.ejemplo.chatgptwebhook.model.MenuOption;
import com.ejemplo.chatgptwebhook.model.MenuResponse;
import com.ejemplo.chatgptwebhook.datastructures.TablaHash;
import com.ejemplo.chatgptwebhook.datastructures.Grafo;
import com.ejemplo.chatgptwebhook.datastructures.ListaEnlazada;
import com.ejemplo.chatgptwebhook.datastructures.Cola;
import com.ejemplo.chatgptwebhook.datastructures.Trie;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
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

    private String limpiarConectoresIniciales(String texto) {
        if (texto == null) return null;
        String t = texto.trim();
        while (t.matches("^(de|sobre|para|un|una|uno|del|la|el|los|las)\\s+.*")) {
            t = t.replaceFirst("^(de|sobre|para|un|una|uno|del|la|el|los|las)\\s+", "").trim();
        }
        return t;
    }

    private String recortarFraseInicial(String texto) {
        if (texto == null) return null;
        String[] partes = texto.split("[\\.,;\\n]");
        return partes.length > 0 ? partes[0].trim() : texto.trim();
    }

    private boolean esMensajeErrorChatGpt(String s) {
        if (s == null) return true;
        String lower = s.toLowerCase();
        return lower.isBlank()
            || lower.contains("error procesando tu mensaje")
            || lower.contains("error al procesar tu mensaje")
            || lower.contains("error de autenticación")
            || lower.contains("no pude conectar con chatgpt")
            || lower.contains("ocurrió un error inesperado")
            || lower.contains("unauthorized")
            || lower.contains("401");
    }

    private String formatearNombreDesdeIdea(String idea) {
        if (idea == null) return null;
        String s = idea.trim();

        // Trabajo en minúsculas para detectar patrones, pero devuelvo capitalizado.
        String lower = s.toLowerCase();

        // Si contiene "proyecto" o términos similares, tomo lo que viene después
        String[] claves = new String[] { "proyecto", "app", "aplicacion", "aplicación", "sistema", "tienda", "web" };
        int idx = -1;
        String claveUsada = null;
        for (String k : claves) {
            int i = lower.indexOf(k);
            if (i >= 0 && (idx == -1 || i < idx)) {
                idx = i;
                claveUsada = k;
            }
        }

        String candidato;
        if (idx >= 0 && claveUsada != null) {
            // Después de "proyecto"/"app"/"aplicación"/...
            candidato = s.substring(idx + claveUsada.length()).trim();
            candidato = limpiarConectoresIniciales(candidato);
        } else {
            // Quita comandos iniciales: crea/creame/genera/generame/haz/quiero/necesito/…
            String sinComando = lower.replaceFirst(
                "^(crea(me)?|crear|genera(me)?|generar|haz(me)?|hacer|construye(me)?|construir|monta(me)?|montar|arma(me)?|armar|diseña(me)?|diseñar|quiero|necesito)\\s+(un|una|uno)?\\s*",
                ""
            );

            // También quita encabezados tipo "proyecto/app/sistema/..." si estuvieran al inicio
            sinComando = sinComando.replaceFirst("^(proyecto|app|aplicacion|aplicación|sistema|web|tienda)\\s+(de|sobre|para)?\\s*", "");
            sinComando = limpiarConectoresIniciales(sinComando);

            // Usa la versión original para conservar capitalización, alineando por longitud recortada
            int recorte = lower.length() - sinComando.length();
            candidato = s.substring(Math.min(recorte, s.length())).trim();
        }

        candidato = recortarFraseInicial(candidato);

        // Si quedó vacío o muy genérico, aborta
        if (candidato == null || candidato.isBlank()) return null;
        String gen = candidato.toLowerCase();
        if (gen.matches("^(crear|crea|genera|haz|hacer|generar|proyecto|app|aplicacion|aplicación|sistema|web|tienda)$")) {
            return null;
        }

        // Capitaliza palabras básicas
        String[] words = candidato.split("\\s+");
        StringBuilder title = new StringBuilder();
        for (String w : words) {
            if (w.isBlank()) continue;
            String cap = w.substring(0, 1).toUpperCase() + w.substring(1);
            title.append(cap).append(" ");
        }
        String nombre = title.toString().trim();

        // Limita longitud razonable
        if (nombre.length() > 80) {
            nombre = nombre.substring(0, 80).trim();
        }
        return nombre;
    }
    
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
    private final TablaHash<String, Trie> trieTareasPorSesion = new TablaHash<>();
    
    // Grafo para relaciones entre proyectos
    private final Grafo<String> relacionesProyectos = new Grafo<>();
    
    // Inyección del servicio de ChatGPT
    @Autowired
    private ChatGptService chatGptService;
    
    // NUEVO: servicio para persistir proyectos/tareas
    @Autowired
    private ProjectService projectService;
    
    // Lista enlazada: tareas ordenadas por sesión
    private final TablaHash<String, ListaEnlazada<String>> listaTareasPorSesion = new TablaHash<>();
    // Trie: indexa nombres de proyectos por admin
    private final TablaHash<Long, Trie> trieProyectosPorAdmin = new TablaHash<>();
    // Cola: encola nuevas tareas por sesión (se drena para sincronizar)
    private final TablaHash<String, Cola<String>> colaTareasPendientesPorSesion = new TablaHash<>();
    
    // Últimos proyectos para crear relaciones en el grafo
    private final TablaHash<String, String> ultimoProyectoPorSesion = new TablaHash<>();
    private final TablaHash<Long, String> ultimoProyectoPorAdmin = new TablaHash<>();
    
    // Mapa: sessionId -> admin userId
    private final Map<String, Long> adminUserIdPorSesion = new ConcurrentHashMap<>();
    
    // NUEVO: registrar el userId del admin para una sesión
    public void setAdminUserForSession(String sessionId, Long userId) {
        if (sessionId == null || sessionId.isBlank()) sessionId = "default_session";
        adminUserIdPorSesion.put(sessionId, userId);
    }
    
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
        String respuestaChatGPT = null;
        boolean esError = false;
        String nombreProyecto = null;
        String tareasExtraidas = null;
        String avisoPersistencia = "";

        try {
            String mensajeParaChatGPT = String.format(
                "El usuario tiene la siguiente idea de proyecto: \"%s\"\n\n" +
                "Eres un experto en arquitectura de software de proyectos. Por favor, ayúdalo a desarrollar y definir completamente este proyecto. " +
                "Proporciona 10 tareas principales que se deben realizar para desarrollar este proyecto:\n" +
                "Las tareas deben ser específicas y detalladas, y deben ser realizadas en orden cronológico.\n" +
                "Al final, indica claramente cuál sería el nombre específico del proyecto para usarlo como referencia.",
                ideaProyecto
            );

            logger.info("🤖 Enviando idea del proyecto a ChatGPT para sesión: {}", sessionId);

            respuestaChatGPT = chatGptService.enviarMensajeConTokens(mensajeParaChatGPT, 3000).block();
            esError = esMensajeErrorChatGpt(respuestaChatGPT);

            contextoyProyectoSesion.put(sessionId, respuestaChatGPT);

            nombreProyecto = extraerNombreProyecto(respuestaChatGPT);
            if (nombreProyecto == null || nombreProyecto.isBlank()) {
                // Fallback: si no hubo nombre desde ChatGPT, derivarlo desde la idea del usuario
            String derivado = formatearNombreDesdeIdea(ideaProyecto);
            if (derivado != null && !derivado.isBlank()) {
                nombreProyecto = derivado;
            }
            }
            nombreProyectoSesion.put(sessionId, nombreProyecto);
            logger.info("📝 Proyecto guardado en sesión {}: {}", sessionId, nombreProyecto);

            // Extraer y guardar las tareas del proyecto (solo si no hubo error)
            tareasExtraidas = esError ? null : extraerTareasProyecto(respuestaChatGPT);
            if (tareasExtraidas != null && !tareasExtraidas.isEmpty()) {
                tareasProyectoSesion.put(sessionId, tareasExtraidas);
                logger.info("📋 Tareas guardadas en sesión {}: {} tareas encontradas", sessionId, contarTareas(tareasExtraidas));

                // NUEVO: preparar líneas de tareas según haya error o no
                java.util.List<String> taskLines = (!esError && tareasExtraidas != null && !tareasExtraidas.isBlank())
                        ? java.util.Arrays.asList(tareasExtraidas.split("\r?\n"))
                        : java.util.Collections.emptyList();

                // Usar ListaEnlazada para mantener orden
                ListaEnlazada<String> lista = new ListaEnlazada<>();
                Trie trie = new Trie();

                for (String linea : taskLines) {
                    String l = linea.trim();
                    if (!l.isEmpty()) {
                        String texto = l.replaceFirst("^\\d+\\.\\s*", "");
                        lista.agregar(texto);
                        for (String token : texto.split("\\s+")) {
                            trie.insertar(token.replaceAll("[^a-zA-Z]", "").toLowerCase());
                        }
                    }
                }

                listaTareasPorSesion.put(sessionId, lista);
                trieTareasPorSesion.put(sessionId, trie);
            }

            logger.info("✅ Respuesta recibida de ChatGPT para idea de proyecto y contexto guardado");

            // Usar Grafo para relacionar proyectos consecutivos
            if (nombreProyecto != null && !nombreProyecto.isEmpty()) {
                relacionesProyectos.agregarVertice(nombreProyecto);

                String anteriorSesion = ultimoProyectoPorSesion.get(sessionId);
                if (anteriorSesion != null && !anteriorSesion.equals(nombreProyecto)) {
                    relacionesProyectos.agregarArista(anteriorSesion, nombreProyecto);
                }
                ultimoProyectoPorSesion.put(sessionId, nombreProyecto);

                Long adminUserIdLocal = adminUserIdPorSesion.get(sessionId);
                if (adminUserIdLocal != null) {
                    String anteriorAdmin = ultimoProyectoPorAdmin.get(adminUserIdLocal);
                    if (anteriorAdmin != null && !anteriorAdmin.equals(nombreProyecto)) {
                        relacionesProyectos.agregarArista(anteriorAdmin, nombreProyecto);
                    }
                    ultimoProyectoPorAdmin.put(adminUserIdLocal, nombreProyecto);

                    // Indexar nombre de proyecto en Trie por admin
                    Trie trieProyectos = trieProyectosPorAdmin.computeIfAbsent(adminUserIdLocal, id -> new Trie());
                    for (String token : nombreProyecto.split("\\s+")) {
                        trieProyectos.insertar(token.replaceAll("[^a-zA-Z]", "").toLowerCase());
                    }
                }
            }

            // Persistir en BD si existe adminUserId para esta sesión
            Long adminUserId = adminUserIdPorSesion.get(sessionId);
            avisoPersistencia = "";

            // NUEVO: preparar líneas de tareas (vacías si hubo error)
            java.util.List<String> taskLines = (!esError && tareasExtraidas != null && !tareasExtraidas.isBlank())
                ? java.util.Arrays.asList(tareasExtraidas.split("\r?\n"))
                : java.util.Collections.emptyList();
            if (esError) {
                avisoPersistencia = persistirProyectoMinimoSiPosible(adminUserId, nombreProyecto, ideaProyecto, sessionId);
            } else if (adminUserId != null && nombreProyecto != null && !nombreProyecto.isBlank()) {
                taskLines = (tareasExtraidas != null && !tareasExtraidas.isBlank())
                ? java.util.Arrays.asList(tareasExtraidas.split("\\r?\\n"))
                : java.util.Collections.emptyList();
                // Preview de las primeras tareas (si existen)
                String preview = taskLines.isEmpty()
                        ? "(sin tareas)"
                        : String.join(" | ", taskLines.subList(0, Math.min(3, taskLines.size())));
                logger.info("Persistencia -> preview primeras tareas: {}", preview);

                String descripcionParaBD = respuestaChatGPT; // solo si NO hubo error
                try {
                    projectService.createProjectForAdmin(
                            adminUserId,
                            nombreProyecto,
                            descripcionParaBD,
                            taskLines
                    );
                    avisoPersistencia = "✅ Proyecto guardado en base de datos.\n";
                } catch (Exception ex) {
                    logger.error("Error al persistir proyecto para adminUserId={} sesión={}: {}", adminUserId, sessionId, ex.getMessage(), ex);
                    avisoPersistencia = "❗ No se pudo guardar en base de datos: " + ex.getMessage() + "\n";
                }
            } else {
                logger.warn("No se pudo persistir proyecto: adminUserId ausente o nombreProyecto vacío para sesión {}", sessionId);
                avisoPersistencia = "ℹ️ No se guardó en BD: falta userId o nombre de proyecto.\n";
            }
            
            String cuerpoRespuesta = esError
                    ? String.format("🧭 Desarrollo básico a partir de tu idea.\n\n**Nombre del proyecto:** %s\n\n**Idea original:** %s\n", nombreProyecto, ideaProyecto)
                    : respuestaChatGPT;

            return "🚀 **PROYECTO DESARROLLADO**\n\n" + cuerpoRespuesta + "\n\n" +
                   avisoPersistencia +
                   "🎯 **Siguiente paso:** Puedes gestionar las tareas usando las opciones del menú principal\n\n" +
                   "MOSTRAR_MENU_PRINCIPAL";

        } catch (Exception e) {
            logger.error("❌ Error al comunicarse con ChatGPT para procesar idea de proyecto", e);
            return "🚀 **DESARROLLO DE PROYECTO**\n\n" +
                   "❌ No pude conectar con ChatGPT en este momento.\n\n" +
                   "💡 **Tu idea de proyecto:** " + ideaProyecto + "\n\n" +
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
            String tituloProyecto = nombreProyecto != null ? nombreProyecto : "Proyecto definido anteriormente";
            int numeroTareas = contarTareas(tareasExistentes);
    
            // NUEVO: preferir ListaEnlazada si existe
            ListaEnlazada<String> lista = listaTareasPorSesion.get(sessionId);
            String tareasParaMostrar = tareasExistentes;
            if (lista != null && !lista.estaVacia()) {
                StringBuilder sb = new StringBuilder();
                int i = 1;
                for (String t : lista) {
                    // Normalizamos para evitar numeración duplicada
                    String texto = t.replaceFirst("^\\d+\\.\\s*", "");
                    sb.append(i++).append(". ").append(texto).append("\n");
                }
                tareasParaMostrar = sb.toString().trim();
                numeroTareas = lista.tamaño();
            }
    
            return String.format(
                "📋 **GESTIÓN DE TAREAS: %s**\n\n" +
                "📊 **Tareas actuales:** %d tareas\n\n" +
                "**Lista de tareas:**\n%s\n\n" +
                "➕ **AGREGAR NUEVA TAREA**\n\n" +
                "💡 **Para agregar una nueva tarea:**\n" +
                "✍️ Escribe la descripción de la nueva tarea que quieres agregar al proyecto.\n\n" +
                "📝 **Ejemplo:** \"Configurar base de datos PostgreSQL\" o \"Implementar sistema de autenticación\"\n\n" +
                "🔄 **La nueva tarea se agregará automáticamente a la lista existente.**",
                tituloProyecto, numeroTareas, tareasParaMostrar
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
     * Sugiere tareas basadas en un prefijo usando el índice Trie
     */
    private String sugerirTareasPorPrefijo(String prefijo, String sessionId) {
        Trie trie = trieTareasPorSesion.get(sessionId);
        if (trie == null || prefijo == null || prefijo.isBlank()) {
            return "🔎 **Sugerencias**\n\nNo hay índice de tareas para esta sesión o el prefijo está vacío.\n\nMOSTRAR_MENU_PRINCIPAL";
        }

        ListaEnlazada<String> resultados = trie.buscarPorPrefijo(prefijo);
        if (resultados.estaVacia()) {
            return "🔎 **Sugerencias**\n\nNo se encontraron tareas que coincidan con el prefijo '" + prefijo + "'.\n\nMOSTRAR_MENU_PRINCIPAL";
        }

        StringBuilder sb = new StringBuilder("🔎 **Sugerencias por prefijo:** '" + prefijo + "'\n\n");
        int i = 1;
        for (String r : resultados) {
            sb.append(i++).append(".").append(r).append("\n");
        }
        sb.append("\nMOSTRAR_MENU_PRINCIPAL");
        return sb.toString();
    }

    /**
     * Versión web de crear tareas con datos específicos y sesión específica
     */
    private String crearTareasProyectoWebConDatosYSesion(String datos, String sessionId) {
        logger.info("📋 Procesando datos de tarea: {} - sesión: {}", datos, sessionId);
        
        // Si hay datos específicos, agregar como nueva tarea
        if (datos != null && !datos.trim().isEmpty()) {
            String valor = datos.trim();
            // Si es número: marcar como completada; si no: agregar o sugerir
            if (valor.matches("\\d+")) {
                int numeroTarea = Integer.parseInt(valor);
                return marcarTareaComoCompletada(numeroTarea, sessionId);
            } else {
                // Si el usuario pide sugerencias por prefijo: "sugerir: pre"
                if (valor.toLowerCase().startsWith("sugerir:")) {
                    String prefijo = valor.substring("sugerir:".length()).trim().toLowerCase();
                    return sugerirTareasPorPrefijo(prefijo, sessionId);
                }
                // Caso normal: agregar como nueva tarea
                return agregarNuevaTareaASesion(valor, sessionId);
            }
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
            // Fallback: consultar tareas persistidas en BD para el usuario de esta sesión
            Long adminUserId = adminUserIdPorSesion.get(sessionId);
            if (adminUserId != null) {
                java.util.List<com.ejemplo.chatgptwebhook.entities.Project> proyectos =
                        projectService.getProjectsByAdmin(adminUserId);
                if (proyectos != null && !proyectos.isEmpty()) {
                    com.ejemplo.chatgptwebhook.entities.Project ultimo =
                            proyectos.get(proyectos.size() - 1); // último por id/orden de inserción
                    java.util.List<com.ejemplo.chatgptwebhook.entities.Task> tareasDb =
                            projectService.getTasksByProjectId(ultimo.getId());

                    if (tareasDb != null && !tareasDb.isEmpty()) {
                        StringBuilder sb = new StringBuilder();
                        int i = 1;
                        for (com.ejemplo.chatgptwebhook.entities.Task t : tareasDb) {
                            String titulo = (t.getTitle() != null) ? t.getTitle() : "(sin título)";
                            String estado = (t.getStatus() != null) ? t.getStatus() : "pendiente";
                            sb.append(i++).append(". ").append(titulo)
                              .append(" - Estado: ").append(estado).append("\n");
                        }

                        return String.format(
                            "📋 **CONSULTAR TAREAS: %s**\n\n" +
                            "📊 **Tareas persistidas en BD:** %d\n\n" +
                            "**Lista de tareas (BD):**\n%s\n\n" +
                            "MOSTRAR_MENU_PRINCIPAL",
                            ultimo.getName(),
                            tareasDb.size(),
                            sb.toString().trim()
                        );
                    }

                    return String.format(
                        "📋 **CONSULTAR TAREAS: %s**\n\n" +
                        "❗ No hay tareas persistidas en BD para este proyecto.\n\n" +
                        "MOSTRAR_MENU_PRINCIPAL",
                        ultimo.getName()
                    );
                }

                return "📋 **CONSULTAR TAREAS DEL PROYECTO**\n\n" +
                       "❗ No hay proyectos persistidos en BD para tu usuario.\n\n" +
                       "MOSTRAR_MENU_PRINCIPAL";
            }

            return "📋 **CONSULTAR TAREAS DEL PROYECTO**\n\n" +
                   "❗ No hay tareas guardadas en esta sesión y no se detectó usuario logueado.\n\n" +
                   "MOSTRAR_MENU_PRINCIPAL";
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
    private String extraerNombreProyecto(String respuesta) {
        if (respuesta == null) return null;
        String[] lineas = respuesta.split("\\r?\\n");

        java.util.regex.Pattern[] patrones = new java.util.regex.Pattern[] {
            java.util.regex.Pattern.compile("(?i)^\\s*nombre\\s+(?:del\\s+)?proyecto\\s*[:\\-]\\s*(.+)\\s*$"),
            java.util.regex.Pattern.compile("(?i)^\\s*proyecto\\s*[:\\-]\\s*(.+)\\s*$"),
            java.util.regex.Pattern.compile("(?i)^\\s*título\\s*[:\\-]\\s*(.+)\\s*$")
        };

        for (String linea : lineas) {
            String l = linea.trim();
            for (java.util.regex.Pattern p : patrones) {
                java.util.regex.Matcher m = p.matcher(l);
                if (m.find()) {
                    String nombre = m.group(1).trim();
                    if (!nombre.isEmpty()) {
                        nombre = nombre.replaceAll("\\s*\\.$", "");
                        return nombre;
                    }
                }
            }
        }

        // Heurística: última línea si parece un título y no es viñeta ni mensaje de error/genérico
        String ultima = lineas[lineas.length - 1].trim();
        if (!ultima.isEmpty() && !ultima.matches("^(\\d+\\.|[\\-*]).*")) {
            String uLower = ultima.toLowerCase();
            if (!uLower.contains("proyecto definido con chatgpt")
                    && !uLower.contains("proyecto generado por chatgpt")
                    && !uLower.contains("error")) {
                return ultima;
            }
        }

        // Importante: devolver null para que el flujo use el nombre derivado de la idea del usuario
        return null;
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
    
    private String persistirProyectoMinimoSiPosible(Long adminUserId, String nombreProyecto, String ideaProyecto, String sessionId) {
        if (adminUserId != null && nombreProyecto != null && !nombreProyecto.isBlank()) {
            try {
                projectService.createProjectForAdmin(
                        adminUserId,
                        nombreProyecto,
                        ideaProyecto,
                        java.util.Collections.emptyList()
                );
                return "✅ Proyecto mínimo guardado en BD (ChatGPT falló, sin tareas).\n";
            } catch (Exception ex) {
                logger.error("Error al persistir proyecto mínimo para adminUserId={} sesión={}: {}", adminUserId, sessionId, ex.getMessage(), ex);
                return "❗ No se pudo guardar en base de datos: " + ex.getMessage() + "\n";
            }
        }
        return "ℹ️ No se guardó en BD porque hubo un error al generar el proyecto.\n";
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

        // Encolar tarea y drenar en orden
        Cola<String> cola = colaTareasPendientesPorSesion.computeIfAbsent(sessionId, s -> new Cola<>());
        cola.encolar(nuevaTarea);

        ListaEnlazada<String> lista = listaTareasPorSesion.get(sessionId);
        if (lista == null) {
            lista = new ListaEnlazada<>();
            listaTareasPorSesion.put(sessionId, lista);
        }

        Trie trie = trieTareasPorSesion.computeIfAbsent(sessionId, s -> new Trie());

        while (!cola.estaVacia()) {
            String tarea = cola.desencolar();
            lista.agregar(tarea);
            for (String token : tarea.split("\\s+")) {
                trie.insertar(token.replaceAll("[^a-zA-Z]", "").toLowerCase());
            }
            String prev = tareasProyectoSesion.get(sessionId);
            String nuevas = (prev == null || prev.trim().isEmpty()) ? ("1. " + tarea) : prev + "\n" + (contarTareas(prev) + 1) + ". " + tarea;
            tareasProyectoSesion.put(sessionId, nuevas);
        }

        return "✅ **Tarea agregada**: " + nuevaTarea + "\n\nMOSTRAR_MENU_PRINCIPAL";
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