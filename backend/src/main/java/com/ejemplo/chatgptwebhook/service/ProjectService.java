package com.ejemplo.chatgptwebhook.service;

import com.ejemplo.chatgptwebhook.entities.Project;
import com.ejemplo.chatgptwebhook.entities.Task;
import com.ejemplo.chatgptwebhook.entities.Usuario;
import com.ejemplo.chatgptwebhook.repository.ProjectRepository;
import com.ejemplo.chatgptwebhook.repository.TaskRepository;
import com.ejemplo.chatgptwebhook.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public Project createProjectForAdmin(Long adminUserId, String name, String description, List<String> tasksLines) {
        if (adminUserId == null) {
            throw new IllegalArgumentException("El userId del admin es requerido para crear proyectos");
        }

        Usuario admin = usuarioRepository.findById(adminUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario admin no encontrado para id=" + adminUserId));

        Project project = new Project();
        project.setName(name != null ? name : "Proyecto sin nombre");
        project.setDescription(sanitizeDescription(description));
        project.setCreatedBy(admin);

        Project saved = projectRepository.save(project);

        if (tasksLines != null && !tasksLines.isEmpty()) {
            for (String line : tasksLines) {
                if (line == null || line.isBlank()) continue;
                Task t = new Task();
                t.setProject(saved);
                t.setTitle(extractTitle(line));
                t.setDescription(line.trim());
                t.setStatus("pendiente");
                taskRepository.save(t);
            }
        }

        return saved;
    }

    private String extractTitle(String line) {
        String s = line.trim();
        if (s.matches("^\\d+\\.\\s+.*")) {
            s = s.replaceFirst("^\\d+\\.\\s+", "");
        }
        return s.length() > 255 ? s.substring(0, 255) : s;
    }

    private String sanitizeDescription(String description) {
        if (description == null) return null;
        return description.length() > 2000 ? description.substring(0, 2000) : description;
    }

    public List<Project> getProjectsByAdmin(Long adminUserId) {
        if (adminUserId == null) {
            throw new IllegalArgumentException("El userId del admin es requerido");
        }
        return projectRepository.findByCreatedById(adminUserId);
    }

    public List<Task> getTasksByProjectId(Long projectId) {
        if (projectId == null) {
            throw new IllegalArgumentException("El projectId es requerido");
        }
        return taskRepository.findByProjectId(projectId);
    }
}