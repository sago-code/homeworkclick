package com.ejemplo.chatgptwebhook.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Modelo para las respuestas del webhook
 */
public class WebhookResponse {
    
    @JsonProperty("respuesta")
    private String respuesta;
    
    @JsonProperty("estado")
    private String estado;
    
    @JsonProperty("usuario")
    private String usuario;

    public WebhookResponse() {}

    public WebhookResponse(String respuesta, String estado, String usuario) {
        this.respuesta = respuesta;
        this.estado = estado;
        this.usuario = usuario;
    }

    public String getRespuesta() {
        return respuesta;
    }

    public void setRespuesta(String respuesta) {
        this.respuesta = respuesta;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
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
