// 팟캐스트 관련 타입 정의
export interface BestPost {
  board_idx: number;
  title: string;
  content_preview: string;
  read_cnt: number;
  comment_cnt: number;
  score: number;
  category?: string;
  pii_detected: string[];
}

export interface ExtractionMetadata {
  total_candidates: number;
  selected_count: number;
  processing_time: string;
}

export interface GenerationOptions {
  target_duration: string;
  host_character: 'professional' | 'friendly' | 'analytical';
  guest_character: 'experienced' | 'junior' | 'specialist';
  tone: 'formal' | 'conversational' | 'educational';
}

export interface ScriptSegmentMetadata {
  emotion: '밝음' | '진지함' | '놀람' | '걱정';
  speed: '빠름' | '보통' | '느림';
  emphasis: string[];
  pause_after: number;
}

export interface ScriptSegment {
  speaker: 'HOST' | 'GUEST';
  text: string;
  metadata: ScriptSegmentMetadata;
}

export interface PodcastMetadata {
  total_duration: string;
  host_duration: string;
  guest_duration: string;
  top_keywords: [string, number][];
}

export interface PodcastScript {
  script_id: string;
  total_duration: string;
  segments: ScriptSegment[];
  metadata: PodcastMetadata;
}

// 레거시 DB 매핑용 타입 (DOMAIN_SCHEMA 준수)
export interface BoardMuzzimaRow {
  BOARD_IDX: number;
  CTG_CODE: string;
  U_ID: string;
  TITLE: string;
  CONTENT: string;
  READ_CNT: number;
  AGREE_CNT: number;
  REG_DATE: Date;
}

export interface CommentRow {
  COMMENT_IDX: number;
  BOARD_IDX: number;
  SVC_CODE: string;
  U_ID: string;
  CONTENT: string;
  PARENT_IDX: number | null;
  REG_DATE: Date;
}

// API 응답 타입
export interface ExtractionResponse {
  status: 'success' | 'error';
  data?: {
    extraction_date: string;
    posts: BestPost[];
    metadata: ExtractionMetadata;
  };
  error?: string;
}

export interface GenerationResponse {
  status: 'success' | 'error';
  data?: PodcastScript;
  error?: string;
}