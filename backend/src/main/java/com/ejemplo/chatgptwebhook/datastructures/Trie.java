package com.ejemplo.chatgptwebhook.datastructures;

public class Trie {
    private NodoTrie raiz;
    
    public Trie() {
        raiz = new NodoTrie();
    }
    
    // Insertar una palabra en el Trie
    public void insertar(String palabra) {
        if (palabra == null || palabra.isEmpty()) {
            return;
        }
        
        NodoTrie actual = raiz;
        
        for (char c : palabra.toLowerCase().toCharArray()) {
            int indice = c - 'a';
            
            // Manejar caracteres fuera del rango a-z
            if (indice < 0 || indice >= 26) {
                continue;
            }
            
            if (actual.hijos[indice] == null) {
                actual.hijos[indice] = new NodoTrie();
            }
            
            actual = actual.hijos[indice];
        }
        
        actual.esFinPalabra = true;
    }
    
    // Buscar si una palabra existe en el Trie
    public boolean buscar(String palabra) {
        if (palabra == null || palabra.isEmpty()) {
            return false;
        }
        
        NodoTrie nodo = obtenerNodo(palabra);
        return nodo != null && nodo.esFinPalabra;
    }
    
    // Verificar si existe alguna palabra con el prefijo dado
    public boolean existePrefijo(String prefijo) {
        if (prefijo == null || prefijo.isEmpty()) {
            return false;
        }
        
        return obtenerNodo(prefijo) != null;
    }
    
    // Obtener todas las palabras que comienzan con un prefijo
    public ListaEnlazada<String> buscarPorPrefijo(String prefijo) {
        ListaEnlazada<String> resultados = new ListaEnlazada<>();
        
        if (prefijo == null || prefijo.isEmpty()) {
            return resultados;
        }
        
        NodoTrie nodo = obtenerNodo(prefijo);
        
        if (nodo != null) {
            recolectarPalabras(nodo, new StringBuilder(prefijo), resultados);
        }
        
        return resultados;
    }
    
    // Método auxiliar para obtener el nodo correspondiente a un prefijo
    private NodoTrie obtenerNodo(String prefijo) {
        NodoTrie actual = raiz;
        
        for (char c : prefijo.toLowerCase().toCharArray()) {
            int indice = c - 'a';
            
            // Manejar caracteres fuera del rango a-z
            if (indice < 0 || indice >= 26) {
                return null;
            }
            
            if (actual.hijos[indice] == null) {
                return null;
            }
            
            actual = actual.hijos[indice];
        }
        
        return actual;
    }
    
    // Método auxiliar para recolectar todas las palabras a partir de un nodo
    private void recolectarPalabras(NodoTrie nodo, StringBuilder prefijo, ListaEnlazada<String> resultados) {
        if (nodo.esFinPalabra) {
            resultados.agregar(prefijo.toString());
        }
        
        for (int i = 0; i < 26; i++) {
            if (nodo.hijos[i] != null) {
                char c = (char) ('a' + i);
                prefijo.append(c);
                recolectarPalabras(nodo.hijos[i], prefijo, resultados);
                prefijo.deleteCharAt(prefijo.length() - 1); // Backtracking
            }
        }
    }
    
    private static class NodoTrie {
        NodoTrie[] hijos;
        boolean esFinPalabra;
        
        NodoTrie() {
            hijos = new NodoTrie[26]; // Solo letras minúsculas a-z
            esFinPalabra = false;
        }
    }
}