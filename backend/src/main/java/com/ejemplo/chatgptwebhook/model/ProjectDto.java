package com.ejemplo.chatgptwebhook.model;

import java.time.LocalDateTime;
import java.util.List;

public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private Long adminUserId;
    private String adminName;
    private Integer tasksCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TaskDto> tasks;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getAdminUserId() { return adminUserId; }
    public void setAdminUserId(Long adminUserId) { this.adminUserId = adminUserId; }

    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

    public Integer getTasksCount() { return tasksCount; }
    public void setTasksCount(Integer tasksCount) { this.tasksCount = tasksCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<TaskDto> getTasks() { return tasks; }
    public void setTasks(List<TaskDto> tasks) { this.tasks = tasks; }
}