// usePodcast.ts - 커스텀 훅 (SDD.md 명세 준수)

import { useState, useEffect, useCallback } from 'react';
import type { PlayerState, PlayerStatus, ScriptLine, ScriptMetadata, LoadingStatus } from '../types';
import { MOCK_SCRIPT, MOCK_METADATA } from '../data';

// 라인당 표시 시간 (밀리초) - TTS 시뮬레이션
const LINE_DURATION_MS = 15000;

interface UsePodcastReturn {
  playerState: PlayerState;
  loadingStatus: LoadingStatus;
  metadata: ScriptMetadata | null;
  togglePlayPause: () => void;
  reset: () => void;
}

export function usePodcast(): UsePodcastReturn {
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('loading');
  const [script, setScript] = useState<ScriptLine[]>([]);
  const [metadata, setMetadata] = useState<ScriptMetadata | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // 초기 데이터 로드 (Fixture 사용)
  useEffect(() => {
    setLoadingStatus('loading');

    const loadTimer = setTimeout(() => {
      try {
        setScript(MOCK_SCRIPT);
        setMetadata(MOCK_METADATA);
        setLoadingStatus('success');
      } catch {
        setLoadingStatus('error');
      }
    }, 500);

    return () => clearTimeout(loadTimer);
  }, []);

  // 재생 로직 (TTS 시뮬레이션)
  useEffect(() => {
    if (status !== 'playing' || script.length === 0) return;

    const interval = setInterval(() => {
      setCurrentLineIndex((prev) => {
        const next = prev + 1;
        if (next >= script.length) {
          setStatus('completed');
          return prev;
        }
        return next;
      });
    }, LINE_DURATION_MS);

    return () => clearInterval(interval);
  }, [status, script.length]);

  // 재생/일시정지 토글
  const togglePlayPause = useCallback(() => {
    setStatus((prev) => {
      switch (prev) {
        case 'idle':
        case 'paused':
          return 'playing';
        case 'playing':
          return 'paused';
        case 'completed':
          setCurrentLineIndex(0);
          return 'playing';
        default:
          return prev;
      }
    });
  }, []);

  // 리셋
  const reset = useCallback(() => {
    setStatus('idle');
    setCurrentLineIndex(0);
  }, []);

  const playerState: PlayerState = {
    status,
    currentLineIndex,
    script,
    metadata,
  };

  return {
    playerState,
    loadingStatus,
    metadata,
    togglePlayPause,
    reset,
  };
}
