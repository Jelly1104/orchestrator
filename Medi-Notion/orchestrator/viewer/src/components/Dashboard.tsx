import React from 'react';
import type { Stats } from '../types';
import { formatTaskId, formatDateTime } from '../utils/formatters';

interface DashboardProps {
  stats: Stats;
}

export function Dashboard({ stats }: DashboardProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">대시보드</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="전체 실행"
          value={stats.totalTasks.toString()}
          icon="📊"
        />
        <StatCard
          label="성공률"
          value={stats.successRate}
          icon="✅"
          highlight={stats.successRate !== 'N/A' && parseFloat(stats.successRate) >= 80}
        />
        <StatCard
          label="총 토큰"
          value={stats.totalTokens.toLocaleString()}
          icon="🎫"
        />
        <StatCard
          label="실패"
          value={stats.failCount.toString()}
          icon="❌"
          warning={stats.failCount > 0}
        />
      </div>

      {/* Recent Tasks */}
      <div className="bg-dark-card rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">최근 실행</h3>
        {stats.recentTasks.length === 0 ? (
          <p className="text-gray-500">실행 기록이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {stats.recentTasks.map(task => (
              <div
                key={task.taskId}
                className="flex items-center justify-between p-3 bg-dark-bg rounded hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={task.status} />
                  <div>
                    <p className="font-medium">{formatTaskId(task.taskId)}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(task.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>{task.totalTokens.toLocaleString()} tokens</p>
                  <p>{task.duration}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
  warning?: boolean;
}

function StatCard({ label, value, icon, highlight, warning }: StatCardProps) {
  let valueClass = 'text-2xl font-bold';
  if (highlight) valueClass += ' text-green-400';
  else if (warning) valueClass += ' text-red-400';
  else valueClass += ' text-primary';

  return (
    <div className="bg-dark-card rounded-lg p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <p className={valueClass}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

interface StatusBadgeProps {
  status: 'SUCCESS' | 'FAIL';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const isSuccess = status === 'SUCCESS';
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        isSuccess
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      {status}
    </span>
  );
}

export default Dashboard;
