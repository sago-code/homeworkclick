package com.ejemplo.chatgptwebhook.service;

import com.ejemplo.chatgptwebhook.model.ChatGptRequest;
import com.ejemplo.chatgptwebhook.model.ChatGptResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Servicio para comunicarse con la API de ChatGPT
 */
@Service
public class ChatGptService {

    private static final Logger logger = LoggerFactory.getLogger(ChatGptService.class);

    private final WebClient webClient;
    @SuppressWarnings("unused")
    private final String apiKey;
    private final String model;

    public ChatGptService(@Value("${openai.api.key}") String apiKey,
                          @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}") String apiUrl,
                          @Value("${openai.model:gpt-3.5-turbo}") String model) {
        this.apiKey = apiKey;
        this.model = model;

        if (apiKey == null || apiKey.isBlank()) {
            logger.error("API key de OpenAI no configurada (openai.api.key).");
        }

        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    public Mono<String> enviarMensajeConTokens(String mensaje, int maxTokens) {
        logger.info("Enviando mensaje a ChatGPT con {} tokens máximo: {}", maxTokens, mensaje);
        List<Map<String, String>> messages = List.of(
            Map.of("role", "user", "content", mensaje)
        );
        ChatGptRequest request = new ChatGptRequest(
            model,
            messages,
            maxTokens,
            0.7
        );

        return webClient.post()
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ChatGptResponse.class)
                .map(response -> {
                    if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                        ChatGptResponse.Message message = response.getChoices().get(0).getMessage();
                        String content = message != null ? message.getContent() : "Sin respuesta";
                        logger.info("Respuesta recibida de ChatGPT ({} tokens solicitados): {} caracteres", maxTokens, content.length());
                        return content;
                    } else {
                        logger.warn("No se recibieron opciones en la respuesta de ChatGPT");
                        return "No pude generar una respuesta. Inténtalo de nuevo.";
                    }
                })
                .onErrorResume(WebClientResponseException.class, ex -> {
                    logger.error("Error al comunicarse con ChatGPT: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    if (ex.getStatusCode().value() == 401) {
                        return Mono.just("Error de autenticación con la API de OpenAI. Por favor, verifica la API key configurada.");
                    }
                    return Mono.just("Error al procesar tu mensaje. Por favor, inténtalo más tarde.");
                })
                .onErrorResume(Exception.class, ex -> {
                    logger.error("Error inesperado al comunicarse con ChatGPT", ex);
                    return Mono.just("Ocurrió un error inesperado. Por favor, inténtalo más tarde.");
                });
    }

    // Método repuesto: wrapper con tokens por defecto
    public Mono<String> enviarMensaje(String mensaje) {
        return enviarMensajeConTokens(mensaje, 512);
    }
}
