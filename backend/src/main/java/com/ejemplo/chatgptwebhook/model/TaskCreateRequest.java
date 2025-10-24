package com.ejemplo.chatgptwebhook.model;

import java.util.List;

public class TaskCreateRequest {
    private Long projectId;
    private List<String> tasks;

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public List<String> getTasks() { return tasks; }
    public void setTasks(List<String> tasks) { this.tasks = tasks; }
}