package com.ejemplo.chatgptwebhook.model;

import java.util.List;

/**
 * Modelo para la respuesta del menú principal
 */
public class MenuResponse {
    
    private String titulo;
    private List<MenuOption> opciones;
    private String estado;
    
    public MenuResponse() {}
    
    public MenuResponse(String titulo, List<MenuOption> opciones, String estado) {
        this.titulo = titulo;
        this.opciones = opciones;
        this.estado = estado;
    }
    
    // Getters y Setters
    public String getTitulo() {
        return titulo;
    }
    
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }
    
    public List<MenuOption> getOpciones() {
        return opciones;
    }
    
    public void setOpciones(List<MenuOption> opciones) {
        this.opciones = opciones;
    }
    
    public String getEstado() {
        return estado;
    }
    
    public void setEstado(String estado) {
        this.estado = estado;
    }
    
    @Override
    public String toString() {
        return "MenuResponse{" +
                "titulo='" + titulo + '\'' +
                ", opciones=" + opciones +
                ", estado='" + estado + '\'' +
                '}';
    }
}
