package com.ejemplo.chatgptwebhook.datastructures;

public class Grafo<T> {
    private TablaHash<T, ListaEnlazada<T>> listaAdyacencia;
    
    public Grafo() {
        listaAdyacencia = new TablaHash<>();
    }
    
    // Agregar un vértice al grafo
    public void agregarVertice(T vertice) {
        if (!listaAdyacencia.containsKey(vertice)) {
            listaAdyacencia.put(vertice, new ListaEnlazada<>());
        }
    }
    
    // Agregar una arista entre dos vértices
    public void agregarArista(T origen, T destino) {
        // Asegurar que ambos vértices existan
        agregarVertice(origen);
        agregarVertice(destino);
        
        // Agregar destino a la lista de adyacencia del origen
        ListaEnlazada<T> adyacentes = listaAdyacencia.get(origen);
        if (!adyacentes.contiene(destino)) {
            adyacentes.agregar(destino);
        }
    }
    
    // Verificar si existe una arista entre dos vértices
    public boolean existeArista(T origen, T destino) {
        if (!listaAdyacencia.containsKey(origen)) {
            return false;
        }
        
        return listaAdyacencia.get(origen).contiene(destino);
    }
    
    // Obtener todos los vértices adyacentes a un vértice
    public ListaEnlazada<T> obtenerAdyacentes(T vertice) {
        if (!listaAdyacencia.containsKey(vertice)) {
            return new ListaEnlazada<>();
        }
        
        return listaAdyacencia.get(vertice);
    }
    
    // Eliminar un vértice y todas sus aristas
    public void eliminarVertice(T vertice) {
        // Eliminar el vértice de la lista de adyacencia
        listaAdyacencia.remove(vertice);
        
        // Eliminar todas las aristas que apuntan a este vértice
        for (T v : obtenerVertices()) {
            ListaEnlazada<T> adyacentes = listaAdyacencia.get(v);
            adyacentes.eliminar(vertice);
        }
    }
    
    // Obtener todos los vértices del grafo
    public ListaEnlazada<T> obtenerVertices() {
        // Implementación simplificada - en una implementación real
        // se recorrerían todas las claves de la tabla hash
        ListaEnlazada<T> vertices = new ListaEnlazada<>();
        // Código para obtener todas las claves de la tabla hash
        return vertices;
    }
}