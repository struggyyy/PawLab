import { Project } from '../models/Project';
import { User as AppUser } from '../models/User'; // Added import for AppUser
// import { Task } from '../models/TaskModel'; // Tasks will be handled by TaskService
import { supabase } from '../../lib/supabase';
// import userService from './UserService'; // To get current user for owner_id - No longer needed here

// const isBrowser = typeof window !== 'undefined'; // No longer needed

// Type for the raw data item expected from the Supabase query
interface RawProjectMember {
    user_id: string;
    role: 'editor' | 'viewer';
    // Adjusted to reflect that Supabase might return an array for the joined relation
    profiles: AppUser[] | null; 
}

// Type for the processed project member data to be returned by the service
export type ProjectMemberData = {
    user_id: string;
    role: 'editor' | 'viewer';
    profile: AppUser | null; // Changed from 'profiles' to 'profile' for clarity, representing a single user profile
};

class ProjectService {
    // private storageKey = 'projects'; // No longer needed
    // private tasksKey = 'tasks'; // No longer needed

    constructor() {
        // Remove localStorage initialization logic
    }

    async getProjects(): Promise<Project[]> {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*'); // Selects all columns

            if (error) {
                console.error('Error retrieving projects:', error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error('Exception retrieving projects:', err);
            return [];
        }
    }

    async getProjectById(projectId: string): Promise<Project | null> {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();
            
            if (error) {
                console.error('Error fetching project by ID:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.error('Exception fetching project by ID:', err);
            return null;
        }
    }

    async addProject(projectData: Omit<Project, 'id' | 'created_at' | 'owner_id'>): Promise<Project | null> {
        // const currentUser = userService.getCurrentUserProfile();
        // if (!currentUser) {
        //     console.error('User must be authenticated to add a project.');
        //     return null;
        // }
        // const ownerIdToInsert = currentUser.id;

        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            console.error('Error fetching authenticated user or user not authenticated:', authError);
            return null;
        }
        const ownerIdToInsert = authUser.id;

        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([{
                    ...projectData,
                    owner_id: ownerIdToInsert,
                }])
                .select()
                .single(); // Assuming you want the created project back

            if (error) {
                console.error('Error adding project (Supabase error object):', JSON.stringify(error, null, 2));
                console.error('Full error object:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.error('Exception adding project:', err);
            return null;
        }
    }

    async updateProject(projectId: string, updatedProjectData: Partial<Omit<Project, 'id' | 'created_at' | 'owner_id'>>): Promise<Project | null> {
        // RLS will ensure only authorized users can update.
        try {
            const { data, error } = await supabase
                .from('projects')
                .update(updatedProjectData)
                .eq('id', projectId)
                .select()
                .single();

            if (error) {
                console.error('Error updating project:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.error('Exception updating project:', err);
            return null;
        }
    }

    async deleteProject(id: string): Promise<boolean> {
        // RLS will ensure only authorized users can delete.
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting project (Supabase error object):', JSON.stringify(error, null, 2));
                console.error('Full error object:', error);
                return false;
            }
            return true;
        } catch (err) {
            console.error('Exception deleting project:', err);
            return false;
        }
    }

    async getProjectMembers(projectId: string): Promise<ProjectMemberData[]> {
        try {
            const { data, error } = await supabase
                .from('project_users')
                .select(`
                    user_id,
                    role,
                    profiles!inner ( id, first_name, last_name, role )
                `)
                .eq('project_id', projectId);

            if (error) {
                console.error('Error fetching project members:', error);
                return [];
            }
            
            if (!data) {
                return [];
            }
            // Cast the data from Supabase to our RawProjectMember array type then map.
            // Supabase client might return 'any' or a loosely typed structure.
            return (data as RawProjectMember[]).map((item: RawProjectMember) => ({
                user_id: item.user_id,
                role: item.role,
                profile: item.profiles && item.profiles.length > 0 ? item.profiles[0] : null
            }));

        } catch (err) {
            console.error('Exception fetching project members:', err);
            return [];
        }
    }

    async addUserToProject(projectId: string, userId: string, role: 'editor' | 'viewer'): Promise<boolean> {
        // RLS on project_users table should allow project owner to add members.
        try {
            const { error } = await supabase
                .from('project_users')
                .insert([{ project_id: projectId, user_id: userId, role: role }]);
            
            if (error) {
                console.error('Error adding user to project:', error);
                return false;
            }
            return true;
        } catch (err) {
            console.error('Exception adding user to project:', err);
            return false;
        }
    }

    async removeUserFromProject(projectId: string, userId: string): Promise<boolean> {
        // RLS on project_users table should allow project owner to remove members.
        try {
            const { error } = await supabase
                .from('project_users')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error removing user from project:', error);
                return false;
            }
            return true;
        } catch (err) {
            console.error('Exception removing user from project:', err);
            return false;
        }
    }

    async updateUserRoleInProject(projectId: string, userId: string, newRole: 'editor' | 'viewer'): Promise<boolean> {
        // RLS on project_users table should allow project owner to update roles.
        try {
            const { error } = await supabase
                .from('project_users')
                .update({ role: newRole })
                .eq('project_id', projectId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error updating user role in project:', error);
                return false;
            }
            return true;
        } catch (err) {
            console.error('Exception updating user role in project:', err);
            return false;
        }
    }

    // Task-related methods (getTasks, addTask, updateTask, deleteTask) are REMOVED.
    // They will be in TaskService.ts and StoryService.ts as appropriate.
}

const projectServiceInstance = new ProjectService();
export default projectServiceInstance;