import { Task } from "../models/TaskModel";
import { supabase } from '../../lib/supabase';
// import userService from "./UserService"; // Removed as not currently used

// const isBrowser = typeof window !== 'undefined'; // No longer needed

export class TaskService {
    // private static storageKey = 'tasks'; // No longer needed

    static async getTasksByProjectId(projectId: string): Promise<Task[]> {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectId);

            if (error) {
                console.error('Error retrieving tasks by project ID:', error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error('Exception retrieving tasks:', err);
            return [];
        }
    }

    static async createTask(taskData: Omit<Task, 'id' | 'created_at'>): Promise<Task | null> {
        // project_id must be part of taskData
        if (!taskData.project_id) {
            console.error('project_id is required to create a task.');
            return null;
        }
        // assigned_to could be set here or via a separate assignUser method
        // created_at will be set by Supabase default

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([{
                    ...taskData,
                    // Ensure all required fields from Task model (like title, priority, status) are in taskData
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating task (Supabase error object):', JSON.stringify(error, null, 2));
                console.error('Full error object:', error);
                return null;
            }
            console.log('Task created:', data);
            return data;
        } catch (err) {
            console.error('Exception creating task:', err);
            return null;
        }
    }

    static async getTaskById(taskId: string): Promise<Task | null> {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', taskId)
                .single();
            
            if (error) {
                console.error('Error fetching task by ID:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.error('Exception fetching task by ID:', err);
            return null;
        }
    }

    static async updateTask(taskId: string, updatedTaskData: Partial<Omit<Task, 'id' | 'created_at' | 'project_id'>>): Promise<Task | null> {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .update(updatedTaskData)
                .eq('id', taskId)
                .select()
                .single();

            if (error) {
                console.error('Error updating task:', error);
                return null;
            }
            console.log('Task updated:', data);
            return data;
        } catch (err) {
            console.error('Exception updating task:', err);
            return null;
        }
    }

    static async deleteTask(taskId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) {
                console.error('Error deleting task:', error);
                return false;
            }
            console.log('Task deleted:', taskId);
            return true;
        } catch (err) {
            console.error('Exception deleting task:', err);
            return false;
        }
    }

    static async assignUser(taskId: string, userId: string): Promise<Task | null> {
        const updatePayload: Partial<Omit<Task, 'id' | 'created_at' | 'project_id'>> = {
            assigned_to: userId,
            status: 'doing', // Explicitly using the literal type
            start_date: new Date().toISOString(),
        };
        return this.updateTask(taskId, updatePayload);
    }

    static async completeTask(taskId: string): Promise<Task | null> {
        const updatePayload: Partial<Omit<Task, 'id' | 'created_at' | 'project_id'>> = {
            status: 'done', // Explicitly using the literal type
            end_date: new Date().toISOString(),
        };
        return this.updateTask(taskId, updatePayload);
    }

    static async updateTaskHours(taskId: string, hoursToAdd: number): Promise<Task | null> {
        const task = await this.getTaskById(taskId);
        if (!task) {
            console.error("Task not found for updating hours");
            return null;
        }
        const currentWorkedHours = typeof task.worked_hours === 'number' ? task.worked_hours : 0;
        
        const updatePayload: Partial<Omit<Task, 'id' | 'created_at' | 'project_id'>> = {
            worked_hours: currentWorkedHours + hoursToAdd, 
        };
        return this.updateTask(taskId, updatePayload);
    }

    // For debugging - clear all tasks from a specific project (use with caution)
    static async clearTasksByProjectId(projectId: string): Promise<boolean> {
        console.warn(`Attempting to delete all tasks for project ${projectId}. This is a destructive operation.`);
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('project_id', projectId);
            if (error) {
                console.error('Error clearing tasks for project:', error);
                return false;
            }
            console.log(`All tasks for project ${projectId} cleared.`);
            return true;
        } catch (err) {
            console.error('Exception clearing tasks for project:', err);
            return false;
        }
    }
} 