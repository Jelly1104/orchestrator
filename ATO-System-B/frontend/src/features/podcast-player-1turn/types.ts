// types.ts - 타입 정의 (SDD.md Section 3.2, 3.3, 5.2 준수)

/**
 * 대본 라인 인터페이스
 * SDD.md 4.2 - GET /api/podcast/script 응답 형식
 */
export interface ScriptLine {
  speaker: 'HOST' | 'GUEST';
  text: string;
}

/**
 * 대본 메타데이터
 * SDD.md 4.2 - GET /api/podcast/script 응답 형식
 */
export interface ScriptMetadata {
  generatedAt: string;
  wordCount: number;
  estimatedDuration: string;
}

/**
 * 플레이어 상태
 * SDD.md 3.3 - PlayerStatus 정의
 */
export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'completed';

/**
 * 데이터 로딩 상태
 * SDD.md 3.3 - LoadingStatus 정의
 */
export type LoadingStatus = 'loading' | 'success' | 'error';

/**
 * 플레이어 전체 상태
 * SDD.md 3.3 - PlayerState 정의
 */
export interface PlayerState {
  status: PlayerStatus;
  currentLineIndex: number;
  script: ScriptLine[];
  metadata: ScriptMetadata | null;
}

/**
 * ScriptDisplay 컴포넌트 Props
 * SDD.md 5.2 - ScriptDisplayProps 정의
 */
export interface ScriptDisplayProps {
  script: ScriptLine[];
  currentLineIndex: number;
  isPlaying: boolean;
}

/**
 * PlayButton 컴포넌트 Props
 * SDD.md 5.2 - PlayButtonProps 정의
 */
export interface PlayButtonProps {
  status: PlayerStatus;
  onToggle: () => void;
  disabled?: boolean;
}
