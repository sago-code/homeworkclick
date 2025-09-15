package com.ejemplo.chatgptwebhook.controller;

import com.ejemplo.chatgptwebhook.entities.Usuario;
import com.ejemplo.chatgptwebhook.model.LoginRequest;
import com.ejemplo.chatgptwebhook.model.UsuarioRequest;
import com.ejemplo.chatgptwebhook.service.UsuarioService;
import com.ejemplo.chatgptwebhook.util.JwtUtil;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@RequestBody UsuarioRequest request) {
        try {
            Usuario usuario = usuarioService.registrarUsuario(request);
            return ResponseEntity.ok(usuario);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUsuario(@RequestBody LoginRequest request) {
        try {
            Usuario usuario = usuarioService.autenticarUsuario(request.getEmail(), request.getPassword());
            
            if (usuario == null) {
                return ResponseEntity.badRequest().body("Credenciales inválidas");
            }
            
            // Generar token JWT
            String token = jwtUtil.generateToken(usuario.getEmail());
            
            // Crear respuesta con token y información del usuario
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("usuario", usuario);
            response.put("message", "Login exitoso");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}