import React, { useState, useRef, DragEvent } from 'react';
import { Task } from '../models/TaskModel';
import UserService from '../services/UserService';
import { TaskService } from '../services/TaskService';

interface TaskCardProps {
    task: Task;
    onStatusChange: (taskId: string, newStatus: 'todo' | 'doing' | 'done') => void;
    onEdit: () => void;
    onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [assignUserOpen, setAssignUserOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    
    const assignedUser = task.assignedTo ? 
        UserService.getUsers().find(u => u.id === task.assignedTo) : 
        undefined;
        
    const availableUsers = UserService.getUsers().filter(
        user => user.role === 'developer' || user.role === 'devops'
    );

    // Calculate time in column
    const getTimeInStatus = () => {
        const now = new Date();
        
        if (task.status === 'todo') {
            const createdDate = task.createdAt ? new Date(task.createdAt) : null;
            if (!createdDate) return 'Unknown';
            
            const diffMs = now.getTime() - createdDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? `${diffDays} days` : 'Today';
        } 
        else if (task.status === 'doing') {
            const startDate = task.startDate ? new Date(task.startDate) : null;
            if (!startDate) return 'Unknown';
            
            const diffMs = now.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? `${diffDays} days` : 'Today';
        }
        else if (task.status === 'done' && task.endDate) {
            const startDate = task.startDate ? new Date(task.startDate) : null;
            const endDate = new Date(task.endDate);
            
            if (!startDate) return 'Unknown';
            
            const diffMs = endDate.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            return diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours} hours`;
        }
        
        return 'Unknown';
    };

    // Truncate description to first 100 characters
    const shortDescription = task.description.length > 100
        ? `${task.description.substring(0, 97)}...`
        : task.description;

    // Drag handlers
    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        setIsDragging(true);
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.effectAllowed = 'move';
        
        // Use setTimeout to allow the drag image to be captured before adding dragging class
        setTimeout(() => {
            if (cardRef.current) {
                cardRef.current.classList.add('dragging');
            }
        }, 0);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        if (cardRef.current) {
            cardRef.current.classList.remove('dragging');
        }
    };
    
    // Format date to readable string
    const formatDate = (date: Date | undefined) => {
        if (!date) return 'Not specified';
        return new Date(date).toLocaleString();
    };
    
    // Assign user handler
    const handleAssignUser = (userId: string) => {
        const updatedTask = TaskService.assignUser(task.id, userId);
        setAssignUserOpen(false);
        // Force parent to refresh
        if (updatedTask && updatedTask.status === 'doing') {
            onStatusChange(task.id, 'doing');
        }
    };

    // Handle start work button
    const handleStartWork = () => {
        // If a user is already assigned, just change status to doing
        if (task.assignedTo) {
            onStatusChange(task.id, 'doing');
        } else {
            // If no user assigned, open the assign user dropdown
            setAssignUserOpen(true);
        }
    };

    return (
        <div 
            ref={cardRef}
            className={`task-card priority-${task.priority} ${isDragging ? 'dragging' : ''}`}
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="task-header">
                <h4 className="task-title">{task.title}</h4>
                <button 
                    className="expand-button" 
                    onClick={() => setExpanded(!expanded)}
                    title={expanded ? "Collapse" : "Expand"}
                >
                    {expanded ? '▲' : '▼'}
                </button>
            </div>
            
            {!expanded && <p className="task-description">{shortDescription}</p>}
            
            <div className="task-meta">
                <span className={`priority ${task.priority}`}>
                    {task.priority === 'niski' ? 'Low' : task.priority === 'średni' ? 'Medium' : 'High'}
                </span>
                {assignedUser ? (
                    <span className="assigned-to" title={`${assignedUser.firstName} ${assignedUser.lastName} (${assignedUser.role})`}>
                        {assignedUser.firstName}
                    </span>
                ) : (
                    <span className="not-assigned">Unassigned</span>
                )}
                {task.estimatedTime > 0 && (
                    <span className="estimated-time">{task.estimatedTime}h</span>
                )}
            </div>
            
            {expanded && (
                <div className="task-details-expanded">
                    <div className="task-detail-row">
                        <div className="task-detail-label">Description:</div>
                        <div className="task-detail-value">{task.description}</div>
                    </div>
                    <div className="task-detail-row">
                        <div className="task-detail-label">Priority:</div>
                        <div className="task-detail-value">
                            {task.priority === 'niski' ? 'Low' : task.priority === 'średni' ? 'Medium' : 'High'}
                        </div>
                    </div>
                    <div className="task-detail-row">
                        <div className="task-detail-label">Status:</div>
                        <div className="task-detail-value">
                            {task.status === 'todo' ? 'To Do' : task.status === 'doing' ? 'In Progress' : 'Done'}
                        </div>
                    </div>
                    <div className="task-detail-row">
                        <div className="task-detail-label">Estimated time:</div>
                        <div className="task-detail-value">{task.estimatedTime} hours</div>
                    </div>
                    <div className="task-detail-row">
                        <div className="task-detail-label">Hours worked:</div>
                        <div className="task-detail-value">{task.workedHours} hours</div>
                    </div>
                    <div className="task-detail-row">
                        <div className="task-detail-label">Assigned to:</div>
                        <div className="task-detail-value assignment-control">
                            {assignedUser ? (
                                <div>
                                    {`${assignedUser.firstName} ${assignedUser.lastName} (${assignedUser.role})`}
                                    <button 
                                        className="button-small button-secondary"
                                        onClick={() => setAssignUserOpen(!assignUserOpen)}
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    className="button-secondary button-small"
                                    onClick={() => setAssignUserOpen(!assignUserOpen)}
                                >
                                    Assign
                                </button>
                            )}
                            
                            {assignUserOpen && (
                                <div className="assign-user-dropdown">
                                    {availableUsers.map(user => (
                                        <div 
                                            key={user.id} 
                                            className="assign-user-option"
                                            onClick={() => handleAssignUser(user.id)}
                                        >
                                            {user.firstName} {user.lastName} ({user.role})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="task-detail-row">
                        <div className="task-detail-label">Created on:</div>
                        <div className="task-detail-value">{formatDate(task.createdAt)}</div>
                    </div>
                    {task.startDate && (
                        <div className="task-detail-row">
                            <div className="task-detail-label">Started on:</div>
                            <div className="task-detail-value">{formatDate(task.startDate)}</div>
                        </div>
                    )}
                    {task.endDate && (
                        <div className="task-detail-row">
                            <div className="task-detail-label">Completed on:</div>
                            <div className="task-detail-value">{formatDate(task.endDate)}</div>
                        </div>
                    )}
                    {task.startDate && (
                        <div className="task-detail-row">
                            <div className="task-detail-label">Time in status:</div>
                            <div className="task-detail-value">{getTimeInStatus()}</div>
                        </div>
                    )}
                </div>
            )}
            
            <div className="task-actions">
                <button className="button-secondary" onClick={onEdit}>
                    Edit
                </button>
                
                {task.status === 'todo' && (
                    <button 
                        className="button-secondary start-work" 
                        onClick={handleStartWork}
                    >
                        Start Work
                    </button>
                )}
                
                {task.status === 'doing' && (
                    <button 
                        className="button-secondary complete" 
                        onClick={() => onStatusChange(task.id, 'done')}
                    >
                        Complete
                    </button>
                )}
                
                <button className="button-danger button-secondary" onClick={onDelete}>
                    Delete
                </button>
            </div>
        </div>
    );
};

export default TaskCard; 