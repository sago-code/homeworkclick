package com.ejemplo.chatgptwebhook.controller;

class UsuarioControllerTest {
    @org.junit.jupiter.api.Test
    void login_ok_devuelve_token_y_usuarioDto() {
        com.ejemplo.chatgptwebhook.service.UsuarioService usuarioService = org.mockito.Mockito.mock(com.ejemplo.chatgptwebhook.service.UsuarioService.class);
        com.ejemplo.chatgptwebhook.util.JwtUtil jwtUtil = org.mockito.Mockito.mock(com.ejemplo.chatgptwebhook.util.JwtUtil.class);
        UsuarioController controller = new UsuarioController();

        // inyecta mocks
        try {
            java.lang.reflect.Field f1 = UsuarioController.class.getDeclaredField("usuarioService");
            f1.setAccessible(true);
            f1.set(controller, usuarioService);
            java.lang.reflect.Field f2 = UsuarioController.class.getDeclaredField("jwtUtil");
            f2.setAccessible(true);
            f2.set(controller, jwtUtil);
        } catch (Exception e) { throw new RuntimeException(e); }

        com.ejemplo.chatgptwebhook.entities.Usuario u = new com.ejemplo.chatgptwebhook.entities.Usuario();
        u.setId(1L);
        u.setEmail("yttye@gmail.com");
        u.setFirst_name("Ada");
        u.setLast_name("Lovelace");

        org.mockito.Mockito.when(usuarioService.autenticarUsuario("yttye@gmail.com", "12345678")).thenReturn(u);
        org.mockito.Mockito.when(jwtUtil.generateToken("yttye@gmail.com")).thenReturn("tok123");

        org.springframework.http.ResponseEntity<?> resp =
                controller.loginUsuario(new com.ejemplo.chatgptwebhook.model.LoginRequest("yttye@gmail.com", "12345678"));

        org.junit.jupiter.api.Assertions.assertEquals(200, resp.getStatusCode().value());

        Object body = resp.getBody();
        org.junit.jupiter.api.Assertions.assertTrue(body instanceof java.util.Map);
        java.util.Map<?,?> map = (java.util.Map<?,?>) body;
        org.junit.jupiter.api.Assertions.assertEquals("tok123", map.get("token"));
        org.junit.jupiter.api.Assertions.assertEquals("Login exitoso", map.get("message"));

        Object usuarioDto = map.get("usuario");
        org.junit.jupiter.api.Assertions.assertNotNull(usuarioDto);
    }

    @org.junit.jupiter.api.Test
    void login_falla_con_badRequest_si_credenciales_invalidas() {
        com.ejemplo.chatgptwebhook.service.UsuarioService usuarioService = org.mockito.Mockito.mock(com.ejemplo.chatgptwebhook.service.UsuarioService.class);
        com.ejemplo.chatgptwebhook.util.JwtUtil jwtUtil = org.mockito.Mockito.mock(com.ejemplo.chatgptwebhook.util.JwtUtil.class);
        UsuarioController controller = new UsuarioController();

        try {
            java.lang.reflect.Field f1 = UsuarioController.class.getDeclaredField("usuarioService");
            f1.setAccessible(true);
            f1.set(controller, usuarioService);
            java.lang.reflect.Field f2 = UsuarioController.class.getDeclaredField("jwtUtil");
            f2.setAccessible(true);
            f2.set(controller, jwtUtil);
        } catch (Exception e) { throw new RuntimeException(e); }

        org.mockito.Mockito.when(usuarioService.autenticarUsuario("yttye@gmail.com", "wrongpass")).thenReturn(null);

        org.springframework.http.ResponseEntity<?> resp =
                controller.loginUsuario(new com.ejemplo.chatgptwebhook.model.LoginRequest("yttye@gmail.com", "wrongpass"));

        org.junit.jupiter.api.Assertions.assertEquals(400, resp.getStatusCode().value());
        org.junit.jupiter.api.Assertions.assertEquals("Credenciales inválidas", resp.getBody());
    }
}