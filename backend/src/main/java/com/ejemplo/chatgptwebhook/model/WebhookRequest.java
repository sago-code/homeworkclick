package com.ejemplo.chatgptwebhook.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

/**
 * Modelo para las peticiones entrantes al webhook
 */
public class WebhookRequest {
    
    @NotBlank(message = "El mensaje no puede estar vacío")
    @JsonProperty("mensaje")
    private String mensaje;
    
    @JsonProperty("usuario")
    private String usuario;

    public WebhookRequest() {}

    public WebhookRequest(String mensaje, String usuario) {
        this.mensaje = mensaje;
        this.usuario = usuario;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    @Override
    public String toString() {
        return "WebhookRequest{" +
                "mensaje='" + mensaje + '\'' +
                ", usuario='" + usuario + '\'' +
                '}';
    }
}
