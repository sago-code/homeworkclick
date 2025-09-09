package com.ejemplo.chatgptwebhook.model;

/**
 * Modelo para representar una opción del menú
 */
public class MenuOption {
    
    private int id;
    private String descripcion;
    private String accion;
    
    public MenuOption() {}
    
    public MenuOption(int id, String descripcion, String accion) {
        this.id = id;
        this.descripcion = descripcion;
        this.accion = accion;
    }
    
    // Getters y Setters
    public int getId() {
        return id;
    }
    
    public void setId(int id) {
        this.id = id;
    }
    
    public String getDescripcion() {
        return descripcion;
    }
    
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
    
    public String getAccion() {
        return accion;
    }
    
    public void setAccion(String accion) {
        this.accion = accion;
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
