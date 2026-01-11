// PodcastPlayer.tsx - 메인 컴포넌트 (SDD.md 명세 준수)

import { usePodcast } from './hooks/usePodcast';
import { ScriptDisplay } from './components/ScriptDisplay';
import { PlayButton } from './components/PlayButton';

export function PodcastPlayer() {
  const { playerState, loadingStatus, metadata, togglePlayPause } = usePodcast();
  const { status, currentLineIndex, script } = playerState;

  // 로딩 상태
  if (loadingStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">대본을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (loadingStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <p className="text-red-600 font-semibold mb-4">
            대본을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 오늘 날짜 포맷
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🎙️</span>
            <h1 className="text-2xl font-bold text-gray-900">무찌마 일간 베스트 팟캐스트</h1>
          </div>
          <p className="text-gray-500 text-sm">{today} 생성</p>
        </header>

        {/* Player Control */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col items-center gap-4">
            <PlayButton
              status={status}
              onToggle={togglePlayPause}
              disabled={script.length === 0}
            />

            {/* Meta Info */}
            {metadata && (
              <div className="text-center text-gray-500 text-sm">
                <span>{metadata.estimatedDuration}</span>
                <span className="mx-2">|</span>
                <span>{metadata.wordCount} 단어</span>
              </div>
            )}

            {/* Status Indicator */}
            <div className="text-sm text-gray-400">
              {status === 'idle' && '재생 버튼을 눌러 시작하세요'}
              {status === 'playing' && `재생 중... ${currentLineIndex + 1} / ${script.length}`}
              {status === 'paused' && `일시정지 ${currentLineIndex + 1} / ${script.length}`}
              {status === 'completed' && '재생 완료'}
            </div>
          </div>
        </section>

        {/* Script Display */}
        <section className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-100 px-6 py-3 border-b">
            <h2 className="font-semibold text-gray-700">대본</h2>
          </div>
          <ScriptDisplay
            script={script}
            currentLineIndex={currentLineIndex}
            isPlaying={status === 'playing'}
          />
        </section>
      </div>
    </div>
  );
}
