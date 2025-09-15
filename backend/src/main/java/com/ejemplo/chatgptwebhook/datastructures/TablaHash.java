package com.ejemplo.chatgptwebhook.datastructures;

public class TablaHash<K, V> {
    private static final int CAPACIDAD_INICIAL = 16;
    private static final double FACTOR_CARGA = 0.75;
    
    private Entry<K, V>[] tabla;
    private int tamaño;
    
    public TablaHash() {
        tabla = new Entry[CAPACIDAD_INICIAL];
        tamaño = 0;
    }
    
    public void put(K clave, V valor) {
        if (clave == null) throw new IllegalArgumentException("La clave no puede ser nula");
        
        // Verificar si es necesario redimensionar
        if ((double) tamaño / tabla.length >= FACTOR_CARGA) {
            redimensionar();
        }
        
        int indice = obtenerIndice(clave);
        
        // Si la posición está vacía, crear nueva entrada
        if (tabla[indice] == null) {
            tabla[indice] = new Entry<>(clave, valor, null);
            tamaño++;
            return;
        }
        
        // Buscar si la clave ya existe
        Entry<K, V> actual = tabla[indice];
        Entry<K, V> anterior = null;
        
        while (actual != null) {
            if (actual.clave.equals(clave)) {
                actual.valor = valor; // Actualizar valor si la clave existe
                return;
            }
            anterior = actual;
            actual = actual.siguiente;
        }
        
        // Agregar nueva entrada al final de la lista
        anterior.siguiente = new Entry<>(clave, valor, null);
        tamaño++;
    }
    
    public V get(K clave) {
        if (clave == null) return null;
        
        int indice = obtenerIndice(clave);
        Entry<K, V> actual = tabla[indice];
        
        while (actual != null) {
            if (actual.clave.equals(clave)) {
                return actual.valor;
            }
            actual = actual.siguiente;
        }
        
        return null; // Clave no encontrada
    }
    
    public boolean containsKey(K clave) {
        return get(clave) != null;
    }
    
    public V remove(K clave) {
        if (clave == null) return null;
        
        int indice = obtenerIndice(clave);
        Entry<K, V> actual = tabla[indice];
        Entry<K, V> anterior = null;
        
        while (actual != null) {
            if (actual.clave.equals(clave)) {
                if (anterior == null) {
                    tabla[indice] = actual.siguiente;
                } else {
                    anterior.siguiente = actual.siguiente;
                }
                tamaño--;
                return actual.valor;
            }
            anterior = actual;
            actual = actual.siguiente;
        }
        
        return null; // Clave no encontrada
    }
    
    public int size() {
        return tamaño;
    }
    
    public V computeIfAbsent(K clave, java.util.function.Function<? super K, ? extends V> mappingFunction) {
        V valor = get(clave);
        if (valor == null) {
            valor = mappingFunction.apply(clave);
            if (valor != null) {
                put(clave, valor);
            }
        }
        return valor;
    }
    
    public ListaEnlazada<K> keySet() {
        ListaEnlazada<K> claves = new ListaEnlazada<>();
        
        for (Entry<K, V> entrada : tabla) {
            Entry<K, V> actual = entrada;
            while (actual != null) {
                claves.agregar(actual.clave);
                actual = actual.siguiente;
            }
        }
        
        return claves;
    }
    
    public V getOrDefault(K clave, V valorPredeterminado) {
        V valor = get(clave);
        return (valor != null) ? valor : valorPredeterminado;
    }
    
    private int obtenerIndice(K clave) {
        return Math.abs(clave.hashCode()) % tabla.length;
    }
    
    private void redimensionar() {
        Entry<K, V>[] tablaAntigua = tabla;
        tabla = new Entry[tablaAntigua.length * 2];
        tamaño = 0;
        
        // Reinserta todas las entradas en la nueva tabla
        for (Entry<K, V> entrada : tablaAntigua) {
            Entry<K, V> actual = entrada;
            while (actual != null) {
                put(actual.clave, actual.valor);
                actual = actual.siguiente;
            }
        }
    }
    
    private static class Entry<K, V> {
        K clave;
        V valor;
        Entry<K, V> siguiente;
        
        Entry(K clave, V valor, Entry<K, V> siguiente) {
            this.clave = clave;
            this.valor = valor;
            this.siguiente = siguiente;
        }
    }
}