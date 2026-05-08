export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'paused';
  progress: number;
  totalSteps: number;
  completedSteps: number;
  startedAt: string;
}

export interface MemoryEntry {
  id: string;
  category: string;
  content: string;
  source: string;
  createdAt: string;
  icon: string;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
  timestamp: string;
}
