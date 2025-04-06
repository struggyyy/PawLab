export interface Task {
    id: string;
    title: string;
    description: string;
    priority: 'niski' | 'średni' | 'wysoki';
    storyId: string;
    estimatedTime: number;
    status: 'todo' | 'doing' | 'done';
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    workedHours: number;
}
