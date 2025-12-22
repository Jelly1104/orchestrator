import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LogEntry } from '../types';

interface LogViewerProps {
  taskId?: string | null;
  autoScroll?: boolean;
  maxLines?: number;
  className?: string;
}

export function LogViewer({
  taskId = null,
  autoScroll = true,
  maxLines = 1000,
  className = ''
}: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    if (isPaused) return;

    try {
      const url = taskId ? `/api/logs/${taskId}` : '/api/logs';
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();

      if (taskId) {
        // 단일 태스크 로그 - phases에서 로그 추출
        const logEntries: LogEntry[] = [];
        if (data.phases) {
          Object.entries(data.phases).forEach(([phaseName, phaseData]: [string, any]) => {
            if (phaseData.logs && Array.isArray(phaseData.logs)) {
              phaseData.logs.forEach((log: any) => {
                logEntries.push({
                  timestamp: log.timestamp || new Date().toISOString(),
                  level: log.level || 'info',
                  message: log.message || String(log),
                  taskId: data.taskId,
                  phase: phaseName,
                  metadata: log.metadata
                });
              });
            }
          });
        }
        setLogs(logEntries.slice(-maxLines));
      } else {
        // 전체 로그 목록
        const logEntries: LogEntry[] = data.map((item: any) => ({
          timestamp: item.timestamp || item.startTime,
          level: item.success === false ? 'error' : 'info',
          message: `Task ${item.taskId}: ${item.success === false ? 'FAILED' : 'SUCCESS'}`,
          taskId: item.taskId,
          metadata: item
        }));
        setLogs(logEntries.slice(-maxLines));
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  }, [taskId, isPaused, maxLines]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  useEffect(() => {
    if (autoScroll && !isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isPaused]);

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controls */}
      <div className="flex items-center gap-3 p-3 bg-dark-card border-b border-dark-border">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="검색..."
          className="flex-1 px-3 py-1.5 bg-dark-bg border border-dark-border rounded text-sm text-white placeholder-gray-500"
        />

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded text-sm text-white"
        >
          <option value="all">전체</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`px-3 py-1.5 rounded text-sm font-medium ${
            isPaused
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-secondary text-white hover:bg-secondary/80'
          }`}
        >
          {isPaused ? '▶ 재개' : '⏸ 일시정지'}
        </button>

        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 bg-secondary text-white rounded text-sm hover:bg-secondary/80"
        >
          🔄
        </button>

        <span className="text-xs text-gray-500">
          {filteredLogs.length} / {logs.length}
        </span>
      </div>

      {/* Log Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-dark-bg font-mono text-xs"
      >
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {isPaused ? '일시정지됨' : '로그가 없습니다.'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredLogs.map((log, idx) => (
              <LogLine key={idx} log={log} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}

interface LogLineProps {
  log: LogEntry;
}

function LogLine({ log }: LogLineProps) {
  const levelConfig = {
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    warn: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    error: { color: 'text-red-400', bg: 'bg-red-500/10' },
    debug: { color: 'text-gray-400', bg: 'bg-gray-500/10' }
  };

  const config = levelConfig[log.level] || levelConfig.info;
  const time = new Date(log.timestamp).toLocaleTimeString('ko-KR');

  return (
    <div className={`flex gap-2 p-1.5 rounded ${config.bg} hover:bg-secondary/20 transition-colors`}>
      <span className="text-gray-500 flex-shrink-0">{time}</span>
      <span className={`${config.color} font-semibold flex-shrink-0 w-12`}>
        {log.level.toUpperCase()}
      </span>
      {log.phase && (
        <span className="text-purple-400 flex-shrink-0">
          [{log.phase}]
        </span>
      )}
      <span className="text-gray-300 flex-1 break-words">
        {log.message}
      </span>
    </div>
  );
}

export default LogViewer;
