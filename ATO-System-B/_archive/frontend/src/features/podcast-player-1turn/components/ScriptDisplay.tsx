// ScriptDisplay.tsx - 대본 표시 컴포넌트 (SDD.md 5.3, 7.2 준수)

import type { ScriptDisplayProps } from '../types';

/**
 * 라인 스타일 계산
 */
function getLineStyles(
  speaker: 'HOST' | 'GUEST',
  index: number,
  currentIndex: number,
  isPlaying: boolean
) {
  // 화자별 기본 스타일 (SDD.md 7.2)
  const speakerStyles = speaker === 'HOST'
    ? 'bg-blue-50 border-l-4 border-blue-500'
    : 'bg-green-50 border-l-4 border-green-500';

  // 위치별 상태 스타일
  let stateStyles = '';
  if (index === currentIndex) {
    stateStyles = isPlaying
      ? 'ring-2 ring-offset-2 ring-blue-400 scale-[1.02]'
      : 'ring-2 ring-offset-2 ring-gray-400';
  } else if (index < currentIndex) {
    stateStyles = 'opacity-50';
  } else {
    stateStyles = 'opacity-70';
  }

  return `${speakerStyles} ${stateStyles}`;
}

export function ScriptDisplay({ script, currentLineIndex, isPlaying }: ScriptDisplayProps) {
  // 빈 스크립트 처리 (SDD.md 8 에러 처리)
  if (script.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        오늘의 베스트 게시물이 없습니다.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {script.map((line, index) => {
        const lineStyles = getLineStyles(line.speaker, index, currentLineIndex, isPlaying);
        const speakerLabel = line.speaker === 'HOST' ? '호스트' : '게스트';

        return (
          <div
            key={index}
            className={`p-4 rounded-r-lg transition-all duration-300 ${lineStyles}`}
          >
            <div className="flex items-start gap-3">
              <span className={`
                text-xs font-bold px-2 py-1 rounded
                ${line.speaker === 'HOST' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}
              `}>
                {speakerLabel}
              </span>
              <p className="text-gray-800 leading-relaxed flex-1">
                {line.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
