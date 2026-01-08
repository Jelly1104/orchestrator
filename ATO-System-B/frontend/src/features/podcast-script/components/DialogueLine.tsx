// DialogueLine.tsx - 발화자별 대사 라인 컴포넌트
import { DialogueLineProps } from '../types';
import { TimeCode } from './TimeCode';

export function DialogueLine({ dialogue }: DialogueLineProps) {
  const isHost = dialogue.speaker === 'host';

  const containerClass = isHost
    ? 'bg-blue-50 text-blue-800 p-3 rounded mb-2'
    : 'bg-green-50 text-green-800 p-3 rounded mb-2';

  const icon = isHost ? '🎤' : '🎧';
  const speakerName = isHost ? 'Host' : 'Guest';

  return (
    <div className={containerClass}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{speakerName}</span>
            {dialogue.startTime !== undefined && (
              <TimeCode seconds={dialogue.startTime} />
            )}
          </div>
          <p className="text-sm leading-relaxed">"{dialogue.text}"</p>
        </div>
      </div>
    </div>
  );
}
