// PlayButton.tsx - 재생 버튼 컴포넌트 (SDD.md 5.3 준수)

import type { PlayButtonProps } from '../types';

/**
 * 상태별 버튼 설정
 */
function getButtonConfig(status: PlayButtonProps['status']) {
  switch (status) {
    case 'idle':
      return {
        icon: '▶',
        label: '재생',
        bgClass: 'bg-blue-600 hover:bg-blue-700',
      };
    case 'playing':
      return {
        icon: '⏸',
        label: '일시정지',
        bgClass: 'bg-gray-600 hover:bg-gray-700',
      };
    case 'paused':
      return {
        icon: '▶',
        label: '계속',
        bgClass: 'bg-blue-600 hover:bg-blue-700',
      };
    case 'completed':
      return {
        icon: '🔄',
        label: '다시 듣기',
        bgClass: 'bg-blue-600 hover:bg-blue-700',
      };
    default:
      return {
        icon: '▶',
        label: '재생',
        bgClass: 'bg-blue-600 hover:bg-blue-700',
      };
  }
}

export function PlayButton({ status, onToggle, disabled = false }: PlayButtonProps) {
  const config = getButtonConfig(status);

  const baseClasses = 'rounded-full px-8 py-4 text-white font-semibold text-lg transition-colors flex items-center gap-2';
  const disabledClasses = disabled ? 'bg-gray-400 cursor-not-allowed' : config.bgClass;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses}`}
      aria-label={config.label}
    >
      <span className="text-xl">{config.icon}</span>
      <span>{config.label}</span>
    </button>
  );
}
