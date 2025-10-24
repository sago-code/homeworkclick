package com.ejemplo.chatgptwebhook.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Modelo para las respuestas del webhook
 */
public class WebhookResponse {
    
    @JsonProperty("respuesta")
    private final String respuesta;
    
    @JsonProperty("estado")
    private final String estado;
    
    @JsonProperty("usuario")
    private final String usuario;

    public WebhookResponse(String respuesta, String estado, String usuario) {
        this.respuesta = respuesta;
        this.estado = estado;
        this.usuario = usuario;
    }

    public String getRespuesta() {
        return respuesta;
    }

    public String getEstado() {
        return estado;
    }

    public String getUsuario() {
        return usuario;
    }

    @Override
    public String toString() {
        return "WebhookResponse{" +
                "respuesta='" + respuesta + '\'' +
                ", estado='" + estado + '\'' +
                ", usuario='" + usuario + '\'' +
                '}';
    }
}
