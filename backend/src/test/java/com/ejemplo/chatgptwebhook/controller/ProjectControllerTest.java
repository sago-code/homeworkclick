package com.ejemplo.chatgptwebhook.controller;

import com.ejemplo.chatgptwebhook.model.TaskUpdateRequest;
import com.ejemplo.chatgptwebhook.model.TaskDto;
import com.ejemplo.chatgptwebhook.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assertions;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;

class ProjectControllerTest {
    @Test
    void updateTask_ok_mapea_prioridad_y_campos() {
        ProjectService svc = Mockito.mock(ProjectService.class);
        ProjectController ctrl = new ProjectController();
        // ... existing code ...
        try {
            var f = ProjectController.class.getDeclaredField("projectService");
            f.setAccessible(true);
            f.set(ctrl, svc);
        } catch (Exception e) { throw new RuntimeException(e); }
        // ... existing code ...

        TaskUpdateRequest req = new TaskUpdateRequest();
        req.setTitle("Nueva");
        req.setStatus("completada");
        req.setPriority("HIGH");

        TaskDto dto = new TaskDto();
        dto.setId(9L);
        dto.setTitle("Nueva");
        dto.setStatus("completada");
        dto.setPriority("HIGH");

        Mockito.when(svc.updateTask(9L, req)).thenReturn(dto);

        ResponseEntity<TaskDto> resp = ctrl.updateTask(9L, req);
        Assertions.assertEquals(200, resp.getStatusCode().value());
        Assertions.assertEquals("HIGH", resp.getBody().getPriority());
        Assertions.assertEquals("completada", resp.getBody().getStatus());
        Assertions.assertEquals("Nueva", resp.getBody().getTitle());
    }
}