import { RowDataPacket } from 'mysql2';
import { DatabasePool } from '../config/database';
import { BestPost, BoardMuzzimaRow, ExtractionMetadata } from '../types/podcast.types';
import { PIIProcessor } from './PIIProcessor';

interface BoardRowWithScore extends BoardMuzzimaRow, RowDataPacket {
  comment_cnt: number;
  score: number;
}

export class DailyBestExtractor {
  private dbPool: DatabasePool;
  private piiProcessor: PIIProcessor;

  // 베스트 게시물 선정 기준 상수
  private static readonly MIN_TITLE_LENGTH = 5;
  private static readonly MIN_CONTENT_LENGTH = 50;
  private static readonly MAX_CANDIDATES = 10;
  private static readonly FINAL_SELECTION_COUNT = 5;
  
  // 점수 가중치
  private static readonly READ_COUNT_WEIGHT = 0.7;
  private static readonly COMMENT_COUNT_WEIGHT = 0.3;

  constructor(dbPool: DatabasePool) {
    this.dbPool = dbPool;
    this.piiProcessor = new PIIProcessor();
  }

  async extractBestPosts(targetDate: Date): Promise<{
    posts: BestPost[];
    metadata: ExtractionMetadata;
  }> {
    const startTime = new Date();
    
    if (!targetDate || isNaN(targetDate.getTime())) {
      throw new Error('유효하지 않은 날짜입니다');
    }

    const { dateStart, dateEnd } = this.getDateRange(targetDate);

    try {
      console.log(`[DailyBestExtractor] 베스트 게시물 추출 시작: ${targetDate.toISOString().split('T')[0]}`);
      
      const rows = await this.fetchCandidatePosts(dateStart, dateEnd);
      console.log(`[DailyBestExtractor] 후보 게시물 ${rows.length}건 발견`);
      
      const posts = await this.processSelectedPosts(rows);
      
      const endTime = new Date();
      const processingTime = `${(endTime.getTime() - startTime.getTime()) / 1000}초`;

      console.log(`[DailyBestExtractor] 추출 완료: ${posts.length}건 선택 (${processingTime})`);

      return {
        posts,
        metadata: {
          total_candidates: rows.length,
          selected_count: posts.length,
          processing_time: processingTime
        }
      };

    } catch (error) {
      console.error('[DailyBestExtractor] 베스트 게시물 추출 실패:', error);
      throw new Error(`데이터 추출 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  private getDateRange(targetDate: Date): { dateStart: Date; dateEnd: Date } {
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    return { dateStart, dateEnd };
  }

  private async fetchCandidatePosts(dateStart: Date, dateEnd: Date): Promise<BoardRowWithScore[]> {
    // 대용량 테이블 최적화 쿼리 (DOMAIN_SCHEMA 준수)
    // REG_DATE 인덱스 활용을 위한 범위 조건 우선 배치
    const query = `
      SELECT 
        bm.BOARD_IDX,
        bm.CTG_CODE,
        bm.U_ID,
        bm.TITLE,
        bm.CONTENT,
        bm.READ_CNT,
        bm.AGREE_CNT,
        bm.REG_DATE,
        COALESCE((
          SELECT COUNT(*) 
          FROM COMMENT c 
          WHERE c.BOARD_IDX = bm.BOARD_IDX 
            AND c.SVC_CODE = 'MUZZIMA'
            AND c.REG_DATE >= ?
        ), 0) as comment_cnt,
        (bm.READ_CNT * ? + COALESCE((
          SELECT COUNT(*) 
          FROM COMMENT c 
          WHERE c.BOARD_IDX = bm.BOARD_IDX 
            AND c.SVC_CODE = 'MUZZIMA'
        ), 0) * ?) as score
      FROM BOARD_MUZZIMA bm
      WHERE bm.REG_DATE >= ?
        AND bm.REG_DATE < ?
        AND bm.CTG_CODE IN ('001', '002', '003', '004', '005')
        AND CHAR_LENGTH(bm.TITLE) > ?
        AND CHAR_LENGTH(bm.CONTENT) > ?
      ORDER BY score DESC
      LIMIT ?
    `;

    const queryParams = [
      dateStart,
      DailyBestExtractor.READ_COUNT_WEIGHT,
      DailyBestExtractor.COMMENT_COUNT_WEIGHT,
      dateStart,
      dateEnd,
      DailyBestExtractor.MIN_TITLE_LENGTH,
      DailyBestExtractor.MIN_CONTENT_LENGTH,
      DailyBestExtractor.MAX_CANDIDATES
    ];

    const [rows] = await this.dbPool.execute<BoardRowWithScore[]>(query, queryParams);
    return rows;
  }

  private async processSelectedPosts(rows: BoardRowWithScore[]): Promise<BestPost[]> {
    const posts: BestPost[] = [];
    const selectedRows = rows.slice(0, DailyBestExtractor.FINAL_SELECTION_COUNT);

    for (const row of selectedRows) {
      try {
        // PII 전처리
        const processedContent = await this.piiProcessor.maskSensitiveData(row.CONTENT);
        const piiDetected = this.piiProcessor.detectPIITypes(row.CONTENT);

        posts.push({
          board_idx: row.BOARD_IDX,
          title: row.TITLE,
          content_preview: this.generateContentPreview(processedContent),
          read_cnt: row.READ_CNT,
          comment_cnt: row.comment_cnt,
          score: Math.round(row.score * 100) / 100,
          category: this.getCategoryName(row.CTG_CODE),
          pii_detected: piiDetected
        });

        console.log(`[DailyBestExtractor] 게시물 처리 완료: ${row.BOARD_IDX} (PII: ${piiDetected.join(', ') || '없음'})`);
      } catch (piiError) {
        console.error(`[DailyBestExtractor] PII 처리 실패 (BOARD_IDX: ${row.BOARD_IDX}):`, piiError);
        // PII 처리 실패 시 해당 게시물은 제외
        continue;
      }
    }

    return posts;
  }

  private generateContentPreview(content: string): string {
    const PREVIEW_LENGTH = 200;
    
    if (!content || content.length <= PREVIEW_LENGTH) {
      return content;
    }
    
    // 문장 단위로 자르기 시도
    const truncated = content.substring(0, PREVIEW_LENGTH);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > PREVIEW_LENGTH * 0.7) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }
    
    return truncated + '...';
  }

  private getCategoryName(ctgCode: string): string {
    const categories: Record<string, string> = {
      '001': '임상경험',
      '002': '의료정책',
      '003': '진료이야기',
      '004': '의료기기',
      '005': '연구논문'
    };
    return categories[ctgCode] || '기타';
  }
}