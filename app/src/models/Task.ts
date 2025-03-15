export interface Task {
    id: string;
    name: string;
    description: string;
    priority: 'niski' | 'średni' | 'wysoki';
    projectId: string;
    createdAt: Date;
    status: 'todo' | 'doing' | 'done';
    ownerId: string;
}