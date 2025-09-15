package com.ejemplo.chatgptwebhook.service;

import com.ejemplo.chatgptwebhook.datastructures.TablaHash;
import com.ejemplo.chatgptwebhook.datastructures.Cola;
import com.ejemplo.chatgptwebhook.entities.Usuario;
import com.ejemplo.chatgptwebhook.model.UsuarioRequest;
import com.ejemplo.chatgptwebhook.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private PasswordService passwordService;
    
    // Tabla hash para almacenar usuarios por email (para login rápido)
    private TablaHash<String, Usuario> usuariosPorEmail = new TablaHash<>();
    
    // Cola para procesamiento asíncrono de correos de verificación
    private Cola<String> colaCorreosVerificacion = new Cola<>();

    public Usuario registrarUsuario(UsuarioRequest request) {
        // Verificar si el email ya existe
        if (usuariosPorEmail.containsKey(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }
        
        // Crear nuevo usuario
        Usuario usuario = new Usuario();
        usuario.setFirst_name(request.getFirst_name());
        usuario.setLast_name(request.getLast_name());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordService.encryptPassword(request.getPassword()));
        usuario.setAddress(request.getAddress());
        usuario.setPhone(request.getPhone());
        
        // Guardar en base de datos
        Usuario usuarioGuardado = usuarioRepository.save(usuario);
        
        // Guardar en tabla hash para acceso rápido
        usuariosPorEmail.put(usuarioGuardado.getEmail(), usuarioGuardado);
        
        // Agregar a la cola de verificación de correos
        colaCorreosVerificacion.encolar(usuarioGuardado.getEmail());
        
        return usuarioGuardado;
    }

    public Usuario autenticarUsuario(String email, String password) {
        // Buscar usuario en la tabla hash (acceso rápido)
        Usuario usuario = usuariosPorEmail.get(email);
        
        // Si no está en la tabla hash, buscar en la base de datos
        if (usuario == null) {
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (usuarioOpt.isPresent()) {
                usuario = usuarioOpt.get();
                // Agregar a la tabla hash para futuros accesos
                usuariosPorEmail.put(email, usuario);
            } else {
                return null; // Usuario no encontrado
            }
        }
        
        // Verificar contraseña
        if (passwordService.matches(password, usuario.getPassword())) {
            return usuario;
        }
        
        return null; // Contraseña incorrecta
    }
    
    // Método para procesar la cola de correos de verificación
    public void procesarColaVerificacion() {
        while (!colaCorreosVerificacion.estaVacia()) {
            String email = colaCorreosVerificacion.desencolar();
            // Lógica para enviar correo de verificación
            System.out.println("Enviando correo de verificación a: " + email);
        }
    }
}