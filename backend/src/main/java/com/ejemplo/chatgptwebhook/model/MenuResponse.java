package com.ejemplo.chatgptwebhook.model;

import java.util.List;
import java.util.Collections;

/**
 * Modelo para la respuesta del menú principal
 */
public class MenuResponse {
    
    private final String titulo;
    private final List<MenuOption> opciones; // inmutable por copia defensiva
    private final String estado;

    public MenuResponse(String titulo, List<MenuOption> opciones, String estado) {
        this.titulo = titulo;
        this.opciones = opciones == null ? Collections.emptyList() : Collections.unmodifiableList(opciones);
        this.estado = estado;
    }

    // Getters solo-lectura con colecciones inmutables
    public String getTitulo() {
        return titulo;
    }

    public List<MenuOption> getOpciones() {
        return opciones;
    }

    public String getEstado() {
        return estado;
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
