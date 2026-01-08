// types.ts - 무찌마 일간 베스트 팟캐스트 타입 정의

// 베스트 게시물 (DOMAIN_SCHEMA.md 준수)
export interface BestPost {
  BOARD_IDX: number;
  TITLE: string;
  engagement_score: number;
  comment_count: number;
}

// 토픽 (대본 단위)
export interface Topic {
  id: number;
  title: string;
  host_comment: string;
  guest_comment: string;
}

// 팟캐스트 대본
export interface PodcastScript {
  date: string;
  duration: number;
  topics: Topic[];
}

// 재생 상태
export type PlayState = 'LOADING' | 'READY' | 'PLAYING' | 'PAUSED' | 'ENDED' | 'ERROR';

// ScriptViewer Props
export interface ScriptViewerProps {
  topics: Topic[];
  currentTopicIndex: number;
  isPlaying: boolean;
}

// PlayControls Props
export interface PlayControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

// BestPostList Props
export interface BestPostListProps {
  posts: BestPost[];
  onPostClick: (index: number) => void;
}
