import React, { useState, useEffect, useCallback, DragEvent } from 'react';
import { TaskService } from '../services/TaskService';
import TaskCard from './TaskCard';
import { Task } from '../models/TaskModel';

interface KanbanBoardProps {
    projectId: string;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    tasks?: Task[];
    onStatusChange?: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    projectId, 
    onEditTask, 
    onDeleteTask, 
    tasks: propTasks, 
    onStatusChange: propStatusChange
}) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const refreshTasks = useCallback(() => {
        if (propTasks) {
            setTasks(propTasks);
        } else {
            setTasks(TaskService.getTasks().filter(task => task.storyId === projectId));
        }
    }, [projectId, propTasks]);
    
    useEffect(() => {
        // Load tasks when component mounts or projectId changes
        refreshTasks();
    }, [refreshTasks]);

    const groupedTasks: { [key: string]: Task[] } = {
        todo: tasks.filter(task => task.status === 'todo'),
        doing: tasks.filter(task => task.status === 'doing'),
        done: tasks.filter(task => task.status === 'done'),
    };

    const columnLabels: Record<string, string> = {
        todo: 'To Do',
        doing: 'In Progress',
        done: 'Done'
    };

    const handleStatusChange = (taskId: string, newStatus: 'todo' | 'doing' | 'done') => {
        if (propStatusChange) {
            propStatusChange(taskId, newStatus);
            return;
        }
        
        const task = tasks.find(task => task.id === taskId);
        if (!task) return;
        
        const now = new Date();
        const updatedTask: Task = { ...task, status: newStatus };
        
        // Track time when task changes status
        if (newStatus === 'doing' && task.status !== 'doing') {
            updatedTask.startDate = now;
        } else if (newStatus === 'done' && task.status !== 'done') {
            updatedTask.endDate = now;
            TaskService.completeTask(taskId);
            refreshTasks();
            return;
        }

        // Update task with tracking info
        TaskService.updateTask(updatedTask);
        refreshTasks();
    };

    // Drag and drop handlers
    const handleDragOver = (e: DragEvent<HTMLDivElement>, status: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: 'todo' | 'doing' | 'done') => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        
        if (taskId) {
            handleStatusChange(taskId, newStatus);
        }
        
        setDragOverColumn(null);
    };

    return (
        <div className="kanban-board">
            <div className="kanban-header">
                <h2>Task Board</h2>
            </div>

            <div className="kanban-container">
                {Object.keys(groupedTasks).map(status => (
                    <div 
                        className={`kanban-column ${dragOverColumn === status ? 'drag-over' : ''}`} 
                        key={status}
                        onDragOver={(e) => handleDragOver(e, status)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, status as 'todo' | 'doing' | 'done')}
                    >
                        <h3 className="column-header">
                            {columnLabels[status]}
                            <span className="task-count">{groupedTasks[status].length}</span>
                        </h3>
                        <div className="task-list">
                            {groupedTasks[status].map((task) => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    onStatusChange={handleStatusChange} 
                                    onEdit={() => onEditTask(task)} 
                                    onDelete={() => onDeleteTask(task.id)} 
                                />
                            ))}
                            {groupedTasks[status].length === 0 && (
                                <div className="empty-column">
                                    No tasks
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;
