package com.ejemplo.chatgptwebhook.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.ejemplo.chatgptwebhook.entities.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleName(String roleName);
}