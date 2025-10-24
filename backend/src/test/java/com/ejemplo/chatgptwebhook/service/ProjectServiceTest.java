package com.ejemplo.chatgptwebhook.service;

import com.ejemplo.chatgptwebhook.entities.Project;
import com.ejemplo.chatgptwebhook.entities.Task;
import com.ejemplo.chatgptwebhook.model.TaskCreateRequest;
import com.ejemplo.chatgptwebhook.model.TaskDto;
import com.ejemplo.chatgptwebhook.model.TaskUpdateRequest;
import com.ejemplo.chatgptwebhook.repository.ProjectRepository;
import com.ejemplo.chatgptwebhook.repository.TaskRepository;
import com.ejemplo.chatgptwebhook.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    ProjectRepository projectRepository;
    @Mock
    TaskRepository taskRepository;
    @Mock
    UsuarioRepository usuarioRepository;

    @InjectMocks
    ProjectService projectService;

    @Test
    void createTasksForProject_fails_whenTasksMissing() {
        TaskCreateRequest req = new TaskCreateRequest();
        req.setProjectId(1L);
        req.setTasks(null);

        IllegalArgumentException ex = Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> projectService.createTasksForProject(req)
        );
        Assertions.assertTrue(ex.getMessage().toLowerCase().contains("tasks es requerido"));
    }

    @Test
    void createTasksForProject_deduplicates_and_saves_normalized_tasks() {
        // Arrange
        Project project = new Project();
        project.setId(7L);
        when(projectRepository.findById(7L)).thenReturn(Optional.of(project));

        // Simular auto-asignación de ID al salvar
        final long[] seq = {1L};
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0, Task.class);
            t.setId(seq[0]++);
            return t;
        });

        TaskCreateRequest req = new TaskCreateRequest();
        req.setProjectId(7L);
        req.setTasks(List.of("arina", "arina   ", "comprar harina"));

        // Act
        List<TaskDto> dtos = projectService.createTasksForProject(req);

        // Assert: se deduplicó "arina" y se guardaron 2 tareas
        Assertions.assertEquals(2, dtos.size());

        // Verificar que se llamó a save exactamente 2 veces
        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository, times(2)).save(captor.capture());

        List<Task> saved = captor.getAllValues();
        List<String> titles = saved.stream().map(Task::getTitle).toList();
        Assertions.assertTrue(titles.contains("arina"));
        Assertions.assertTrue(titles.contains("comprar harina"));
    }

    @Test
    void getProjectsForUser_fails_for_non_admin_role() {
        SecurityException ex = Assertions.assertThrows(
                SecurityException.class,
                () -> projectService.getProjectsForUser(99L, "USER")
        );
        Assertions.assertTrue(ex.getMessage().toLowerCase().contains("no autorizado"));
    }

    @Test
    void updateTask_maps_priority_and_updates_fields() {
        Task existing = new Task();
        existing.setId(10L);
        existing.setTitle("Viejo título");
        existing.setStatus("pendiente");
        existing.setPriority(2);

        when(taskRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0, Task.class));

        TaskUpdateRequest req = new TaskUpdateRequest();
        req.setTitle("Nuevo título");
        req.setDescription("Descripción actualizada");
        req.setStatus("en_progreso");
        req.setPriority("HIGH");
        req.setDueDate(LocalDate.of(2025, 10, 24));

        TaskDto dto = projectService.updateTask(10L, req);

        Assertions.assertEquals("Nuevo título", dto.getTitle());
        Assertions.assertEquals("en_progreso", dto.getStatus());
        Assertions.assertEquals("HIGH", dto.getPriority()); // 1 -> HIGH
        Assertions.assertNotNull(dto.getDueDate());
    }
}