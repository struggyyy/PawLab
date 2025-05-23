import { Story } from "../models/Story";
import { supabase } from '../../lib/supabase';
import userService from "./UserService"; // To get current user for owner_id

// const isBrowser = typeof window !== 'undefined'; // No longer needed

export class StoryService {
    // private static storageKey = 'stories'; // No longer needed

    static async getStoriesByProjectId(projectId: string): Promise<Story[]> {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select('*')
                .eq('project_id', projectId);

            if (error) {
                console.error('Error retrieving stories by project ID:', error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error('Exception retrieving stories by project ID:', err);
            return [];
        }
    }

    static async getStoryById(storyId: string): Promise<Story | null> {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select('*')
                .eq('id', storyId)
                .single();

            if (error) {
                console.error('Error fetching story by ID:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.error('Exception fetching story by ID:', err);
            return null;
        }
    }

    static async createStory(storyData: Omit<Story, 'id' | 'created_at' | 'owner_id'>): Promise<Story | null> {
        const currentUser = userService.getCurrentUserProfile();
        if (!currentUser) {
            console.error('User must be authenticated to create a story.');
            return null;
        }
        if (!storyData.project_id) {
            console.error('project_id is required to create a story.');
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('stories')
                .insert([{
                    ...storyData,
                    owner_id: currentUser.id,
                    // created_at is set by default in DB
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating story:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.error('Exception creating story:', err);
            return null;
        }
    }

    static async updateStory(storyId: string, updatedStoryData: Partial<Omit<Story, 'id' | 'created_at' | 'owner_id' | 'project_id'>>): Promise<Story | null> {
        // RLS ensures only authorized users (owner or project editor) can update
        try {
            const { data, error } = await supabase
                .from('stories')
                .update(updatedStoryData)
                .eq('id', storyId)
                .select()
                .single();

            if (error) {
                console.error('Error updating story:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.error('Exception updating story:', err);
            return null;
        }
    }

    static async deleteStory(storyId: string): Promise<boolean> {
        // RLS ensures only authorized users can delete
        try {
            const { error } = await supabase
                .from('stories')
                .delete()
                .eq('id', storyId);

            if (error) {
                console.error('Error deleting story:', error);
                return false;
            }
            return true;
        } catch (err) {
            console.error('Exception deleting story:', err);
            return false;
        }
    }

    // Example: Get stories by status for a project (already existed, adapted for Supabase)
    static async getStoriesByStatus(projectId: string, status: 'todo' | 'doing' | 'done'): Promise<Story[]> {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select('*')
                .eq('project_id', projectId)
                .eq('status', status);

            if (error) {
                console.error(`Error retrieving stories with status ${status} for project ${projectId}:`, error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error(`Exception retrieving stories with status ${status} for project ${projectId}:`, err);
            return [];
        }
    }
} 