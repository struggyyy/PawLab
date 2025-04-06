import React, { useState, useEffect } from 'react';
import { TaskService } from '../services/TaskService';
import { Task } from '../models/TaskModel';
import UserService from '../services/UserService';
import { StoryService } from '../services/StoryService';

interface TaskDetailsProps {
    taskId: string;
    onUpdate?: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ taskId, onUpdate }) => {
    const [task, setTask] = useState<Task | undefined>(TaskService.getTaskById(taskId));
    const [workedHours, setWorkedHours] = useState<number>(task?.workedHours || 0);
    const users = UserService.getUsers().filter(user => user.role === 'developer' || user.role === 'devops');
    const story = task ? StoryService.getStoryById(task.storyId) : undefined;

    useEffect(() => {
        setTask(TaskService.getTaskById(taskId));
    }, [taskId]);

    useEffect(() => {
        if (task) {
            setWorkedHours(task.workedHours);
        }
    }, [task]);

    const assignUser = (userId: string) => {
        if (task) {
            const updatedTask = TaskService.assignUser(task.id, userId);
            if (updatedTask) {
                setTask(updatedTask);
                if (onUpdate) onUpdate();
            }
        }
    };

    const markAsDone = () => {
        if (task) {
            const updatedTask = TaskService.completeTask(task.id);
            if (updatedTask) {
                setTask(updatedTask);
                if (onUpdate) onUpdate();
            }
        }
    };

    const updateHours = () => {
        if (task) {
            const updatedTask = TaskService.updateTaskHours(task.id, workedHours);
            if (updatedTask) {
                setTask(updatedTask);
                if (onUpdate) onUpdate();
            }
        }
    };

    if (!task) return <div>Nie znaleziono zadania.</div>;

    return (
        <div className="task-details">
            <h2>{task.title}</h2>
            <p className="task-description">{task.description}</p>
            <p>Priorytet: <span className={`priority ${task.priority}`}>{task.priority}</span></p>
            <p>Status: <span className={`status ${task.status}`}>{task.status}</span></p>
            <p>Historia: {story?.name || 'Brak przypisanej historii'}</p>
            <p>Szacowany czas: {task.estimatedTime} godzin</p>

            {task.assignedTo ? (
                <p>Przypisane do: {
                    UserService.getUsers().find(u => u.id === task.assignedTo)?.firstName || 'Nieznany użytkownik'
                }</p>
            ) : (
                <div className="assign-user">
                    <p>Nieprzypisane</p>
                    <select 
                        onChange={(e) => assignUser(e.target.value)}
                        defaultValue=""
                    >
                        <option value="" disabled>Przypisz użytkownika</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.role})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {task.status === 'doing' && (
                <div className="worked-hours">
                    <label>
                        Przepracowane godziny:
                        <input 
                            type="number" 
                            value={workedHours} 
                            onChange={(e) => setWorkedHours(Number(e.target.value))}
                            min="0"
                        />
                    </label>
                    <button onClick={updateHours}>Aktualizuj</button>
                </div>
            )}

            {task.startDate && <p>Data startu: {new Date(task.startDate).toLocaleString()}</p>}
            {task.endDate && <p>Data zakończenia: {new Date(task.endDate).toLocaleString()}</p>}
            
            {task.status === 'doing' && (
                <button onClick={markAsDone} className="button primary">Zakończ zadanie</button>
            )}
        </div>
    );
};

export default TaskDetails; 