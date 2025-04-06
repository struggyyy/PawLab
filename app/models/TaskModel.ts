export interface Task {
    id: string;
    name: string;
    description: string;
    priority: 'niski' | 'średni' | 'wysoki';
    status: 'todo' | 'doing' | 'done';
    storyId: string;
    createdAt: Date;
    workedHours: number;
} 