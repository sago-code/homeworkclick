package com.ejemplo.chatgptwebhook.model;

import com.ejemplo.chatgptwebhook.entities.Usuario;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;

/**
 * DTO inmutable para exponer información de Usuario sin campos sensibles
 */
public class UsuarioDto {

    @JsonProperty("id")
    private final Long id;

    @JsonProperty("first_name")
    private final String first_name;

    @JsonProperty("last_name")
    private final String last_name;

    @JsonProperty("email")
    private final String email;

    @JsonProperty("address")
    private final String address;

    @JsonProperty("phone")
    private final String phone;

    @JsonProperty("created_at")
    private final Timestamp created_at;

    @JsonProperty("updated_at")
    private final Timestamp updated_at;

    public UsuarioDto(Long id,
                      String first_name,
                      String last_name,
                      String email,
                      String address,
                      String phone,
                      Timestamp created_at,
                      Timestamp updated_at) {
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.address = address;
        this.phone = phone;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    public static UsuarioDto fromEntity(Usuario usuario) {
        if (usuario == null) return null;
        return new UsuarioDto(
                usuario.getId(),
                usuario.getFirst_name(),
                usuario.getLast_name(),
                usuario.getEmail(),
                usuario.getAddress(),
                usuario.getPhone(),
                usuario.getCreated_at(),
                usuario.getUpdated_at()
        );
    }

    public Long getId() { return id; }
    public String getFirst_name() { return first_name; }
    public String getLast_name() { return last_name; }
    public String getEmail() { return email; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public Timestamp getCreated_at() { return created_at; }
    public Timestamp getUpdated_at() { return updated_at; }
}


