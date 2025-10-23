package com.ejemplo.chatgptwebhook.repository;

import com.ejemplo.chatgptwebhook.entities.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> { }