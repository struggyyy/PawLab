export interface Project {
    id: string; // UUID from Supabase
    name: string;
    description?: string | null;
    owner_id: string; // UUID, foreign key to auth.users
    created_at?: string | Date; // TIMESTAMPTZ from Supabase
    // If you plan to fetch project members along with the project:
    // project_users?: { user_id: string, role: string }[]; 
}