package com.ejemplo.chatgptwebhook.model;

public class UsuarioRequest {
    private final String email;
    private final String password;
    private final String first_name;
    private final String last_name;
    private final String address;
    private final String phone;

    public UsuarioRequest(String email, String password, String first_name, String last_name, String address, String phone) {
        this.email = email;
        this.password = password;
        this.first_name = first_name;
        this.last_name = last_name;
        this.address = address;
        this.phone = phone;
    }

    // Getters
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getFirst_name() { return first_name; }
    public String getLast_name() { return last_name; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
}