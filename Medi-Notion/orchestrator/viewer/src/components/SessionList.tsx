import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '../types';

interface SessionListProps {
  onSelectSession?: (taskId: string) => void;
  selectedId?: string | null;
  className?: string;
}

export function SessionList({ onSelectSession, selectedId, className = '' }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await res.json();
      setSessions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      console.error('Failed to fetch sessions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  if (loading && sessions.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        세션 로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-red-400 mb-2">세션 조회 실패</p>
        <button
          onClick={fetchSessions}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          재시도
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        활성 세션이 없습니다.
      </div>
    );
  }

  return (
    <div className={`divide-y divide-dark-border ${className}`}>
      {sessions.map(session => (
        <SessionItem
          key={session.taskId}
          session={session}
          isSelected={session.taskId === selectedId}
          onClick={() => onSelectSession?.(session.taskId)}
        />
      ))}
    </div>
  );
}

interface SessionItemProps {
  session: Session;
  isSelected: boolean;
  onClick: () => void;
}

function SessionItem({ session, isSelected, onClick }: SessionItemProps) {
  const statusConfig = {
    RUNNING: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: '실행 중' },
    PAUSED_HITL: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'HITL 대기' },
    COMPLETED: { color: 'text-green-400', bg: 'bg-green-500/20', label: '완료' },
    FAILED: { color: 'text-red-400', bg: 'bg-red-500/20', label: '실패' }
  };

  const config = statusConfig[session.status] || statusConfig.RUNNING;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 transition-colors hover:bg-secondary/30 ${
        isSelected ? 'bg-secondary border-l-2 border-primary' : ''
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white truncate">
            {session.taskId.substring(0, 24)}...
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${config.bg} ${config.color}`}>
            {config.label}
          </span>
        </div>

        {session.currentPhase && (
          <div className="text-sm text-gray-400">
            Phase: {session.currentPhase}
          </div>
        )}

        {session.currentCheckpoint && (
          <div className="text-sm text-purple-400">
            Checkpoint: {session.currentCheckpoint}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            재시도: {session.retryCount}/{session.maxRetries}
          </span>
          <span>
            {new Date(session.startTime).toLocaleTimeString('ko-KR')}
          </span>
        </div>

        {session.progress !== undefined && session.progress > 0 && (
          <div className="mt-2">
            <div className="h-1 bg-dark-border rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${session.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export default SessionList;
