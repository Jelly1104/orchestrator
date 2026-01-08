// PlayButton.tsx - 재생 버튼 컴포넌트 (SDD.md 명세 준수)

import type { PlayButtonProps } from '../types';

export function PlayButton({ status, onToggle, disabled = false }: PlayButtonProps) {
  const getButtonConfig = () => {
    switch (status) {
      case 'idle':
        return {
          label: 'PLAY',
          icon: '▶',
          bgColor: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'playing':
        return {
          label: 'PAUSE',
          icon: '⏸',
          bgColor: 'bg-gray-600 hover:bg-gray-700',
        };
      case 'paused':
        return {
          label: 'RESUME',
          icon: '▶',
          bgColor: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'completed':
        return {
          label: 'REPLAY',
          icon: '↻',
          bgColor: 'bg-blue-600 hover:bg-blue-700',
        };
      default:
        return {
          label: 'PLAY',
          icon: '▶',
          bgColor: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const config = getButtonConfig();

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2
        px-8 py-4 rounded-full
        text-white font-semibold text-lg
        transition-all duration-200
        ${disabled ? 'bg-gray-400 cursor-not-allowed' : config.bgColor}
        active:scale-95
      `}
      aria-label={config.label}
    >
      <span className="text-xl">{config.icon}</span>
      <span>{config.label}</span>
    </button>
  );
}
