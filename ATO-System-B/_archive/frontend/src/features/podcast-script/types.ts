// types.ts - 무찌마 일간 베스트 팟캐스트 타입 정의

// 입력 데이터 타입 (analysis_report.md 기반)
export interface BestPost {
  boardIdx: number;
  title: string;
  readCnt: number;
  agreeCnt: number;
  commentCount: number;
  popularityScore: number;
  summary: string;
  sentiment: string;
  suitability: 'high' | 'medium' | 'low';
}

export interface AnalysisData {
  posts: BestPost[];
  trendKeywords: string[];
  generatedAt: string;
}

// 출력 데이터 타입 (Podcast_Script.md)
export interface PodcastScript {
  episodeId: string;
  createdAt: string;
  totalDuration: number;
  wordCount: number;
  sections: Section[];
}

export interface Section {
  id: string;
  type: 'intro' | 'main' | 'outro';
  title: string;
  duration: number;
  dialogues: Dialogue[];
}

export interface Dialogue {
  speaker: 'host' | 'guest';
  text: string;
  startTime?: number;
}

// Props 인터페이스
export interface ScriptHeaderProps {
  episodeId: string;
  createdAt: string;
  totalDuration: number;
}

export interface SectionBlockProps {
  section: Section;
}

export interface DialogueLineProps {
  dialogue: Dialogue;
}

export interface TimeCodeProps {
  seconds: number;
}
