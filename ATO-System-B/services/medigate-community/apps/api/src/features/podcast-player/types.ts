// 팟캐스트 생성을 위한 타입 정의
export interface BestPostData {
  BOARD_IDX: number;
  TITLE: string;
  CONTENT: string;
  read_CNT: number;
  AGREE_CNT: number;
  REG_DATE: string;
  comment_count: number;
  engagement_score: number;
}

export interface RawDataSummary {
  extraction_date: string;
  best_posts: Array<{
    board_idx: number;
    title: string;
    summary: string;
    engagement_score: number;
    masked_content: string;
  }>;
  total_posts: number;
  extraction_criteria: string;
}

export interface PodcastSegment {
  timestamp: string;
  speaker: 'Host' | 'Guest';
  content: string;
  duration_seconds: number;
}

export interface AudioMetadata {
  audio_config: {
    voice: string;
    speaking_rate: number;
    pitch: number;
    volume_gain_db: number;
  };
  segments: PodcastSegment[];
  total_estimated_duration: number;
  emotion_tags: {
    [key: string]: string;
  };
}

export interface ExtractBestPostsRequest {
  date?: string;
}

export interface GenerateScriptRequest {
  raw_data_summary: RawDataSummary;
}