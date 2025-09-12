package com.ejemplo.chatgptwebhook.service;

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

    public Usuario createUser(UsuarioRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        
        // Cifrar la contraseña antes de almacenarla
        String encryptedPassword = passwordService.encryptPassword(request.getPassword());
        usuario.setPassword(encryptedPassword);
        
        usuario.setFirst_name(request.getFirst_name());
        usuario.setLast_name(request.getLast_name());
        usuario.setAddress(request.getAddress());
        usuario.setPhone(request.getPhone());

        return usuarioRepository.save(usuario);
    }

    public Usuario authenticateUser(String email, String password) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado");
        }

        Usuario usuario = usuarioOpt.get();
        
        if (!passwordService.matches(password, usuario.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        return usuario;
    }
}