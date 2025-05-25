import React, { useState, useEffect } from "react";
import { TaskService } from "../services/TaskService";
import { Task } from "../models/TaskModel";
import UserService from "../services/UserService";
import { User } from "../models/User";

interface TaskDetailsProps {
  taskId: string;
  onUpdate?: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ taskId, onUpdate }) => {
  const [task, setTask] = useState<Task | undefined | null>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [editedWorkedHours, setEditedWorkedHours] = useState<number>(0);

  useEffect(() => {
    const fetchTaskAndRelatedData = async () => {
      const fetchedTask = await TaskService.getTaskById(taskId);
      setTask(fetchedTask);

      if (fetchedTask) {
        setEditedWorkedHours(fetchedTask.worked_hours || 0);
      } else {
      }
    };

    const fetchUsers = async () => {
      const allUsers = await UserService.getAllUsers();
      setUsers(
        allUsers.filter(
          (user) => user.role === "developer" || user.role === "devops"
        )
      );
    };

    if (taskId) {
      fetchTaskAndRelatedData();
    } else {
      setTask(null);
    }
    fetchUsers();
  }, [taskId]);

  useEffect(() => {
    if (task) {
      setEditedWorkedHours(task.worked_hours || 0);
    }
  }, [task]);

  const handleAssign = async (userId: string) => {
    if (!UserService.hasWritePermission()) {
      alert(
        "You do not have permission to perform this action. Guest accounts are read-only."
      );
      return;
    }

    if (task && task.id) {
      const updatedTask = await TaskService.assignUser(task.id, userId);
      if (updatedTask) {
        setTask(updatedTask);
        if (onUpdate) onUpdate();
      }
    }
  };

  const handleComplete = async () => {
    if (!UserService.hasWritePermission()) {
      alert(
        "You do not have permission to perform this action. Guest accounts are read-only."
      );
      return;
    }

    if (task && task.id) {
      const updatedTask = await TaskService.completeTask(task.id);
      if (updatedTask) {
        setTask(updatedTask);
        if (onUpdate) onUpdate();
      }
    }
  };

  const updateHours = async () => {
    if (!UserService.hasWritePermission()) {
      alert(
        "You do not have permission to perform this action. Guest accounts are read-only."
      );
      return;
    }

    if (task && task.id) {
      const updatedTask = await TaskService.updateTaskHours(
        task.id,
        editedWorkedHours
      );
      if (updatedTask) {
        setTask(updatedTask);
        if (onUpdate) onUpdate();
      }
    }
  };

  if (task === undefined) return <div>Ładowanie danych zadania...</div>;
  if (task === null) return <div>Nie znaleziono zadania.</div>;

  return (
    <div className="task-details">
      <h2>{task.title}</h2>
      <p className="task-description">{task.description}</p>
      <p>
        Priorytet:{" "}
        <span className={`priority ${task.priority}`}>{task.priority}</span>
      </p>
      <p>
        Status: <span className={`status ${task.status}`}>{task.status}</span>
      </p>
      <p>Szacowany czas: {task.estimated_time} godzin</p>

      {task.assigned_to ? (
        <p>
          Przypisane do:{" "}
          {users.find((u: User) => u.id === task.assigned_to)?.firstName ||
            "Nieznany użytkownik"}
        </p>
      ) : (
        <div className="assign-user">
          <p>Nieprzypisane</p>
          <select
            onChange={(e) => handleAssign(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Przypisz użytkownika
            </option>
            {users.map((user: User) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.role})
              </option>
            ))}
          </select>
        </div>
      )}

      {task.status === "doing" && (
        <div className="worked-hours">
          <label>
            Przepracowane godziny:
            <input
              type="number"
              value={editedWorkedHours}
              onChange={(e) => setEditedWorkedHours(Number(e.target.value))}
              min="0"
            />
          </label>
          <button onClick={updateHours}>Aktualizuj</button>
        </div>
      )}

      {task.start_date && (
        <p>Data startu: {new Date(task.start_date).toLocaleString()}</p>
      )}
      {task.end_date && (
        <p>Data zakończenia: {new Date(task.end_date).toLocaleString()}</p>
      )}

      {task.status !== "done" && UserService.hasWritePermission() && (
        <div className="task-action-section">
          <h3>Actions</h3>
          <button onClick={handleComplete} className="button primary">
            Zakończ zadanie
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
