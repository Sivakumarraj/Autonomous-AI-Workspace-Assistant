/** Shape returned by GET /workflows/ — matches the backend WorkflowResponse. */
export interface Workflow {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'paused';
  progress: number;
  steps_total: number;
  steps_done: number;
  created_at: string;
}

/** Body accepted by POST /workflows/. */
export interface WorkflowCreate {
  name: string;
  description?: string;
  total_steps?: number;
}

/** Shape returned by GET /memory/. */
export interface MemoryEntry {
  id: number;
  category: string;
  content: string;
  source: string;
  created_at: string;
  icon: string;
}

/** Shape returned inside GET /logs/. */
export interface LogEntry {
  id: number;
  event: string;
  category: string;
  level: 'info' | 'warning' | 'error' | 'success';
  created_at: string;
}
