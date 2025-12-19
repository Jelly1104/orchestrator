/**
 * Orchestrator 뷰어 타입 정의
 */

export interface TaskSummary {
  taskId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAIL';
  totalTokens: number;
  duration: string;
}

export interface TaskDetail {
  taskId: string;
  startTime: string;
  endTime?: string;
  success: boolean;
  totalTokens: {
    total: number;
    byAgent?: Record<string, number>;
  };
  totalDuration: string;
  retryCount: number;
  phases?: Record<string, PhaseResult>;
  error?: string;
}

export interface PhaseResult {
  name: string;
  status: 'success' | 'fail' | 'skipped';
  duration: string;
  tokens: number;
  output?: string;
}

export interface DocInfo {
  name: string;
  path: string;
}

export interface FileInfo {
  name: string;
  path: string;
  fullPath: string;
  ext: string;
  size?: number;
}

export interface Stats {
  totalTasks: number;
  successCount: number;
  failCount: number;
  successRate: string;
  totalTokens: number;
  recentTasks: TaskSummary[];
}

export type Tab = 'dashboard' | 'logs' | 'docs' | 'files' | 'analysis';
