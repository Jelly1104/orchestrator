// TimeCode.tsx - 타임코드 표시 컴포넌트
import { TimeCodeProps } from '../types';

export function formatTimeCode(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function TimeCode({ seconds }: TimeCodeProps) {
  return (
    <span className="text-gray-500 text-sm font-mono">
      {formatTimeCode(seconds)}
    </span>
  );
}
