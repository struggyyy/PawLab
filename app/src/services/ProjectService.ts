import { Project } from '../models/Project';
import { Task } from '../models/Task';

class ProjectService {
    private storageKey = 'projects';
    private tasksKey = 'tasks';

    constructor() {
        if (typeof window !== 'undefined') {
            // Przykładowe projekty
            const initialProjects: Project[] = [
                { id: '1', name: 'Projekt A', description: 'Opis projektu A', ownerId: '1' },
                { id: '2', name: 'Projekt B', description: 'Opis projektu B', ownerId: '1' },
                { id: '3', name: 'Projekt C', description: 'Opis projektu C', ownerId: '2' },
                { id: '4', name: 'Projekt D', description: 'Opis projektu D', ownerId: '3' },
            ];
            localStorage.setItem(this.storageKey, JSON.stringify(initialProjects));
        }
    }

    getProjects(): Project[] {
        if (typeof window !== 'undefined') {
            const projects = localStorage.getItem(this.storageKey);
            return projects ? JSON.parse(projects) : [];
        }
        return [];
    }

    addProject(project: Project): void {
        const projects = this.getProjects();
        projects.push(project);
        localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }

    updateProject(updatedProject: Project): void {
        const projects = this.getProjects().map(project => 
            project.id === updatedProject.id ? updatedProject : project
        );
        localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }

    deleteProject(id: string): void {
        const projects = this.getProjects().filter(project => project.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }

    getTasks(projectId: string): Task[] {
        const tasks = localStorage.getItem(this.tasksKey);
        return tasks ? JSON.parse(tasks).filter((task: Task) => task.projectId === projectId) : [];
    }

    addTask(task: Task): void {
        if (typeof window !== 'undefined') {
            const tasks = this.getTasks(task.projectId);
            tasks.push(task);
            localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
        }
    }

    updateTask(updatedTask: Task): void {
        if (typeof window !== 'undefined') {
            const tasks = this.getTasks(updatedTask.projectId).map(task => 
                task.id === updatedTask.id ? updatedTask : task
            );
            localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
        }
    }

    deleteTask(id: string, projectId: string): void {
        if (typeof window !== 'undefined') {
            const tasks = this.getTasks(projectId).filter(task => task.id !== id);
            localStorage.setItem(this.tasksKey, JSON.stringify(tasks));
        }
    }
}

const projectServiceInstance = new ProjectService();
export default projectServiceInstance;