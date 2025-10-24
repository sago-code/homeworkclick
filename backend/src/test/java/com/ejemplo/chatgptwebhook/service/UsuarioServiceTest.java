package com.ejemplo.chatgptwebhook.service;

import com.ejemplo.chatgptwebhook.entities.Usuario;
import com.ejemplo.chatgptwebhook.repository.UsuarioRepository;
import com.ejemplo.chatgptwebhook.repository.RoleRepository;
import com.ejemplo.chatgptwebhook.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {
    @Mock UsuarioRepository usuarioRepository;
    @Mock RoleRepository roleRepository;
    @Mock UserRoleRepository userRoleRepository;
    @Mock PasswordService passwordService;

    @InjectMocks UsuarioService usuarioService;

    @Test
    void autenticarUsuario_ok_cargaCache_y_no_reconsulta_DB_en_segundo_intento() {
        String email = "yttye@gmail.com";
        String pass = "12345678";
        Usuario u = new Usuario();
        u.setId(1L);
        u.setEmail(email);
        u.setPassword("$hash");

        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.of(u));
        when(passwordService.matches(pass, "$hash")).thenReturn(true);

        Usuario r1 = usuarioService.autenticarUsuario(email, pass);
        Assertions.assertNotNull(r1);
        Assertions.assertEquals(1L, r1.getId());

        Usuario r2 = usuarioService.autenticarUsuario(email, pass);
        Assertions.assertNotNull(r2);
        verify(usuarioRepository, times(1)).findByEmail(email);
    }

    @Test
    void autenticarUsuario_devuelveNull_si_password_incorrecta() {
        String email = "yttye@gmail.com";
        String pass = "wrongpass";
        Usuario u = new Usuario();
        u.setEmail(email);
        u.setPassword("$hash");

        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.of(u));
        when(passwordService.matches(pass, "$hash")).thenReturn(false);

        Usuario r = usuarioService.autenticarUsuario(email, pass);
        Assertions.assertNull(r);
    }

    @Test
    void autenticarUsuario_devuelveNull_si_usuario_no_existe() {
        String email = "noexiste@y.com";
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.empty());
        Usuario r = usuarioService.autenticarUsuario(email, "pass");
        Assertions.assertNull(r);
    }
}