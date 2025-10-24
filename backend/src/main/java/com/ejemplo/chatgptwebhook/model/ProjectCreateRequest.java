package com.ejemplo.chatgptwebhook.model;

import java.util.List;

public class ProjectCreateRequest {
    private String name;
    private String description;
    private Long adminUserId;
    private List<String> tasks;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getAdminUserId() { return adminUserId; }
    public void setAdminUserId(Long adminUserId) { this.adminUserId = adminUserId; }

    public List<String> getTasks() { return tasks; }
    public void setTasks(List<String> tasks) { this.tasks = tasks; }
}