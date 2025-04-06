"use client";

import React, { useState, useEffect } from 'react';
import ProjectService from '../services/ProjectService';
import UserService from '../services/UserService';
import { TaskService } from '../services/TaskService';
import { Project } from '../models/Project';
import { Task } from '../models/TaskModel';
import KanbanBoard from './KanbanBoard';

const ProjectManager: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [taskFormVisible, setTaskFormVisible] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const currentUserId = UserService.getUser().id;
    const [assignedUserId, setAssignedUserId] = useState<string | undefined>(undefined);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'niski' | 'średni' | 'wysoki'>('średni');
    const [newTaskEstimatedTime, setNewTaskEstimatedTime] = useState(0);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    
    const availableUsers = UserService.getUsers().filter(
        user => user.role === 'developer' || user.role === 'devops'
    );

    useEffect(() => {
        setProjects(ProjectService.getProjects().filter(project => project.ownerId === currentUserId));
        const loadedTasks = TaskService.getTasks();
        setTasks(loadedTasks);
    }, [currentUserId]);

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) {
            alert('Title is required');
            return;
        }

        const now = new Date();
        
        if (editingTaskId) {
            // Update existing task
            const updatedTask: Task = {
                ...tasks.find(t => t.id === editingTaskId)!,
                title: newTaskTitle,
                description: newTaskDescription,
                priority: newTaskPriority,
                estimatedTime: newTaskEstimatedTime,
                assignedTo: assignedUserId,
                // If we're assigning a user and the task is in todo status, change to doing
                status: (assignedUserId && tasks.find(t => t.id === editingTaskId)?.status === 'todo')
                    ? 'doing' 
                    : tasks.find(t => t.id === editingTaskId)?.status || 'todo',
                startDate: (assignedUserId && !tasks.find(t => t.id === editingTaskId)?.startDate)
                    ? now
                    : tasks.find(t => t.id === editingTaskId)?.startDate
            };
            
            const updatedTasks = tasks.map(task => 
                task.id === editingTaskId ? updatedTask : task
            );
            
            setTasks(updatedTasks);
            TaskService.updateTask(updatedTask);
            setRefreshKey(old => old + 1);
        } else {
            // Create new task
            const newTask: Task = {
                id: Date.now().toString(),
                title: newTaskTitle,
                description: newTaskDescription,
                priority: newTaskPriority,
                status: assignedUserId ? 'doing' : 'todo',
                workedHours: 0,
                estimatedTime: newTaskEstimatedTime,
                createdAt: now,
                startDate: assignedUserId ? now : undefined,
                endDate: undefined,
                assignedTo: assignedUserId,
                storyId: currentProjectId || ''
            };
            
            const newTasks = [...tasks, newTask];
            setTasks(newTasks);
            TaskService.createTask(newTask);
            setRefreshKey(old => old + 1);
        }
        
        setShowForm(false);
        resetTaskForm();
    };

    const resetTaskForm = () => {
        setAssignedUserId(undefined);
        setEditingTask(null);
        setTaskFormVisible(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskPriority('średni');
        setNewTaskEstimatedTime(0);
        setEditingTaskId(null);
    };

    const handleEditTask = (task: Task) => {
        setAssignedUserId(task.assignedTo);
        setEditingTask(task);
        setTaskFormVisible(true);
        setNewTaskTitle(task.title);
        setNewTaskDescription(task.description);
        setNewTaskPriority(task.priority);
        setNewTaskEstimatedTime(task.estimatedTime);
        setEditingTaskId(task.id);
        setShowForm(true);
    };

    const handleDeleteTask = (taskId: string) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this task?');
        if (confirmDelete) {
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            setTasks(updatedTasks);
            TaskService.deleteTask(taskId);
            setRefreshKey(old => old + 1);
        }
    };

    const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        UserService.setUser(userId);
        setCurrentProjectId(null);
    };

    const currentProject = currentProjectId 
        ? projects.find(p => p.id === currentProjectId) 
        : null;

    const handleShowForm = () => {
        resetTaskForm();
        setShowForm(true);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        resetTaskForm();
    };

    const handleTaskStatusChange = (taskId: string, newStatus: 'todo' | 'doing' | 'done') => {
        const now = new Date();
        const updatedTasks = tasks.map(task => {
            if (task.id === taskId) {
                const updatedTask: Task = {
                    ...task,
                    status: newStatus,
                    // Set start date if moving to doing
                    startDate: newStatus === 'doing' && !task.startDate ? now : task.startDate,
                    // Set end date if moving to done
                    endDate: newStatus === 'done' ? now : task.endDate,
                };
                TaskService.updateTask(updatedTask);
                return updatedTask;
            }
            return task;
        });
        
        setTasks(updatedTasks);
        setRefreshKey(old => old + 1);
    };

    return (
        <div className="project-manager">
            {/* User and Project Selector Bar */}
            <div className="user-project-bar">
                <div className="user-select">
                    <label htmlFor="user-select">User</label>
                    <select 
                        id="user-select"
                        onChange={handleUserChange} 
                        value={currentUserId}
                    >
                        {UserService.getUsers().map(u => (
                            <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName} ({u.role})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="project-select">
                    <label htmlFor="project-select">Project</label>
                    <select 
                        id="project-select"
                        onChange={(e) => setCurrentProjectId(e.target.value)} 
                        value={currentProjectId || ''}
                    >
                        <option value="" disabled>Select project</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Project Information */}
            {currentProject && (
                <div className="project-info tasks-section">
                    <div className="page-header">
                        <h1 className="page-title">{currentProject.name}</h1>
                        <p className="page-description">{currentProject.description}</p>
                    </div>
                    
                    {/* Task Form Container */}
                    <div className="task-form-container">
                        <div className="task-form-heading">
                            <h2>{taskFormVisible ? (editingTask ? 'Edit Task' : 'Add New Task') : 'Tasks'}</h2>
                            {!taskFormVisible ? (
                                <button 
                                    className="button-secondary add-task" 
                                    onClick={handleShowForm}
                                >
                                    + 
                                </button>
                            ) : null}
                        </div>
                        
                        {showForm && (
                            <div className="task-form">
                                <div className="form-group">
                                    <label htmlFor="task-title">Task Title *</label>
                                    <input
                                        id="task-title"
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="Enter task title"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="task-description">Task Description *</label>
                                    <textarea
                                        id="task-description"
                                        value={newTaskDescription}
                                        onChange={(e) => setNewTaskDescription(e.target.value)}
                                        placeholder="Enter detailed task description"
                                        required
                                    />
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="task-priority">Priority</label>
                                        <select
                                            id="task-priority"
                                            value={newTaskPriority}
                                            onChange={(e) => setNewTaskPriority(e.target.value as 'niski' | 'średni' | 'wysoki')}
                                        >
                                            <option value="niski">Low</option>
                                            <option value="średni">Medium</option>
                                            <option value="wysoki">High</option>
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="task-time">Estimated Time (h)</label>
                                        <input
                                            id="task-time"
                                            type="number"
                                            value={newTaskEstimatedTime}
                                            onChange={(e) => setNewTaskEstimatedTime(Number(e.target.value))}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="assigned-user">Assign To</label>
                                    <select
                                        id="assigned-user"
                                        value={assignedUserId || ''}
                                        onChange={(e) => setAssignedUserId(e.target.value || undefined)}
                                    >
                                        <option value="">Not Assigned</option>
                                        {availableUsers.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                    {assignedUserId && (
                                        <p className="form-help-text">
                                            Assigning a user will mark the task as &quot;In Progress&quot;
                                        </p>
                                    )}
                                </div>
                                
                                <div className="form-actions">
                                    <button 
                                        className="button-secondary" 
                                        onClick={handleCancelForm}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="button-secondary complete" 
                                        onClick={handleAddTask}
                                    >
                                        {editingTaskId ? 'Save Changes' : 'Add Task'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Kanban Board */}
                    {currentProjectId && (
                        <KanbanBoard 
                            key={refreshKey}
                            projectId={currentProjectId} 
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            onStatusChange={handleTaskStatusChange}
                            tasks={tasks}
                        />
                    )}
                </div>
            )}
            
            {/* No Project Selected */}
            {!currentProjectId && (
                <div className="empty-state tasks-section">
                    <h2>Select a project to start working</h2>
                    <p>Use the project selector at the top of the page to choose a project to manage.</p>
                </div>
            )}
        </div>
    );
};

export default ProjectManager;