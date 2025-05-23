"use client";

import React, { useState, useEffect } from 'react';
import ProjectService from '../services/ProjectService';
import userService from '../services/UserService';
import { TaskService } from '../services/TaskService';
import { Project } from '../models/Project';
import { Task } from '../models/TaskModel';
import { User as AppUser } from '../models/User';
import KanbanBoard from './KanbanBoard';

const ProjectManager: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [taskFormVisible, setTaskFormVisible] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    
    const [currentUser, setCurrentUser] = useState<AppUser | null | undefined>(undefined);
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);

    // State for Add Project Form
    const [projectFormVisible, setProjectFormVisible] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');

    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [newTaskEstimatedTime, setNewTaskEstimatedTime] = useState(0);
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string | null>(null);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        setCurrentUser(userService.getCurrentUserProfile());
        const unsubscribe = userService.onProfileUpdate((profile) => {
            setCurrentUser(profile);
        });
        return () => {
            unsubscribe(); 
        };
    }, []); 

    useEffect(() => {
        const loadAllUsers = async () => {
            const users = await userService.getAllUsers();
            setAllUsers(users);
        };
        loadAllUsers();
    }, []);

    const fetchProjects = async () => {
        const fetchedProjects = await ProjectService.getProjects();
        setProjects(fetchedProjects || []);
    };

    useEffect(() => {
        if (currentUser !== undefined) { 
             fetchProjects();
        }
    }, [currentUser, refreshKey]); // Add refreshKey to re-fetch projects after adding one

    useEffect(() => {
        if (currentProjectId) {
            TaskService.getTasksByProjectId(currentProjectId).then(fetchedTasks => {
                setTasks(fetchedTasks || []);
            });
        } else {
            setTasks([]); 
        }
    }, [currentProjectId, refreshKey]);

    const availableUsers = allUsers.filter(
        user => user.role === 'developer' || user.role === 'devops'
    );

    const handleAddProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) {
            alert('Project name is required.');
            return;
        }
        if (!currentUser) {
            alert('You must be logged in to add a project.');
            return;
        }

        try {
            const newProject = await ProjectService.addProject({
                name: newProjectName,
                description: newProjectDescription,
            });
            if (newProject) {
                setProjects(prevProjects => [...prevProjects, newProject]); // Optimistically add to list
                // Or trigger a full refresh:
                // setRefreshKey(prev => prev + 1); 
                setNewProjectName('');
                setNewProjectDescription('');
                setProjectFormVisible(false);
            } else {
                alert('Failed to add project. Please check console for errors.');
            }
        } catch (error) {
            console.error("Error adding project:", error);
            alert('An error occurred while adding the project.');
        }
    };

    const handleTaskFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProjectId || !currentUser) return;
        if (!userService.hasWritePermission()) {
            alert('You do not have permission to perform this action. Guest accounts are read-only.');
            return;
        }

        const taskPayload: Partial<Task> = { 
            project_id: currentProjectId,
            title: newTaskTitle,
            description: newTaskDescription,
            priority: newTaskPriority,
            estimated_time: newTaskEstimatedTime,
            assigned_to: newTaskAssignedTo,
        };

        if (editingTaskId && editingTask) {
            const updateData: Partial<Omit<Task, 'id' | 'created_at' | 'project_id'>> = {
                title: newTaskTitle,
                description: newTaskDescription,
                priority: newTaskPriority,
                estimated_time: newTaskEstimatedTime,
                assigned_to: newTaskAssignedTo,
                status: editingTask.status, 
                start_date: editingTask.start_date,
                end_date: editingTask.end_date,
                worked_hours: editingTask.worked_hours,
            };
            await TaskService.updateTask(editingTaskId, updateData);
        } else {
            const newTaskPayloadWithStatus = { ...taskPayload, status: 'todo' as const };
            await TaskService.createTask(newTaskPayloadWithStatus as Omit<Task, 'id' | 'created_at'>);
        }
        setRefreshKey(prev => prev + 1);
        // setShowForm(false); // This was for the old combined form, now taskFormVisible controls task form
        setTaskFormVisible(false); // Hide task form after submit
        resetTaskForm();
    };

    const resetTaskForm = () => {
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskPriority('medium');
        setNewTaskEstimatedTime(0);
        setNewTaskAssignedTo(null);
        setEditingTaskId(null);
        setEditingTask(null);
        // setTaskFormVisible(false); // Typically done by the caller opening/closing the form
    };
    
    const resetProjectForm = () => {
        setNewProjectName('');
        setNewProjectDescription('');
        setProjectFormVisible(false);
    };

    const handleEditTask = (task: Task) => {
        if (!userService.hasWritePermission()) {
            alert('You do not have permission to perform this action. Guest accounts are read-only.');
            return;
        }
        setTaskFormVisible(true); // Show task form for editing
        // setShowForm(true); // This was for old logic
        setEditingTaskId(task.id);
        setEditingTask(task);
        setNewTaskTitle(task.title);
        setNewTaskDescription(task.description || '');
        setNewTaskPriority(task.priority as 'low' | 'medium' | 'high');
        setNewTaskEstimatedTime(task.estimated_time || 0);
        setNewTaskAssignedTo(task.assigned_to || null);
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!userService.hasWritePermission()) {
            alert('You do not have permission to perform this action. Guest accounts are read-only.');
            return;
        }
        await TaskService.deleteTask(taskId);
        setRefreshKey(prev => prev + 1);
    };

    const handleTaskStatusChange = async (taskId: string, newStatus: 'todo' | 'doing' | 'done') => {
        if (!userService.hasWritePermission()) {
            alert('You do not have permission to perform this action. Guest accounts are read-only.');
            return;
        }
        let updatedTask;
        if (newStatus === 'done') {
            updatedTask = await TaskService.completeTask(taskId);
        } else if (newStatus === 'doing') {
            const taskToUpdate = tasks.find(t => t.id === taskId);
            if (taskToUpdate?.assigned_to) {
                 updatedTask = await TaskService.updateTask(taskId, { status: 'doing', start_date: new Date().toISOString() });
            } else {
                updatedTask = await TaskService.updateTask(taskId, { status: 'doing' });
            }
        } else { 
            updatedTask = await TaskService.updateTask(taskId, { status: newStatus, start_date: null, end_date: null });
        }
        if (updatedTask) {
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleAssignUserToTask = async (taskId: string, userIdToAssign: string) => {
        if (!userService.hasWritePermission()) {
            alert('You do not have permission to perform this action. Guest accounts are read-only.');
            return;
        }
        const updatedTask = await TaskService.assignUser(taskId, userIdToAssign);
        if (updatedTask) {
            setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));
        }
    };

    if (currentUser === undefined) { 
        return <p>Loading user session...</p>;
    }

    return (
        <div className="project-manager">
            <div className="user-project-bar" style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                <div className="project-select-wrapper" style={{ display: 'flex', flexDirection: 'column'}}>
                    <label htmlFor="project-select" style={{ marginBottom: '4px' }}>Project</label>
                    <select 
                        id="project-select"
                        onChange={(e) => setCurrentProjectId(e.target.value || null)} 
                        value={currentProjectId || ''}
                        disabled={projectFormVisible || currentUser === null || (currentUser && projects.length === 0) }
                    >
                        <option value="">{currentUser === undefined ? 'Loading...' : currentUser ? (projects.length ? 'Select project' : 'No projects available') : 'Login to see projects'}</option>
                        {currentUser && projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                </div>
                {currentUser && !projectFormVisible && (
                    <button 
                        onClick={() => { 
                            setProjectFormVisible(true); 
                            setCurrentProjectId(null);
                        }} 
                        className="button-primary add-project-button"
                    >
                        Add New Project
                    </button>
                )}
            </div>

            {projectFormVisible && (
                <form onSubmit={handleAddProjectSubmit} className="project-form">

                    <div>
                        <label htmlFor="new-project-name" style={{ display: 'block', marginBottom: '4px' }}>Project Name *</label>
                        <input 
                            type="text" 
                            id="new-project-name"
                            value={newProjectName} 
                            onChange={e => setNewProjectName(e.target.value)} 
                            required 
                        />
                    </div>
                    <div>
                        <label htmlFor="new-project-description" style={{ display: 'block', marginBottom: '4px' }}>Description</label>
                        <textarea 
                            id="new-project-description"
                            value={newProjectDescription} 
                            onChange={e => setNewProjectDescription(e.target.value)} 
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={resetProjectForm}>Cancel</button>
                        <button type="submit" className="button-primary">Save Project</button>
                    </div>
                </form>
            )}

            {!projectFormVisible && currentProjectId && currentUser && (
                <div className="task-section">
                    <div className="task-form-heading">
                        <h2>{taskFormVisible ? (editingTask ? 'Edit Task' : 'Add New Task') : 'Tasks'}</h2>
                        {!taskFormVisible && userService.hasWritePermission() && (
                            <button 
                                className="button-primary add-task" 
                                onClick={() => { setTaskFormVisible(true); resetTaskForm(); }}
                            >
                                Add Task
                            </button>
                        )}
                    </div>

                    {taskFormVisible && (
                        <form onSubmit={handleTaskFormSubmit} className="task-form">
                            <input type="text" placeholder="Title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required />
                            <textarea placeholder="Description" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} />
                            <div>
                                <label htmlFor="task-priority" style={{ display: 'block', marginBottom: '4px' }}>Priority</label>
                                <select id="task-priority" value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="task-estimated-time" style={{ display: 'block', marginBottom: '4px' }}>Estimated Time (h)</label>
                                <input id="task-estimated-time" type="number" placeholder="Estimated Time (h)" value={newTaskEstimatedTime} onChange={e => setNewTaskEstimatedTime(parseFloat(e.target.value) || 0)} />
                            </div>
                            <div>
                                <label htmlFor="task-assignee" style={{ display: 'block', marginBottom: '4px' }}>Assign To</label>
                                <select id="task-assignee" value={newTaskAssignedTo || ''} onChange={e => setNewTaskAssignedTo(e.target.value || null)}>
                                    <option value="">Unassigned</option>
                                    {availableUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.firstName || 'User'} {user.lastName || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-actions" style={{ marginTop: '10px'}}>
                                <button type="submit" className="button-primary">{editingTask ? 'Update Task' : 'Save Task'}</button>
                                <button type="button" className="button-secondary" onClick={() => { setTaskFormVisible(false); resetTaskForm(); }}>Cancel</button>
                            </div>
                        </form>
                    )}

                    <KanbanBoard 
                        tasks={tasks}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask} 
                        onStatusChange={handleTaskStatusChange}
                        onAssignUser={handleAssignUserToTask} 
                        availableUsers={availableUsers} 
                        canEdit={userService.hasWritePermission()} 
                    />
                </div>
            )}
             {!projectFormVisible && !currentProjectId && currentUser && projects.length === 0 && (
                <div className="empty-state tasks-section">
                     <h2>No projects available.</h2>
                     <p>Click &quot;Add New Project&quot; above to create one.</p>
                </div>
            )}
            {!projectFormVisible && !currentProjectId && currentUser && projects.length > 0 && (
                 <div className="empty-state tasks-section">
                    <h2>Select a project to start working</h2>
                    <p>Use the project selector at the top of the page to choose a project to manage.</p>
                </div>
            )}
            {currentUser === null && (
                 <div className="empty-state tasks-section">
                    <h2>Please log in</h2>
                    <p>You need to be logged in to manage projects and tasks, or to add new projects.</p>
                </div>
            )}
        </div>
    );
};

export default ProjectManager;