import React, { useState, DragEvent } from 'react';
// import { TaskService } from '../services/TaskService'; // No longer fetching tasks internally
import TaskCard from './TaskCard';
import { Task } from '../models/TaskModel';
import { User as AppUser } from '../models/User'; // Import AppUser
// import UserService from '../services/UserService'; // Permissions now passed as prop

export interface KanbanBoardProps {
    // projectId: string; // Tasks are now passed directly
    tasks: Task[]; // Make tasks a required prop
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onStatusChange: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => void; // Assume this is always provided
    onAssignUser: (taskId: string, userId: string) => void; // New prop
    availableUsers: AppUser[]; // New prop
    canEdit: boolean; // New prop for permissions
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    tasks, 
    onEditTask, 
    onDeleteTask, 
    onStatusChange,
    onAssignUser,    // Destructure new props
    availableUsers,  // Destructure new props
    canEdit          // Destructure new props
}) => {
    // Internal state for tasks is no longer needed if tasks are purely prop-driven
    // const [boardTasks, setBoardTasks] = useState<Task[]>(tasks); 
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // useEffect to sync tasks if the prop changes (optional, depends on how ProjectManager manages state)
    // This is generally good practice if tasks prop can be updated from parent after initial render.
    // For now, assuming tasks prop is the source of truth for each render.
    // useEffect(() => {
    //     setBoardTasks(tasks);
    // }, [tasks]);

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

    // handleStatusChange now directly calls the prop passed from ProjectManager
    // The internal logic for updating status, startDate, endDate is removed as ProjectManager/TaskService handles it
    const handleLocalStatusChange = (taskId: string, newStatus: 'todo' | 'doing' | 'done') => {
        if (onStatusChange) { // Ensure prop is provided
            onStatusChange(taskId, newStatus);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>, status: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: 'todo' | 'doing' | 'done') => {
        if (!canEdit) { // Use canEdit prop
            alert('You do not have permission to perform this action.');
            return;
        }
        
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        
        if (taskId) {
            handleLocalStatusChange(taskId, newStatus);
        }
        
        setDragOverColumn(null);
    };

    // renderTaskActions removed as TaskCard will handle its own actions based on props

    // The main rendering logic of the board remains similar
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
                                    onEdit={() => onEditTask(task)} 
                                    onDelete={() => onDeleteTask(task.id)}
                                    onAssignUser={onAssignUser}      
                                    availableUsers={availableUsers}  
                                    canEdit={canEdit}                
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
