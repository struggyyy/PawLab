export interface Story {
    id: string;
    project_id: string;
    name: string;
    description?: string | null;
    priority: 'niski' | 'średni' | 'wysoki';
    status: 'todo' | 'doing' | 'done';
    owner_id: string;
    created_at?: string | Date;
} 