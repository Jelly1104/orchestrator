import { useState, useEffect, useCallback } from 'react';
import type { TaskSummary, TaskDetail, Stats, DocInfo, FileInfo } from '../types';

const API_BASE = '/api';

/**
 * API fetch wrapper
 */
async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * Tasks Hook
 */
export function useTasks() {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJSON<TaskSummary[]>(`${API_BASE}/logs`);
      setTasks(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tasks, loading, error, refresh };
}

/**
 * Task Detail Hook
 */
export function useTaskDetail(taskId: string | null) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setDetail(null);
      return;
    }

    setLoading(true);
    fetchJSON<TaskDetail>(`${API_BASE}/logs/${taskId}`)
      .then(data => {
        setDetail(data);
        setError(null);
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : 'Failed to fetch detail');
        setDetail(null);
      })
      .finally(() => setLoading(false));
  }, [taskId]);

  return { detail, loading, error };
}

/**
 * Docs Hook
 */
export function useDocs(taskId: string | null) {
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setDocs([]);
      return;
    }

    setLoading(true);
    fetchJSON<DocInfo[]>(`${API_BASE}/docs/${taskId}`)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [taskId]);

  const getDocContent = useCallback(async (taskId: string, filename: string) => {
    return fetchText(`${API_BASE}/docs/${taskId}/${filename}`);
  }, []);

  return { docs, loading, getDocContent };
}

/**
 * Files Hook
 */
export function useFiles() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJSON<FileInfo[]>(`${API_BASE}/files`)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  const getFileContent = useCallback(async (path: string) => {
    return fetchText(`${API_BASE}/file?path=${encodeURIComponent(path)}`);
  }, []);

  return { files, loading, getFileContent };
}

/**
 * Stats Hook (derived from tasks)
 */
export function useStats(tasks: TaskSummary[]): Stats {
  const totalTasks = tasks.length;
  const successCount = tasks.filter(t => t.status === 'SUCCESS').length;
  const failCount = tasks.filter(t => t.status === 'FAIL').length;
  const totalTokens = tasks.reduce((sum, t) => sum + (t.totalTokens || 0), 0);
  const successRate = totalTasks > 0
    ? ((successCount / totalTasks) * 100).toFixed(1) + '%'
    : 'N/A';

  return {
    totalTasks,
    successCount,
    failCount,
    successRate,
    totalTokens,
    recentTasks: tasks.slice(0, 5)
  };
}
