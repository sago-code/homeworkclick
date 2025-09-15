package com.ejemplo.chatgptwebhook.datastructures;

public class Cola<T> {
    private Nodo<T> frente;
    private Nodo<T> final_;
    private int tamaño;
    
    public Cola() {
        frente = null;
        final_ = null;
        tamaño = 0;
    }
    
    // Agregar elemento al final de la cola (enqueue)
    public void encolar(T elemento) {
        Nodo<T> nuevoNodo = new Nodo<>(elemento);
        
        if (estaVacia()) {
            frente = nuevoNodo;
        } else {
            final_.siguiente = nuevoNodo;
        }
        
        final_ = nuevoNodo;
        tamaño++;
    }
    
    // Remover y retornar el elemento del frente (dequeue)
    public T desencolar() {
        if (estaVacia()) {
            throw new IllegalStateException("La cola está vacía");
        }
        
        T elemento = frente.dato;
        frente = frente.siguiente;
        tamaño--;
        
        if (frente == null) {
            final_ = null; // La cola quedó vacía
        }
        
        return elemento;
    }
    
    // Ver el elemento del frente sin removerlo
    public T peek() {
        if (estaVacia()) {
            throw new IllegalStateException("La cola está vacía");
        }
        
        return frente.dato;
    }
    
    public boolean estaVacia() {
        return frente == null;
    }
    
    public int tamaño() {
        return tamaño;
    }
    
    private static class Nodo<T> {
        T dato;
        Nodo<T> siguiente;
        
        Nodo(T dato) {
            this.dato = dato;
            this.siguiente = null;
        }
    }
}