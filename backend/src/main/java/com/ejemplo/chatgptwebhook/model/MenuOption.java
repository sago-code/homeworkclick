package com.ejemplo.chatgptwebhook.model;

/**
 * Modelo para representar una opción del menú
 */
public class MenuOption {
    private final int id;
    private final String descripcion;
    private final String accion;

    public MenuOption(int id, String descripcion, String accion) {
        this.id = id;
        this.descripcion = descripcion;
        this.accion = accion;
    }

    // Getters solo-lectura
    public int getId() {
        return id;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public String getAccion() {
        return accion;
    }

    @Override
    public String toString() {
        return "MenuOption{" +
                "id=" + id +
                ", descripcion='" + descripcion + '\'' +
                ", accion='" + accion + '\'' +
                '}';
    }
}
