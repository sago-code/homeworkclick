package com.ejemplo.chatgptwebhook;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // 👈 Acepta CORS en todos los endpoints
                        .allowedOriginPatterns("*") // 👈 Usa allowedOriginPatterns en lugar de allowedOrigins
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        .allowedHeaders("*")
                        .exposedHeaders("Authorization") // 👈 si usas JWT en headers
                        .allowCredentials(true);
            }
        };
    }
}
