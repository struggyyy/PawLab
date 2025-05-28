import React, { useState, DragEvent } from "react";
import TaskCard from "./TaskCard";
import { Task } from "../models/TaskModel";
import { User as AppUser } from "../models/User";

export interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (
    taskId: string,
    newStatus: "todo" | "doing" | "done"
  ) => void;
  onAssignUser: (taskId: string, userId: string) => void;
  availableUsers: AppUser[];
  canEdit: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAssignUser,
  availableUsers,
  canEdit,
}) => {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const groupedTasks: { [key: string]: Task[] } = {
    todo: tasks.filter((task) => task.status === "todo"),
    doing: tasks.filter((task) => task.status === "doing"),
    done: tasks.filter((task) => task.status === "done"),
  };

  const columnLabels: Record<string, string> = {
    todo: "To Do",
    doing: "In Progress",
    done: "Done",
  };

  const handleLocalStatusChange = (
    taskId: string,
    newStatus: "todo" | "doing" | "done"
  ) => {
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  const handleMoveTaskRightLocal = (taskId: string, currentStatus: Task['status']) => {
    if (!canEdit) return;
    let newStatus: Task['status'] | null = null;
    if (currentStatus === "todo") {
      newStatus = "doing";
    } else if (currentStatus === "doing") {
      newStatus = "done";
    }
    if (newStatus) {
      handleLocalStatusChange(taskId, newStatus);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    newStatus: "todo" | "doing" | "done"
  ) => {
    if (!canEdit) {
      alert("You do not have permission to perform this action.");
      return;
    }

    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");

    if (taskId) {
      handleLocalStatusChange(taskId, newStatus);
    }

    setDragOverColumn(null);
  };

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <h2>Task Board</h2>
      </div>

      <div className="kanban-container">
        {Object.keys(groupedTasks).map((status) => (
          <div
            className={`kanban-column ${
              dragOverColumn === status ? "drag-over" : ""
            }`}
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status as "todo" | "doing" | "done")}
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
                  onMoveTaskRight={handleMoveTaskRightLocal}
                />
              ))}
              {groupedTasks[status].length === 0 && (
                <div className="empty-column">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
