package com.ejemplo.chatgptwebhook.repository;

import com.ejemplo.chatgptwebhook.entities.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
}