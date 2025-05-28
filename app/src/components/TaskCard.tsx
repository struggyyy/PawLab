import React, { useState, useRef, DragEvent } from "react";
import { Task } from "../models/TaskModel";
import { User as AppUser } from "../models/User";

export interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onAssignUser: (taskId: string, userId: string) => void;
  availableUsers: AppUser[];
  canEdit: boolean;
  onMoveTaskRight?: (taskId: string, currentStatus: Task['status']) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onAssignUser,
  availableUsers,
  canEdit,
  onMoveTaskRight,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const assignedUser = task.assigned_to
    ? availableUsers.find((u) => u.id === task.assigned_to)
    : undefined;

  const getTimeInStatus = () => {
    const now = new Date();
    if (task.status === "todo") {
      const createdDate = task.created_at ? new Date(task.created_at) : null;
      if (!createdDate) return "Unknown";
      const diffMs = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? `${diffDays} days` : "Today";
    } else if (task.status === "doing") {
      const startDate = task.start_date ? new Date(task.start_date) : null;
      if (!startDate) return "Unknown";
      const diffMs = now.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? `${diffDays} days` : "Today";
    } else if (task.status === "done" && task.end_date) {
      const startDate = task.start_date ? new Date(task.start_date) : null;
      const endDate = new Date(task.end_date);
      if (!startDate) return "Unknown";
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      return diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours} hours`;
    }
    return "Unknown";
  };

  const shortDescription =
    task.description && task.description.length > 100
      ? `${task.description.substring(0, 97)}...`
      : task.description || "";

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    setIsDragging(true);
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.classList.add("dragging");
      }
    }, 0);
  };

  const handleDragEnd = () => {
    if (!canEdit) return;
    setIsDragging(false);
    if (cardRef.current) {
      cardRef.current.classList.remove("dragging");
    }
  };

  const formatDate = (dateInput: string | Date | undefined | null): string => {
    if (!dateInput) return "Not specified";
    return new Date(dateInput).toLocaleString();
  };

  const handleLocalAssignUser = (userId: string) => {
    if (!canEdit) {
      alert("You do not have permission to perform this action.");
      return;
    }
    onAssignUser(task.id, userId);
  };

  return (
    <div
      ref={cardRef}
      className={`task-card priority-${task.priority} ${
        isDragging ? "dragging" : ""
      }`}
      draggable={canEdit}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="task-header">
        <h4 className="task-title">{task.title}</h4>
        <div className="task-header-right-group">
          {task.estimated_time && task.estimated_time > 0 && (
            <span className="estimated-time">{task.estimated_time}h</span>
          )}
          <span className={`priority ${task.priority}`}>
            {task.priority === "low"
              ? "Low"
              : task.priority === "medium"
              ? "Medium"
              : "High"}
          </span>
        </div>
      </div>

      {!expanded && <p className="task-description">{shortDescription}</p>}

      <div className="task-meta">
        {assignedUser ? (
          <div>
            {`${assignedUser.firstName || ""} ${assignedUser.lastName || ""} (${assignedUser.role})`}
          </div>
        ) : (
          canEdit ? (
            <div className="assign-user-direct-dropdown">
              <select
                value={task.assigned_to || ""}
                onChange={(e) => handleLocalAssignUser(e.target.value)}
                className="button-small"
              >
                <option value="" disabled>
                  Assign user...
                </option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName || ""} {user.lastName || ""} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span>Unassigned</span>
          )
        )}
      </div>

      {expanded && (
        <div className="task-details-expanded">
          <div className="task-detail-row">
            <div className="task-detail-label">Description:</div>
            <div className="task-detail-value">{task.description || "N/A"}</div>
          </div>
          <div className="task-detail-row">
            <div className="task-detail-label">Priority:</div>
            <div className="task-detail-value">
              {task.priority === "low"
                ? "Low"
                : task.priority === "medium"
                ? "Medium"
                : "High"}
            </div>
          </div>
          <div className="task-detail-row">
            <div className="task-detail-label">Status:</div>
            <div className="task-detail-value">
              {task.status === "todo"
                ? "To Do"
                : task.status === "doing"
                ? "In Progress"
                : "Done"}
            </div>
          </div>
          <div className="task-detail-row">
            <div className="task-detail-label">Estimated time:</div>
            <div className="task-detail-value">
              {task.estimated_time || 0} hours
            </div>
          </div>
          <div className="task-detail-row">
            <div className="task-detail-label">Hours worked:</div>
            <div className="task-detail-value">
              {task.worked_hours || 0} hours
            </div>
          </div>
          <div className="task-detail-row">
            <div className="task-detail-label">Assigned to:</div>
            <div className="task-detail-value assignment-control">
              {assignedUser ? (
                <div>
                  {`${assignedUser.firstName || ""} ${
                    assignedUser.lastName || ""
                  } (${assignedUser.role})`}
                </div>
              ) : (
                <>
                  <span>Unassigned</span>
                </>
              )}
            </div>
          </div>
          <div className="task-detail-row">
            <div className="task-detail-label">Created At:</div>
            <div className="task-detail-value">
              {formatDate(task.created_at)}
            </div>
          </div>
          <div className="task-detail-row">
            <div className="task-detail-label">Start Date:</div>
            <div className="task-detail-value">
              {formatDate(task.start_date)}
            </div>
          </div>
          <div className="task-detail-row">
            <div className="task-detail-label">End Date:</div>
            <div className="task-detail-value">{formatDate(task.end_date)}</div>
          </div>
          <div className="task-detail-row">
            <div className="task-detail-label">Time in status:</div>
            <div className="task-detail-value">{getTimeInStatus()}</div>
          </div>
        </div>
      )}

      <div
        className="task-card-footer"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingTop: "10px",
          borderTop: "1px solid #eee",
          marginTop: "10px",
        }}
      >
        {canEdit && (
          <>
            {task.status !== "done" && onMoveTaskRight && (
              <button
                className="button-icon move-right-button"
                onClick={() => onMoveTaskRight(task.id, task.status)}
                title="Move Right"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.2em",
                  marginRight: "8px",
                }}
                data-testid={`move-right-button-${task.id}`}
              >
                ➡️
              </button>
            )}
            <button
              className="button-icon edit-button"
              onClick={onEdit}
              title="Edit Task"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2em",
              }}
            >
              ✏️
            </button>
            <button
              className="button-icon delete-button"
              onClick={onDelete}
              title="Delete Task"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2em",
                color: "#dc3545",
              }}
            >
              🗑️
            </button>
          </>
        )}
        <button
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Collapse" : "Expand"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.2em",
          }}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
