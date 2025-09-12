package com.ejemplo.chatgptwebhook.repository;

import com.ejemplo.chatgptwebhook.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Optional<Usuario> findByEmail(String email);
}