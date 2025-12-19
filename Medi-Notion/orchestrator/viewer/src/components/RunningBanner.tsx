import React from 'react';
import type { RunningTask } from '../hooks/useWebSocket';
import { formatTaskId } from '../utils/formatters';

interface RunningBannerProps {
  runningTask: RunningTask | null;
}

export function RunningBanner({ runningTask }: RunningBannerProps) {
  if (!runningTask) return null;

  const progress = runningTask.progress || 0;

  return (
    <div className="bg-amber-500 text-black px-5 py-3">
      <div className="flex items-center gap-3">
        {/* Spinner */}
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />

        {/* Info */}
        <div className="flex-1">
          <div className="font-semibold">
            실행 중: {formatTaskId(runningTask.taskId)}
          </div>
          <div className="text-sm opacity-80">
            {runningTask.currentPhase || '준비 중...'}
          </div>
        </div>

        {/* Progress */}
        {progress > 0 && (
          <div className="text-right">
            <span className="font-bold">{progress}%</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="mt-2 h-1 bg-black/20 rounded overflow-hidden">
          <div
            className="h-full bg-black/50 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default RunningBanner;
