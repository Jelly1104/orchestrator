import mysql from 'mysql2/promise';
import { BestPostData } from '../types';

export class BestPostsExtractor {
  private connection: mysql.Connection;

  constructor(connection: mysql.Connection) {
    this.connection = connection;
  }

  async extractBestPosts(date?: string): Promise<BestPostData[]> {
    // 기본값: 어제 날짜
    const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // DOMAIN_SCHEMA.md 준수: 실제 컬럼명 사용, 인덱스 활용
    const query = `
      SELECT 
        b.BOARD_IDX,
        b.TITLE,
        b.CONTENT,
        b.read_CNT,
        b.AGREE_CNT,
        b.REG_DATE,
        COALESCE(c.comment_count, 0) as comment_count,
        (b.read_CNT + b.AGREE_CNT * 3 + COALESCE(c.comment_count, 0) * 2) as engagement_score
      FROM BOARD_MUZZIMA b
      LEFT JOIN (
        SELECT BOARD_IDX, COUNT(*) as comment_count
        FROM COMMENT 
        WHERE SVC_CODE = 'MUZZIMA'
          AND REG_DATE >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY BOARD_IDX
      ) c ON b.BOARD_IDX = c.BOARD_IDX
      WHERE b.REG_DATE >= ?
        AND b.REG_DATE < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY engagement_score DESC
      LIMIT 5
    `;

    try {
      const [rows] = await this.connection.execute(query, [targetDate, targetDate]);
      return rows as BestPostData[];
    } catch (error) {
      console.error('Failed to extract best posts:', error);
      throw new Error('Database query failed');
    }
  }

  // SQL 쿼리 파일 생성용
  generateSqlQuery(date?: string): string {
    const targetDate = date || '$(DATE_SUB(NOW(), INTERVAL 1 DAY))';
    
    return `-- best_posts_query.sql
-- 일간 베스트 게시물 추출 쿼리 (DOMAIN_SCHEMA.md 준수)
-- 대용량 테이블 안전 조회: COMMENT 테이블 서브쿼리로 범위 제한

SELECT 
    b.BOARD_IDX,          -- 게시글 ID
    b.CTG_CODE,           -- 카테고리 코드 (NOT SVC_CODE)
    b.TITLE,              -- 제목
    b.CONTENT,            -- 내용 (MEDIUMTEXT)
    b.read_CNT,           -- 조회수 (소문자 주의)
    b.AGREE_CNT,          -- 추천수
    b.REG_DATE,           -- 등록일시
    COALESCE(c.comment_count, 0) as comment_count,
    (b.read_CNT + b.AGREE_CNT * 3 + COALESCE(c.comment_count, 0) * 2) as engagement_score
FROM BOARD_MUZZIMA b
LEFT JOIN (
    SELECT BOARD_IDX, COUNT(*) as comment_count
    FROM COMMENT 
    WHERE SVC_CODE = 'MUZZIMA'  -- 게시판 구분 필수
      AND REG_DATE >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY BOARD_IDX
) c ON b.BOARD_IDX = c.BOARD_IDX
WHERE b.REG_DATE >= DATE_SUB(NOW(), INTERVAL 24 HOUR)  -- 필수 조건
ORDER BY engagement_score DESC                         -- 가중치 적용
LIMIT 5;  -- 상위 5건만
`;
  }
}