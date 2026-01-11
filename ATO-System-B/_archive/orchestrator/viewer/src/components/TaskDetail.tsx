import React from 'react';
import type { TaskDetail as TaskDetailType } from '../types';
import { formatTaskId } from '../utils/formatters';

interface TaskDetailProps {
  detail: TaskDetailType | null;
  loading: boolean;
  error: string | null;
}

export function TaskDetail({ detail, loading, error }: TaskDetailProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        에러: {error}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-8 text-center text-gray-500">
        좌측에서 항목을 선택하세요.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{formatTaskId(detail.taskId)}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {detail.startTime && formatDateTime(detail.startTime)}
          </p>
        </div>
        <StatusBadge success={detail.success !== false} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          label="상태"
          value={detail.success !== false ? '✅ 성공' : '❌ 실패'}
        />
        <StatBox
          label="총 토큰"
          value={(detail.totalTokens?.total || 0).toLocaleString()}
        />
        <StatBox
          label="재시도"
          value={String(detail.retryCount || 0)}
        />
        <StatBox
          label="소요시간"
          value={detail.totalDuration || '-'}
        />
      </div>

      {/* Phases */}
      {detail.phases && Object.keys(detail.phases).length > 0 && (
        <div className="bg-dark-card rounded-lg p-4">
          <h3 className="font-semibold mb-3">실행 단계</h3>
          <div className="space-y-2">
            {Object.entries(detail.phases).map(([name, phase]) => (
              <PhaseRow key={name} name={name} phase={phase} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {detail.error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <h3 className="font-semibold text-red-400 mb-2">에러</h3>
          <pre className="text-sm text-red-300 whitespace-pre-wrap">
            {detail.error}
          </pre>
        </div>
      )}

      {/* Raw JSON */}
      <details className="bg-dark-card rounded-lg">
        <summary className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors font-semibold">
          원본 JSON 보기
        </summary>
        <pre className="p-4 pt-0 text-xs overflow-x-auto text-gray-400">
          {JSON.stringify(detail, null, 2)}
        </pre>
      </details>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="bg-dark-card rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-primary">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

interface StatusBadgeProps {
  success: boolean;
}

function StatusBadge({ success }: StatusBadgeProps) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        success
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      {success ? 'SUCCESS' : 'FAIL'}
    </span>
  );
}

interface PhaseRowProps {
  name: string;
  phase: any;
}

function PhaseRow({ name, phase }: PhaseRowProps) {
  const status = phase.status || 'unknown';
  const statusIcon = status === 'success' ? '✅' : status === 'fail' ? '❌' : '⏭️';

  return (
    <div className="flex items-center justify-between p-2 bg-dark-bg rounded">
      <div className="flex items-center gap-2">
        <span>{statusIcon}</span>
        <span className="font-medium">{name}</span>
      </div>
      <div className="text-sm text-gray-500">
        {phase.duration && <span className="mr-3">{phase.duration}</span>}
        {phase.tokens && <span>{phase.tokens.toLocaleString()} tok</span>}
      </div>
    </div>
  );
}

function formatDateTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return timestamp;
  }
}

export default TaskDetail;
