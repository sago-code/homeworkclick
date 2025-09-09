package com.ejemplo.chatgptwebhook.repository;

import com.ejemplo.chatgptwebhook.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
}