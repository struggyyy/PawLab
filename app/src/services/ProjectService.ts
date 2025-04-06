import { Project } from '../models/Project';
import { Task } from '../models/TaskModel';

const isBrowser = typeof window !== 'undefined';

class ProjectService {
    private storageKey = 'projects';
    private tasksKey = 'tasks';

    constructor() {
        if (isBrowser) {
            try {
                // Check if projects already exist
                const existingProjects = localStorage.getItem(this.storageKey);
                if (!existingProjects) {
                    // Przykładowe projekty
                    const initialProjects: Project[] = [
                        { id: '1', name: 'Projekt A', description: 'Opis projektu A', ownerId: '1' },
                        { id: '2', name: 'Projekt B', description: 'Opis projektu B', ownerId: '1' },
                        { id: '3', name: 'Projekt C', description: 'Opis projektu C', ownerId: '2' },
                        { id: '4', name: 'Projekt D', description: 'Opis projektu D', ownerId: '3' },
                    ];
                    localStorage.setItem(this.storageKey, JSON.stringify(initialProjects));
                }
            } catch (error) {
                console.error('Error initializing projects:', error);
            }
        }
    }

    getProjects(): Project[] {
        if (!isBrowser) return [];
        
        try {
            const projects = localStorage.getItem(this.storageKey);
            return projects ? JSON.parse(projects) : [];
        } catch (error) {
            console.error('Error retrieving projects:', error);
            return [];
        }
    }

    addProject(project: Project): void {
        if (!isBrowser) return;
        
        try {
            const projects = this.getProjects();
            projects.push(project);
            localStorage.setItem(this.storageKey, JSON.stringify(projects));
        } catch (error) {
            console.error('Error adding project:', error);
        }
    }

    updateProject(updatedProject: Project): void {
        if (!isBrowser) return;
        
        try {
            const projects = this.getProjects().map(project => 
                project.id === updatedProject.id ? updatedProject : project
            );
            localStorage.setItem(this.storageKey, JSON.stringify(projects));
        } catch (error) {
            console.error('Error updating project:', error);
        }
    }

    deleteProject(id: string): void {
        if (!isBrowser) return;
        
        try {
            const projects = this.getProjects().filter(project => project.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(projects));
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    }

    getTasks(projectId: string): Task[] {
        if (!isBrowser) return [];
        
        try {
            const tasks = localStorage.getItem(this.tasksKey);
            return tasks 
                ? JSON.parse(tasks).filter((task: Task) => task.storyId === projectId) 
                : [];
        } catch (error) {
            console.error('Error retrieving tasks:', error);
            return [];
        }
    }

    addTask(task: Task): void {
        if (!isBrowser) return;
        
        try {
            const allTasks = localStorage.getItem(this.tasksKey);
            const tasks = allTasks ? JSON.parse(allTasks) : [];
            tasks.push(task);
            localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
            console.log('Task added to project:', task);
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }

    updateTask(updatedTask: Task): void {
        if (!isBrowser) return;
        
        try {
            const allTasks = localStorage.getItem(this.tasksKey);
            if (allTasks) {
                const tasks = JSON.parse(allTasks);
                const updatedTasks = tasks.map((task: Task) => 
                    task.id === updatedTask.id ? updatedTask : task
                );
                localStorage.setItem(this.tasksKey, JSON.stringify(updatedTasks));
                console.log('Task updated in project:', updatedTask);
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }

    deleteTask(id: string): void {
        if (!isBrowser) return;
        
        try {
            const allTasks = localStorage.getItem(this.tasksKey);
            if (allTasks) {
                const tasks = JSON.parse(allTasks);
                const filteredTasks = tasks.filter((task: Task) => task.id !== id);
                localStorage.setItem(this.tasksKey, JSON.stringify(filteredTasks));
                console.log('Task deleted from project:', id);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }
}

const projectServiceInstance = new ProjectService();
export default projectServiceInstance;