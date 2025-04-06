import { Task } from "../models/TaskModel";

const isBrowser = typeof window !== 'undefined';

export class TaskService {
    private static storageKey = 'tasks';

    static getTasks(): Task[] {
        if (!isBrowser) return [];
        
        try {
            const tasksData = localStorage.getItem(this.storageKey);
            return tasksData ? JSON.parse(tasksData) : [];
        } catch (error) {
            console.error('Error retrieving tasks:', error);
            return [];
        }
    }

    static createTask(task: Task): void {
        if (!isBrowser) return;
        
        try {
            // Get all existing tasks
            const allTasks = this.getTasks();
            // Add new task
            allTasks.push(task);
            // Save all tasks
            localStorage.setItem(this.storageKey, JSON.stringify(allTasks));
            console.log('Task created:', task);
        } catch (error) {
            console.error('Error saving task:', error);
        }
    }

    static getTaskById(taskId: string): Task | undefined {
        return this.getTasks().find(task => task.id === taskId);
    }

    static updateTask(updatedTask: Task): void {
        if (!isBrowser) return;
        
        try {
            const tasks = this.getTasks();
            const index = tasks.findIndex(task => task.id === updatedTask.id);
            if (index !== -1) {
                tasks[index] = updatedTask;
                localStorage.setItem(this.storageKey, JSON.stringify(tasks));
                console.log('Task updated:', updatedTask);
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }

    static deleteTask(taskId: string): void {
        if (!isBrowser) return;
        
        try {
            const tasks = this.getTasks().filter(task => task.id !== taskId);
            localStorage.setItem(this.storageKey, JSON.stringify(tasks));
            console.log('Task deleted:', taskId);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    static assignUser(taskId: string, userId: string): Task | undefined {
        const task = this.getTaskById(taskId);
        if (task) {
            const updatedTask: Task = { 
                ...task, 
                assignedTo: userId, 
                status: 'doing', 
                startDate: new Date() 
            };
            this.updateTask(updatedTask);
            return updatedTask;
        }
        return undefined;
    }

    static completeTask(taskId: string): Task | undefined {
        const task = this.getTaskById(taskId);
        if (task) {
            const updatedTask: Task = { 
                ...task, 
                status: 'done', 
                endDate: new Date() 
            };
            this.updateTask(updatedTask);
            return updatedTask;
        }
        return undefined;
    }

    static updateTaskHours(taskId: string, hours: number): Task | undefined {
        const task = this.getTaskById(taskId);
        if (task) {
            const updatedTask: Task = { 
                ...task, 
                workedHours: hours 
            };
            this.updateTask(updatedTask);
            return updatedTask;
        }
        return undefined;
    }

    // For debugging - clear all tasks
    static clearAllTasks(): void {
        if (!isBrowser) return;
        localStorage.removeItem(this.storageKey);
        console.log('All tasks cleared');
    }
} 