import React from 'react';
import type { TaskSummary } from '../types';
import { formatTaskId, formatRelativeDate } from '../utils/formatters';

interface TaskListProps {
  tasks: TaskSummary[];
  selectedId: string | null;
  onSelect: (taskId: string) => void;
  loading: boolean;
}

export function TaskList({ tasks, selectedId, onSelect, loading }: TaskListProps) {
  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        실행 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="divide-y divide-dark-border">
      {tasks.map(task => (
        <TaskItem
          key={task.taskId}
          task={task}
          isSelected={task.taskId === selectedId}
          onClick={() => onSelect(task.taskId)}
        />
      ))}
    </div>
  );
}

interface TaskItemProps {
  task: TaskSummary;
  isSelected: boolean;
  onClick: () => void;
}

function TaskItem({ task, isSelected, onClick }: TaskItemProps) {
  const isSuccess = task.status === 'SUCCESS';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 transition-colors hover:bg-secondary/30 ${
        isSelected ? 'bg-secondary border-l-2 border-primary' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">
              {formatTaskId(task.taskId)}
            </span>
            <span
              className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs ${
                isSuccess
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {task.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {formatRelativeDate(task.timestamp)}
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 flex-shrink-0">
          <p>{task.totalTokens.toLocaleString()} tok</p>
          <p>{task.duration}</p>
        </div>
      </div>
    </button>
  );
}

export default TaskList;
