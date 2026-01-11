// SectionBlock.tsx - 섹션 컨테이너 컴포넌트
import { SectionBlockProps } from '../types';
import { DialogueLine } from './DialogueLine';
import { formatTimeCode } from './TimeCode';

export function SectionBlock({ section }: SectionBlockProps) {
  const sectionLabel = {
    intro: 'INTRO',
    main: 'MAIN TOPIC',
    outro: 'OUTRO'
  }[section.type];

  const sectionColor = {
    intro: 'border-purple-300 bg-purple-50',
    main: 'border-gray-300 bg-white',
    outro: 'border-orange-300 bg-orange-50'
  }[section.type];

  return (
    <div className={`border rounded-lg p-4 mb-4 ${sectionColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-800 text-white text-xs font-bold rounded">
            {sectionLabel}
          </span>
          <span className="font-medium text-gray-700">{section.title}</span>
        </div>
        <span className="text-sm text-gray-500">
          {formatTimeCode(section.duration)} 분량
        </span>
      </div>

      <div className="space-y-2">
        {section.dialogues.map((dialogue, index) => (
          <DialogueLine key={`${section.id}-${index}`} dialogue={dialogue} />
        ))}
      </div>
    </div>
  );
}
