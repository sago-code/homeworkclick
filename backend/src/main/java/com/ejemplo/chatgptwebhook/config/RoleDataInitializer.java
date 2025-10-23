package com.ejemplo.chatgptwebhook.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.ejemplo.chatgptwebhook.entities.Role;
import com.ejemplo.chatgptwebhook.repository.RoleRepository;

@Component
public class RoleDataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    public RoleDataInitializer(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {
        createIfMissing("ADMINISTRADOR");
        createIfMissing("EMPLEADO");
    }

    private void createIfMissing(String roleName) {
        roleRepository.findByRoleName(roleName)
            .orElseGet(() -> roleRepository.save(new Role(roleName)));
    }
}