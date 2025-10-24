package com.ejemplo.chatgptwebhook.controller;

import com.ejemplo.chatgptwebhook.model.ProjectCreateRequest;
import com.ejemplo.chatgptwebhook.model.ProjectDto;
import com.ejemplo.chatgptwebhook.model.TaskCreateRequest;
import com.ejemplo.chatgptwebhook.model.TaskDto;
import com.ejemplo.chatgptwebhook.service.ProjectService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private static final Logger logger = LoggerFactory.getLogger(ProjectController.class);

    @Autowired
    private ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectDto> createProject(@RequestBody ProjectCreateRequest request) {
        logger.info("📦 Solicitud de creación de proyecto: {}", request != null ? request.getName() : "(null)");
        ProjectDto dto = projectService.createProject(request);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/tasks")
    public ResponseEntity<List<TaskDto>> createTasksForProject(@RequestBody TaskCreateRequest request) {
        logger.info("📋 Solicitud de creación de tareas para proyecto: {}", request != null ? request.getProjectId() : "(null)");
        List<TaskDto> tasks = projectService.createTasksForProject(request);
        return ResponseEntity.ok(tasks);
    }
    @GetMapping("/{projectId}/tasks")
    public ResponseEntity<java.util.List<TaskDto>> getTasksByProject(@PathVariable Long projectId) {
        java.util.List<TaskDto> tasks = projectService.getTasksDtoByProjectId(projectId);
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectDto> updateProject(
            @PathVariable Long projectId,
            @RequestBody com.ejemplo.chatgptwebhook.model.ProjectUpdateRequest request
    ) {
        ProjectDto dto = projectService.updateProject(projectId, request);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDto> updateTask(
            @PathVariable Long taskId,
            @RequestBody com.ejemplo.chatgptwebhook.model.TaskUpdateRequest request
    ) {
        TaskDto dto = projectService.updateTask(taskId, request);
        return ResponseEntity.ok(dto);
    }
    @GetMapping
    public ResponseEntity<?> getProjectsByUserAndRole(@RequestParam("userId") Long userId,
                                                      @RequestParam("role") String role) {
        try {
            List<ProjectDto> projects = projectService.getProjectsForUser(userId, role);
            return ResponseEntity.ok(projects);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(se.getMessage());
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(iae.getMessage());
        }
    }
}