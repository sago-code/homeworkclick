package com.ejemplo.chatgptwebhook.controller;

import com.ejemplo.chatgptwebhook.model.WebhookRequest;
import com.ejemplo.chatgptwebhook.model.WebhookResponse;
import com.ejemplo.chatgptwebhook.service.ChatGptService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Controlador REST para el webhook de ChatGPT
 */
@RestController
@RequestMapping("/webhook")
public class WebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WebhookController.class);

    @Autowired
    private ChatGptService chatGptService;

    /**
     * Endpoint principal del webhook para recibir mensajes y enviarlos a ChatGPT
     * 
     * @param request La petición con el mensaje del usuario
     * @return La respuesta con el mensaje de ChatGPT
     */
    @PostMapping("/chat")
    public Mono<ResponseEntity<WebhookResponse>> procesarMensaje(@Valid @RequestBody WebhookRequest request) {
        logger.info("Recibida petición del webhook: {}", request);

        return chatGptService.enviarMensaje(request.getMensaje())
                .map(respuestaChatGpt -> {
                    WebhookResponse response = new WebhookResponse(
                            respuestaChatGpt,
                            "exitoso",
                            request.getUsuario()
                    );
                    logger.info("Enviando respuesta: {}", response);
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(ex -> {
                    logger.error("Error al procesar el mensaje", ex);
                    WebhookResponse errorResponse = new WebhookResponse(
                            "Error al procesar tu mensaje",
                            "error",
                            request.getUsuario()
                    );
                    return Mono.just(ResponseEntity.internalServerError().body(errorResponse));
                });
    }

    /**
     * Endpoint de salud para verificar que el webhook está funcionando
     * 
     * @return Mensaje de estado
     */
    @GetMapping("/health")
    public ResponseEntity<WebhookResponse> verificarSalud() {
        logger.info("Verificación de salud del webhook");
        WebhookResponse response = new WebhookResponse(
                "Webhook funcionando correctamente",
                "activo",
                "sistema"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint de prueba para verificar la conectividad básica
     * 
     * @return Mensaje de prueba
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        logger.info("Endpoint de prueba accedido");
        return ResponseEntity.ok("¡Webhook de ChatGPT funcionando! Usa POST /webhook/chat para enviar mensajes.");
    }
}
