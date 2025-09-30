package com.ejemplo.chatgptwebhook.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * Modelo para las peticiones entrantes al webhook
 */
public class WebhookRequest {
    
    @NotBlank(message = "El mensaje no puede estar vacío")
    @JsonProperty("mensaje")
    private final String mensaje;
    
    @JsonProperty("usuario")
    private final String usuario;

    @JsonCreator
    public WebhookRequest(@JsonProperty("mensaje") String mensaje,
                          @JsonProperty("usuario") String usuario) {
        this.mensaje = mensaje;
        this.usuario = usuario;
    }

    public String getMensaje() {
        return mensaje;
    }

    public String getUsuario() {
        return usuario;
    }

    @Override
    public String toString() {
        return "WebhookRequest{" +
                "mensaje='" + mensaje + '\'' +
                ", usuario='" + usuario + '\'' +
                '}';
    }
}
