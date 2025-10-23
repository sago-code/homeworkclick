package com.ejemplo.chatgptwebhook.entities;

import java.sql.Timestamp;
import jakarta.persistence.*;

@Entity
@Table(
    name = "user_roles",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_role", columnNames = {"user_id", "role_id"})
    }
)
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK hacia Usuario (user_id)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_user_roles_usuario"))
    private Usuario user;

    // FK hacia Role (role_id)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_user_roles_role"))
    private Role role;

    @Column(name = "created_at", nullable = false)
    private Timestamp created_at;

    @Column(name = "updated_at", nullable = false)
    private Timestamp updated_at;

    public UserRole() {}

    public UserRole(Usuario user, Role role) {
        this.user = user;
        this.role = role;
    }

    @PrePersist
    protected void onCreate() {
        created_at = new Timestamp(System.currentTimeMillis());
        updated_at = new Timestamp(System.currentTimeMillis());
    }

    @PreUpdate
    protected void onUpdate() {
        updated_at = new Timestamp(System.currentTimeMillis());
    }

    // Getters y setters
    public Long getId() { return id; }
    public Usuario getUser() { return user; }
    public void setUser(Usuario user) { this.user = user; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Timestamp getCreated_at() { return created_at; }
    public Timestamp getUpdated_at() { return updated_at; }
}
