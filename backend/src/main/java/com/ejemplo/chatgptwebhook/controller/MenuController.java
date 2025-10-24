package com.ejemplo.chatgptwebhook.controller;

import com.ejemplo.chatgptwebhook.model.MenuResponse;
import com.ejemplo.chatgptwebhook.service.MenuService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para gestionar las opciones del menú
 */
@RestController
@RequestMapping("/api/menu")
public class MenuController {
    
    private static final Logger logger = LoggerFactory.getLogger(MenuController.class);
    
    @Autowired
    private MenuService menuService;
    
    /**
     * Endpoint para obtener todas las opciones del menú principal
     * Usa el método mostrarMenuPrincipal con bucle do-while
     * 
     * @param sessionId ID de sesión para controlar el bucle do-while (opcional)
     * @return MenuResponse con todas las opciones disponibles
     */
    @GetMapping("/opciones")
    public ResponseEntity<MenuResponse> obtenerOpciones(@RequestParam(required = false) String sessionId) {
        
        try {
            MenuResponse menuResponse = null;
            
            if (sessionId != null && !sessionId.isEmpty()) {
                menuResponse = menuService.obtenerOpcionesMenu(sessionId);
            }
            
            return ResponseEntity.ok(menuResponse);
            
        } catch (Exception ex) {
            
            MenuResponse errorResponse = new MenuResponse(
                "Error al cargar el menú",
                null,
                "error"
            );
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    
    /**
     * Endpoint para procesar una opción seleccionada del menú
     * Usa el método procesarOpcion adaptado para web con control de sesión do-while
     * 
     * @param optionId El ID de la opción seleccionada
     * @param sessionId ID de sesión para controlar el bucle do-while (opcional)
     * @return Respuesta de la acción ejecutada
     */
    @PostMapping("/procesar/{optionId}")
    public ResponseEntity<String> procesarOpcionSeleccionada(@PathVariable int optionId, 
        @RequestParam(required = false) String sessionId,
        @RequestParam(required = false) Long userId) {

        try {
            String sid = (sessionId != null && !sessionId.isEmpty()) ? sessionId : "default_session";
            logger.info("📨 procesar/{}, sessionId={}, userId={}", optionId, sid, userId);
            if (userId != null) {
                menuService.setAdminUserForSession(sid, userId);
            } else {
                logger.warn("⚠️ userId ausente/invalid: se requiere login para persistir en BD");
            }

            String resultado;
            if (sessionId != null && !sessionId.isEmpty()) {
                resultado = menuService.procesarOpcionWeb(optionId, sessionId);
            } else {
                resultado = menuService.procesarOpcionWeb(optionId);
            }

            return ResponseEntity.ok(resultado);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Error al procesar la opción: " + ex.getMessage());
        }
    }
    
    /**
     * Endpoint para procesar una opción seleccionada del menú con datos adicionales
     * Usa el método procesarOpcion adaptado para web con datos
     * 
     * @param optionId El ID de la opción seleccionada
     * @param datos Los datos adicionales para la opción
     * @param sessionId ID de sesión para mantener contexto (opcional)
     * @return Respuesta de la acción ejecutada
     */
    @PostMapping("/procesar/{optionId}/datos")
    public ResponseEntity<String> procesarOpcionConDatos(@PathVariable int optionId, 
                                                        @RequestBody String datos,
                                                        @RequestParam(required = false) String sessionId,
                                                        @RequestParam(required = false) Long userId) {

        try {
            String sid = (sessionId != null && !sessionId.isEmpty()) ? sessionId : "default_session";
            logger.info("📨 procesar/{}/datos, sessionId={}, userId={}", optionId, sid, userId);
            if (userId != null) {
                menuService.setAdminUserForSession(sid, userId);
            } else {
                logger.warn("⚠️ userId ausente/invalid: se requiere login para persistir en BD");
            }

            String resultado;
            if (sessionId != null && !sessionId.isEmpty()) {
                resultado = menuService.procesarOpcionWebConDatosYSesion(optionId, datos, sessionId);
            } else {
                resultado = menuService.procesarOpcionWebConDatos(optionId, datos);
            }

            return ResponseEntity.ok(resultado);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Error al procesar la opción con datos: " + ex.getMessage());
        }
    }
    
    
    
}
