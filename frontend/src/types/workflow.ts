/**
 * Workflow lifecycle:
 *   active    - created, never run
 *   planning  - Gemini is deciding the steps
 *   running   - executing them
 *   completed - finished successfully
 *   failed    - a step errored, see `error`
 *   paused    - run stopped between steps
 */
export type WorkflowStatus =
  | 'active'
  | 'planning'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused';

/** Shape returned by GET /workflows/ — matches the backend WorkflowResponse. */
export interface Workflow {
  id: number;
  name: string;
  description: string;
  status: WorkflowStatus;
  progress: number;
  steps_total: number;
  steps_done: number;
  error: string;
  started_at: string;
  finished_at: string;
  created_at: string;
}

/** One planned step, from GET /workflows/{id}/steps. */
export interface WorkflowStep {
  id: number;
  workflow_id: number;
  position: number;
  action: string;
  title: string;
  params: Record<string, string>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: string;
  error: string;
  started_at: string;
  finished_at: string;
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
