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

import com.ejemplo.chatgptwebhook.model.ProjectCreateRequest;
import com.ejemplo.chatgptwebhook.model.ProjectDto;
import com.ejemplo.chatgptwebhook.model.TaskCreateRequest;
import com.ejemplo.chatgptwebhook.model.TaskDto;
// Estructuras de datos personalizadas ya presentes en tu proyecto
import com.ejemplo.chatgptwebhook.datastructures.TablaHash;
import com.ejemplo.chatgptwebhook.datastructures.ListaEnlazada;
import com.ejemplo.chatgptwebhook.datastructures.Trie;

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

    public ProjectDto createProject(ProjectCreateRequest req) {
        if (req == null) throw new IllegalArgumentException("Request vacío");
        if (req.getAdminUserId() == null) throw new IllegalArgumentException("adminUserId es requerido");
        if (req.getName() == null || req.getName().isBlank()) throw new IllegalArgumentException("name es requerido");

        Usuario admin = usuarioRepository.findById(req.getAdminUserId())
                .orElseThrow(() -> new IllegalArgumentException("Admin no encontrado"));

        Project project = new Project();
        project.setName(req.getName().trim());
        project.setDescription(sanitizeDescription(req.getDescription()));
        project.setCreatedBy(admin);

        project = projectRepository.save(project);

        // Usar estructuras de datos para normalizar/deduplicar tareas y tokenizarlas
        ListaEnlazada<String> lista = new ListaEnlazada<>();
        TablaHash<String, Boolean> seen = new TablaHash<>();
        Trie trie = new Trie();

        if (req.getTasks() != null) {
            for (String t : req.getTasks()) {
                if (t == null) continue;
                String clean = t.trim().replaceAll("\\s+", " ");
                if (!clean.isBlank() && seen.get(clean) == null) {
                    lista.agregar(clean);
                    seen.put(clean, Boolean.TRUE);
                    for (String token : clean.split("\\s+")) {
                        trie.insertar(token.replaceAll("[^a-zA-Z0-9]", "").toLowerCase());
                    }
                }
            }
        }

        // Persistir tareas deduplicadas y ordenadas
        java.util.List<TaskDto> taskDtos = new java.util.ArrayList<>();
        for (int i = 0; i < lista.tamaño(); i++) {
            String title = lista.obtener(i);
            Task task = new Task();
            task.setTitle(title);
            task.setStatus("pendiente"); // default acorde a entidad
            task.setPriority(2); // 1 alta, 2 media, 3 baja
            task.setProject(project);
            task = taskRepository.save(task);

            TaskDto td = new TaskDto();
            td.setId(task.getId());
            td.setTitle(task.getTitle());
            td.setStatus(task.getStatus());
            String priorityStr = task.getPriority() == null
                    ? "MEDIUM"
                    : (task.getPriority() == 1 ? "HIGH" : (task.getPriority() == 3 ? "LOW" : "MEDIUM"));
            td.setPriority(priorityStr);
            td.setDueDate(task.getDueDate() != null ? task.getDueDate().atStartOfDay() : null);
            td.setCreatedAt(task.getCreatedAt() != null
                    ? java.time.LocalDateTime.ofInstant(task.getCreatedAt(), java.time.ZoneId.systemDefault())
                    : null);
            td.setUpdatedAt(task.getUpdatedAt() != null
                    ? java.time.LocalDateTime.ofInstant(task.getUpdatedAt(), java.time.ZoneId.systemDefault())
                    : null);
            taskDtos.add(td);
        }

        // Construir DTO del proyecto
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setAdminUserId(admin.getId());
        dto.setAdminName(admin.getFirst_name() + " " + admin.getLast_name());
        dto.setTasksCount(taskDtos.size());
        dto.setCreatedAt(project.getCreatedAt() != null
                ? java.time.LocalDateTime.ofInstant(project.getCreatedAt(), java.time.ZoneId.systemDefault())
                : null);
        dto.setUpdatedAt(project.getUpdatedAt() != null
                ? java.time.LocalDateTime.ofInstant(project.getUpdatedAt(), java.time.ZoneId.systemDefault())
                : null);
        dto.setTasks(taskDtos);

        return dto;
    }

    public java.util.List<TaskDto> createTasksForProject(TaskCreateRequest req) {
        if (req == null) throw new IllegalArgumentException("Request vacío");
        if (req.getProjectId() == null) throw new IllegalArgumentException("projectId es requerido");
        if (req.getTasks() == null || req.getTasks().isEmpty()) throw new IllegalArgumentException("tasks es requerido");

        Project project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado"));

        // Usar estructuras de datos para normalizar/deduplicar tareas y tokenizarlas
        ListaEnlazada<String> lista = new ListaEnlazada<>();
        TablaHash<String, Boolean> seen = new TablaHash<>();
        Trie trie = new Trie();

        for (String t : req.getTasks()) {
            if (t == null) continue;
            String clean = t.trim().replaceAll("\\s+", " ");
            if (!clean.isBlank() && seen.get(clean) == null) {
                lista.agregar(clean);
                seen.put(clean, Boolean.TRUE);
                for (String token : clean.split("\\s+")) {
                    trie.insertar(token.replaceAll("[^a-zA-Z0-9]", "").toLowerCase());
                }
            }
        }

        // Persistir tareas deduplicadas y ordenadas
        java.util.List<TaskDto> taskDtos = new java.util.ArrayList<>();
        for (int i = 0; i < lista.tamaño(); i++) {
            String title = lista.obtener(i);
            Task task = new Task();
            task.setTitle(title);
            task.setStatus("pendiente"); // default
            task.setPriority(2); // 1 alta, 2 media, 3 baja
            task.setProject(project);
            task = taskRepository.save(task);

            TaskDto td = new TaskDto();
            td.setId(task.getId());
            td.setTitle(task.getTitle());
            td.setStatus(task.getStatus());
            String priorityStr = task.getPriority() == null
                    ? "MEDIUM"
                    : (task.getPriority() == 1 ? "HIGH" : (task.getPriority() == 3 ? "LOW" : "MEDIUM"));
            td.setPriority(priorityStr);
            td.setDueDate(task.getDueDate() != null ? task.getDueDate().atStartOfDay() : null);
            td.setCreatedAt(task.getCreatedAt() != null
                    ? java.time.LocalDateTime.ofInstant(task.getCreatedAt(), java.time.ZoneId.systemDefault())
                    : null);
            td.setUpdatedAt(task.getUpdatedAt() != null
                    ? java.time.LocalDateTime.ofInstant(task.getUpdatedAt(), java.time.ZoneId.systemDefault())
                    : null);
            taskDtos.add(td);
        }

        return taskDtos;
    }

    public java.util.List<ProjectDto> getProjectsForUser(Long userId, String role) {
        if (userId == null) throw new IllegalArgumentException("userId es requerido");
        if (role == null || role.isBlank()) throw new IllegalArgumentException("role es requerido");

        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new SecurityException("Rol no autorizado para listar proyectos");
        }

        java.util.List<Project> projects = getProjectsByAdmin(userId);
        java.util.List<ProjectDto> dtos = new java.util.ArrayList<>();

        for (Project p : projects) {
            ProjectDto dto = new ProjectDto();
            dto.setId(p.getId());
            dto.setName(p.getName());
            dto.setDescription(p.getDescription());

            Usuario admin = p.getCreatedBy();
            if (admin != null) {
                dto.setAdminUserId(admin.getId());
                dto.setAdminName(admin.getFirst_name() + " " + admin.getLast_name());
            }

            dto.setTasksCount(p.getTasks() != null ? p.getTasks().size() : 0);

            dto.setCreatedAt(p.getCreatedAt() != null
                    ? java.time.LocalDateTime.ofInstant(p.getCreatedAt(), java.time.ZoneId.systemDefault())
                    : null);
            dto.setUpdatedAt(p.getUpdatedAt() != null
                    ? java.time.LocalDateTime.ofInstant(p.getUpdatedAt(), java.time.ZoneId.systemDefault())
                    : null);

            dto.setTasks(null); // no cargamos tareas completas en este listado
            dtos.add(dto);
        }

        return dtos;
    }

    public java.util.List<TaskDto> getTasksDtoByProjectId(Long projectId) {
        java.util.List<com.ejemplo.chatgptwebhook.entities.Task> tasks = getTasksByProjectId(projectId);
        java.util.List<TaskDto> dtos = new java.util.ArrayList<>();
        for (com.ejemplo.chatgptwebhook.entities.Task task : tasks) {
            TaskDto td = new TaskDto();
            td.setId(task.getId());
            td.setTitle(task.getTitle());
            td.setStatus(task.getStatus());
            String priorityStr = task.getPriority() == null
                    ? "MEDIUM"
                    : (task.getPriority() == 1 ? "HIGH" : (task.getPriority() == 3 ? "LOW" : "MEDIUM"));
            td.setPriority(priorityStr);
            td.setDueDate(task.getDueDate() != null ? task.getDueDate().atStartOfDay() : null);
            td.setCreatedAt(task.getCreatedAt() != null
                    ? java.time.LocalDateTime.ofInstant(task.getCreatedAt(), java.time.ZoneId.systemDefault())
                    : null);
            td.setUpdatedAt(task.getUpdatedAt() != null
                    ? java.time.LocalDateTime.ofInstant(task.getUpdatedAt(), java.time.ZoneId.systemDefault())
                    : null);
            dtos.add(td);
        }
        return dtos;
    }

    public ProjectDto updateProject(Long projectId, com.ejemplo.chatgptwebhook.model.ProjectUpdateRequest req) {
        if (projectId == null) throw new IllegalArgumentException("projectId es requerido");
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado"));

        if (req.getName() != null && !req.getName().isBlank()) {
            project.setName(req.getName().trim());
        }
        if (req.getDescription() != null) {
            project.setDescription(sanitizeDescription(req.getDescription()));
        }

        project = projectRepository.save(project);

        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        Usuario admin = project.getCreatedBy();
        if (admin != null) {
            dto.setAdminUserId(admin.getId());
            dto.setAdminName(admin.getFirst_name() + " " + admin.getLast_name());
        }
        dto.setTasksCount(project.getTasks() != null ? project.getTasks().size() : 0);
        dto.setCreatedAt(project.getCreatedAt() != null
                ? java.time.LocalDateTime.ofInstant(project.getCreatedAt(), java.time.ZoneId.systemDefault())
                : null);
        dto.setUpdatedAt(project.getUpdatedAt() != null
                ? java.time.LocalDateTime.ofInstant(project.getUpdatedAt(), java.time.ZoneId.systemDefault())
                : null);
        dto.setTasks(null);
        return dto;
    }

    public TaskDto updateTask(Long taskId, com.ejemplo.chatgptwebhook.model.TaskUpdateRequest req) {
        if (taskId == null) throw new IllegalArgumentException("taskId es requerido");
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));

        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            task.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            task.setDescription(req.getDescription());
        }
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            task.setStatus(req.getStatus().trim().toLowerCase()); // "pendiente", "en_progreso", "completada"
        }
        if (req.getPriority() != null) {
            String p = req.getPriority().trim().toUpperCase();
            Integer pri = "HIGH".equals(p) ? 1 : ("LOW".equals(p) ? 3 : 2);
            task.setPriority(pri);
        }
        if (req.getDueDate() != null) {
            task.setDueDate(req.getDueDate());
        }

        task = taskRepository.save(task);

        TaskDto td = new TaskDto();
        td.setId(task.getId());
        td.setTitle(task.getTitle());
        td.setStatus(task.getStatus());
        String priorityStr = task.getPriority() == null
                ? "MEDIUM"
                : (task.getPriority() == 1 ? "HIGH" : (task.getPriority() == 3 ? "LOW" : "MEDIUM"));
        td.setPriority(priorityStr);
        td.setDueDate(task.getDueDate() != null ? task.getDueDate().atStartOfDay() : null);
        td.setCreatedAt(task.getCreatedAt() != null
                ? java.time.LocalDateTime.ofInstant(task.getCreatedAt(), java.time.ZoneId.systemDefault())
                : null);
        td.setUpdatedAt(task.getUpdatedAt() != null
                ? java.time.LocalDateTime.ofInstant(task.getUpdatedAt(), java.time.ZoneId.systemDefault())
                : null);
        return td;
    }
}