package com.ejemplo.chatgptwebhook.model;

public class LoginRequest {
    private final String email;
    private final String password;

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // Getters
    public String getEmail() { return email; }
    public String getPassword() { return password; }
}
