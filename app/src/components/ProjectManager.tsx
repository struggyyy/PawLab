"use client";

import React, { useState, useEffect } from 'react';
import ProjectService from '../services/ProjectService';
import UserService from '../services/UserService';
import { Project } from '../models/Project';
import { Task } from '../models/Task';

const ProjectManager: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'niski' | 'średni' | 'wysoki'>('niski');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>(UserService.getUser().id);
    const user = UserService.getUser();

    useEffect(() => {
        setProjects(ProjectService.getProjects().filter(project => project.ownerId === currentUserId));
    }, [currentUserId]);

    useEffect(() => {
        if (currentProjectId) {
            setTasks(ProjectService.getTasks(currentProjectId));
        } else {
            setTasks([]);
        }
    }, [currentProjectId]);

    const handleAddOrUpdateTask = () => {
        if (editingTask) {
            ProjectService.updateTask({ ...editingTask, name, description, priority });
        } else {
            const newTask: Task = { 
                id: Date.now().toString(), 
                name, 
                description, 
                priority, 
                projectId: currentProjectId!, 
                createdAt: new Date(), 
                status: 'todo', 
                ownerId: user.id 
            };
            ProjectService.addTask(newTask);
        }
        setTasks(ProjectService.getTasks(currentProjectId!));
        setName('');
        setDescription('');
        setEditingTask(null);
    };

    const handleEditTask = (task: Task) => {
        setName(task.name);
        setDescription(task.description);
        setPriority(task.priority);
        setEditingTask(task);
    };

    const handleDeleteTask = (id: string) => {
        if (currentProjectId) {
            ProjectService.deleteTask(id, currentProjectId);
            setTasks(ProjectService.getTasks(currentProjectId));
        }
    };

    const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        setCurrentUserId(userId);
        UserService.setUser(userId);
        setCurrentProjectId(null);
        setTasks([]);
    };

    return (
        <div>
            <div className="user-project-container">
                <div className="user-select">
                    <h2>Użytkownik:</h2>
                    <select onChange={handleUserChange} value={currentUserId}>
                        {UserService.getUsers().map(u => (
                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                        ))}
                    </select>
                </div>
                <div className="project-select">
                    <h2>Projekt:</h2>
                    <select onChange={(e) => setCurrentProjectId(e.target.value)} value={currentProjectId || ''}>
                        <option value="" disabled>Wybierz projekt</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            {currentProjectId && (
                <div>
                    <h2>Dodaj nowy ticket:</h2>
                    <div className="ticket-form">
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa" />
                        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opis" />
                        <select onChange={(e) => setPriority(e.target.value as 'niski' | 'średni' | 'wysoki')} value={priority}>
                            <option value="niski">Niski</option>
                            <option value="średni">Średni</option>
                            <option value="wysoki">Wysoki</option>
                        </select>
                        <button onClick={handleAddOrUpdateTask}>{editingTask ? 'Zaktualizuj' : 'Dodaj'}</button>
                    </div>
                    <h2>Aktualny sprint:</h2>
                    <div className="tasks-grid">
                        {tasks.map(task => (
                            <div key={task.id} className="task-card">
                                <div className="task-name">{task.name}</div>
                                <div className="task-description">{task.description}</div>
                                <div className="task-priority">{task.priority}</div>
                                <div className="button-group">
                                    <button className="edit-button" onClick={() => handleEditTask(task)}>Edytuj</button>
                                    <button className="delete-button" onClick={() => handleDeleteTask(task.id)}>Usuń</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectManager;