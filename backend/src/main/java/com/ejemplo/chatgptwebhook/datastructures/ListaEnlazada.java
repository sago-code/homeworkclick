package com.ejemplo.chatgptwebhook.datastructures;

import java.util.Iterator;

public class ListaEnlazada<T> implements Iterable<T> {
    private Nodo<T> cabeza;
    private Nodo<T> cola;
    private int tamaño;
    
    public ListaEnlazada() {
        cabeza = null;
        cola = null;
        tamaño = 0;
    }
    
    // Agregar elemento al final de la lista
    public void agregar(T elemento) {
        Nodo<T> nuevoNodo = new Nodo<>(elemento);
        
        if (estaVacia()) {
            cabeza = nuevoNodo;
        } else {
            cola.siguiente = nuevoNodo;
        }
        
        cola = nuevoNodo;
        tamaño++;
    }
    
    // Agregar elemento al inicio de la lista
    public void agregarAlInicio(T elemento) {
        Nodo<T> nuevoNodo = new Nodo<>(elemento);
        
        if (estaVacia()) {
            cabeza = nuevoNodo;
            cola = nuevoNodo;
        } else {
            nuevoNodo.siguiente = cabeza;
            cabeza = nuevoNodo;
        }
        
        tamaño++;
    }
    
    // Obtener elemento en una posición específica
    public T obtener(int indice) {
        if (indice < 0 || indice >= tamaño) {
            throw new IndexOutOfBoundsException("Índice fuera de rango: " + indice);
        }
        
        Nodo<T> actual = cabeza;
        for (int i = 0; i < indice; i++) {
            actual = actual.siguiente;
        }
        
        return actual.dato;
    }
    
    // Verificar si la lista contiene un elemento
    public boolean contiene(T elemento) {
        Nodo<T> actual = cabeza;
        
        while (actual != null) {
            if (actual.dato.equals(elemento)) {
                return true;
            }
            actual = actual.siguiente;
        }
        
        return false;
    }
    
    // Eliminar un elemento de la lista
    public boolean eliminar(T elemento) {
        if (estaVacia()) {
            return false;
        }
        
        // Caso especial: eliminar la cabeza
        if (cabeza.dato.equals(elemento)) {
            cabeza = cabeza.siguiente;
            tamaño--;
            
            if (cabeza == null) {
                cola = null; // La lista quedó vacía
            }
            
            return true;
        }
        
        // Buscar el elemento a eliminar
        Nodo<T> actual = cabeza;
        while (actual.siguiente != null && !actual.siguiente.dato.equals(elemento)) {
            actual = actual.siguiente;
        }
        
        // Si se encontró el elemento
        if (actual.siguiente != null) {
            // Si es el último elemento, actualizar la cola
            if (actual.siguiente == cola) {
                cola = actual;
            }
            
            actual.siguiente = actual.siguiente.siguiente;
            tamaño--;
            return true;
        }
        
        return false; // Elemento no encontrado
    }
    
    public boolean estaVacia() {
        return cabeza == null;
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
    
    @Override
    public Iterator<T> iterator() {
        return new Iterator<T>() {
            private Nodo<T> actual = cabeza;
            
            @Override
            public boolean hasNext() {
                return actual != null;
            }
            
            @Override
            public T next() {
                if (!hasNext()) {
                    throw new java.util.NoSuchElementException();
                }
                T dato = actual.dato;
                actual = actual.siguiente;
                return dato;
            }
        };
    }
}