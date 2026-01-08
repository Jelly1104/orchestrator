// types.ts - 무찌마 일간 베스트 팟캐스트 타입 정의 (SDD.md 명세 준수)

// 스크립트 라인 (SDD 3.2)
export interface ScriptLine {
  speaker: 'HOST' | 'GUEST';
  text: string;
}

// 메타데이터 (SDD 3.2)
export interface ScriptMetadata {
  generatedAt: string;
  wordCount: number;
  estimatedDuration: string;
}

// 플레이어 상태 (SDD 3.3)
export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'completed';

// 데이터 로딩 상태 (SDD 3.3)
export type LoadingStatus = 'loading' | 'success' | 'error';

// 플레이어 전체 상태 (SDD 3.3)
export interface PlayerState {
  status: PlayerStatus;
  currentLineIndex: number;
  script: ScriptLine[];
  metadata: ScriptMetadata | null;
}

// ScriptDisplay Props (SDD 5.2)
export interface ScriptDisplayProps {
  script: ScriptLine[];
  currentLineIndex: number;
  isPlaying: boolean;
}

// PlayButton Props (SDD 5.2)
export interface PlayButtonProps {
  status: PlayerStatus;
  onToggle: () => void;
  disabled?: boolean;
}
