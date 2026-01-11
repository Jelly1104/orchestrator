// PodcastPlayer.tsx - 메인 팟캐스트 플레이어 컴포넌트 (SDD.md 명세 준수)

import { useState, useEffect, useCallback } from 'react';
import type { PlayState, PodcastScript, BestPost } from './types';
import { MOCK_PODCAST_SCRIPT, MOCK_BEST_POSTS } from './data';
import { ScriptViewer } from './components/ScriptViewer';
import { PlayControls } from './components/PlayControls';
import { BestPostList } from './components/BestPostList';

// 토픽당 표시 시간 (초)
const TOPIC_DURATION = 36;

export function PodcastPlayer() {
  const [playState, setPlayState] = useState<PlayState>('LOADING');
  const [script, setScript] = useState<PodcastScript | null>(null);
  const [bestPosts, setBestPosts] = useState<BestPost[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // 초기 데이터 로드 (Fixture 사용)
  useEffect(() => {
    setPlayState('LOADING');

    const loadTimer = setTimeout(() => {
      setScript(MOCK_PODCAST_SCRIPT);
      setBestPosts(MOCK_BEST_POSTS);
      setPlayState('READY');
    }, 500);

    return () => clearTimeout(loadTimer);
  }, []);

  // 재생 로직
  useEffect(() => {
    if (playState !== 'PLAYING' || !script) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        if (next >= script.duration) {
          setPlayState('ENDED');
          return script.duration;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playState, script]);

  // 현재 시간에 따른 토픽 인덱스 업데이트
  useEffect(() => {
    if (!script) return;
    const topicIndex = Math.min(
      Math.floor(currentTime / TOPIC_DURATION),
      script.topics.length - 1
    );
    setCurrentTopicIndex(topicIndex);
  }, [currentTime, script]);

  // 재생/일시정지 토글
  const handlePlayPause = useCallback(() => {
    if (playState === 'PLAYING') {
      setPlayState('PAUSED');
    } else if (playState === 'PAUSED' || playState === 'READY') {
      setPlayState('PLAYING');
    } else if (playState === 'ENDED') {
      setCurrentTime(0);
      setCurrentTopicIndex(0);
      setPlayState('PLAYING');
    }
  }, [playState]);

  // 시간 이동
  const handleSeek = useCallback((time: number) => {
    if (!script) return;
    const clampedTime = Math.max(0, Math.min(time, script.duration));
    setCurrentTime(clampedTime);
  }, [script]);

  // 이전 토픽
  const handlePrev = useCallback(() => {
    if (!script) return;
    const newIndex = Math.max(0, currentTopicIndex - 1);
    setCurrentTopicIndex(newIndex);
    setCurrentTime(newIndex * TOPIC_DURATION);
  }, [currentTopicIndex, script]);

  // 다음 토픽
  const handleNext = useCallback(() => {
    if (!script) return;
    const newIndex = Math.min(script.topics.length - 1, currentTopicIndex + 1);
    setCurrentTopicIndex(newIndex);
    setCurrentTime(newIndex * TOPIC_DURATION);
  }, [currentTopicIndex, script]);

  // 베스트 게시물 클릭 시 해당 토픽으로 이동
  const handlePostClick = useCallback((index: number) => {
    if (!script || index >= script.topics.length) return;
    setCurrentTopicIndex(index);
    setCurrentTime(index * TOPIC_DURATION);
  }, [script]);

  // 에러 상태
  if (playState === 'ERROR') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-red-600 font-semibold">데이터를 불러올 수 없습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (playState === 'LOADING') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 mb-6 text-white text-center">
          <h1 className="text-2xl font-bold">무찌마 일간 베스트</h1>
          <p className="text-blue-100 mt-1">{script?.date || '-'}</p>
        </header>

        {/* Desktop: 2열 레이아웃, Mobile: 1열 */}
        <div className="lg:flex lg:gap-6">
          {/* 좌측: 플레이어 영역 */}
          <div className="lg:flex-1 space-y-4">
            {/* Script Viewer */}
            <section className="bg-white rounded-lg shadow-md overflow-hidden">
              <ScriptViewer
                topics={script?.topics || []}
                currentTopicIndex={currentTopicIndex}
                isPlaying={playState === 'PLAYING'}
              />
            </section>

            {/* Play Controls */}
            <section>
              <PlayControls
                isPlaying={playState === 'PLAYING'}
                currentTime={currentTime}
                duration={script?.duration || 180}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            </section>
          </div>

          {/* 우측: 베스트 목록 */}
          <div className="lg:w-80 mt-6 lg:mt-0">
            <BestPostList
              posts={bestPosts}
              onPostClick={handlePostClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
