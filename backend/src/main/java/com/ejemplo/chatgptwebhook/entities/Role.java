package com.ejemplo.chatgptwebhook.entities;

import java.sql.Timestamp;
import jakarta.persistence.*;

@Entity
@Table(
    name = "roles",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_roles_role_name", columnNames = "role_name")
    }
)
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_name", nullable = false, length = 50)
    private String roleName;

    @Column(name = "created_at", nullable = false)
    private Timestamp created_at;

    @Column(name = "updated_at", nullable = false)
    private Timestamp updated_at;

    public Role() {}

    public Role(String roleName) {
        this.roleName = roleName;
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
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public Timestamp getCreated_at() { return created_at; }
    public Timestamp getUpdated_at() { return updated_at; }
}
