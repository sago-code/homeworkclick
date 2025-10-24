package com.ejemplo.chatgptwebhook.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class UsuarioRequest {
    private final String email;
    private final String password;
    private final String first_name;
    private final String last_name;
    private final String address;
    private final String phone;
    // NUEVO: rol opcional (por nombre)
    private final String role;

    @JsonCreator
    public UsuarioRequest(
            @JsonProperty("email") String email,
            @JsonProperty("password") String password,
            @JsonProperty("first_name") String first_name,
            @JsonProperty("last_name") String last_name,
            @JsonProperty("address") String address,
            @JsonProperty("phone") String phone,
            @JsonProperty(value = "role", required = false) String role
    ) {
        this.email = email;
        this.password = password;
        this.first_name = first_name;
        this.last_name = last_name;
        this.address = address;
        this.phone = phone;
        this.role = role; // puede venir null
    }

    // Getters
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getFirst_name() { return first_name; }
    public String getLast_name() { return last_name; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getRole() { return role; }
}