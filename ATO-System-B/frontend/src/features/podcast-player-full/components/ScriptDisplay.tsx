// ScriptDisplay.tsx - 대본 표시 컴포넌트 (SDD.md 명세 준수)

import type { ScriptDisplayProps } from '../types';

export function ScriptDisplay({ script, currentLineIndex, isPlaying }: ScriptDisplayProps) {
  if (script.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center text-gray-500">
        오늘의 베스트 게시물이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
      {script.map((line, index) => {
        const isCurrentLine = index === currentLineIndex;
        const isPastLine = index < currentLineIndex;
        const isFutureLine = index > currentLineIndex;

        const isHost = line.speaker === 'HOST';

        return (
          <div
            key={index}
            className={`
              flex items-start gap-3 p-4 rounded-lg transition-all duration-300
              ${isHost ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-green-50 border-l-4 border-green-500'}
              ${isCurrentLine && isPlaying ? 'ring-2 ring-offset-2 ring-blue-400 scale-[1.02]' : ''}
              ${isPastLine ? 'opacity-50' : ''}
              ${isFutureLine ? 'opacity-70' : ''}
            `}
          >
            <div
              className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold
                ${isHost ? 'bg-blue-500' : 'bg-green-500'}
              `}
            >
              {isHost ? 'H' : 'G'}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-semibold mb-1 ${isHost ? 'text-blue-800' : 'text-green-800'}`}>
                {isHost ? 'HOST' : 'GUEST'}
              </div>
              <p className="text-gray-700 leading-relaxed">
                {line.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
