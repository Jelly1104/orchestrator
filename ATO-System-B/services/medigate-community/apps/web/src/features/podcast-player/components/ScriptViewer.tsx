// ScriptViewer.tsx - 대본 표시 컴포넌트 (SDD.md 명세 준수)

import type { ScriptViewerProps } from '../types';

export function ScriptViewer({ topics, currentTopicIndex, isPlaying }: ScriptViewerProps) {
  const currentTopic = topics[currentTopicIndex];

  if (!currentTopic) {
    return (
      <div className="bg-white rounded-lg p-6 text-center text-gray-500">
        대본을 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 space-y-4">
      <div className="text-center mb-4">
        <span className="text-sm text-gray-500">
          {currentTopicIndex + 1} / {topics.length}
        </span>
        <h3 className="text-lg font-semibold text-gray-800 mt-1">
          {currentTopic.title}
        </h3>
      </div>

      <div className="space-y-4">
        <div className={`flex items-start gap-3 p-4 rounded-lg bg-blue-50 transition-opacity ${
          isPlaying ? 'opacity-100' : 'opacity-70'
        }`}>
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-blue-800 mb-1">Host</div>
            <p className="text-gray-700 leading-relaxed">
              {currentTopic.host_comment}
            </p>
          </div>
        </div>

        <div className={`flex items-start gap-3 p-4 rounded-lg bg-green-50 transition-opacity ${
          isPlaying ? 'opacity-100' : 'opacity-70'
        }`}>
          <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">G</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-green-800 mb-1">Guest</div>
            <p className="text-gray-700 leading-relaxed">
              {currentTopic.guest_comment}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
