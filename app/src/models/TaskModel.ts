export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high";
  estimated_time?: number | null;
  status: "todo" | "doing" | "done";
  assigned_to?: string | null;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  created_at?: string | Date;
  worked_hours?: number | null;
}
