package com.ejemplo.chatgptwebhook.model;

import java.time.LocalDate;

public class TaskUpdateRequest {
    private String title;
    private String description;
    private String status;   // esperado: "pendiente", "en_progreso", "completada"
    private String priority; // "HIGH", "MEDIUM", "LOW"
    private LocalDate dueDate;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
}