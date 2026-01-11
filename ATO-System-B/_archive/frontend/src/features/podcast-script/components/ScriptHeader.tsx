// ScriptHeader.tsx - 에피소드 헤더 컴포넌트
import { ScriptHeaderProps } from '../types';
import { formatTimeCode } from './TimeCode';

export function ScriptHeader({ episodeId, createdAt, totalDuration }: ScriptHeaderProps) {
  return (
    <div className="text-center mb-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
      <div className="text-4xl mb-2">🎙️</div>
      <h1 className="text-2xl font-bold mb-1">무찌마 데일리 핫토픽</h1>
      <p className="text-lg opacity-90">Episode #{episodeId}</p>
      <div className="mt-4 flex justify-center gap-6 text-sm opacity-80">
        <span>📅 {createdAt}</span>
        <span>⏱️ {formatTimeCode(totalDuration)}</span>
      </div>
    </div>
  );
}
