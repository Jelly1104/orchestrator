import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DailyBestExtractor } from '../DailyBestExtractor';

// Mock DatabasePool
const mockDbPool = {
  execute: vi.fn()
};

describe('DailyBestExtractor', () => {
  let extractor: DailyBestExtractor;

  beforeEach(() => {
    extractor = new DailyBestExtractor(mockDbPool as any);
    vi.clearAllMocks();
  });

  describe('extractBestPosts', () => {
    it('베스트 게시물 5건을 정확히 추출해야 한다', async () => {
      const mockRows = [
        {
          BOARD_IDX: 123456,
          CTG_CODE: '001',
          U_ID: 'doc123',
          TITLE: '응급실에서 만난 특별한 환자',
          CONTENT: '어제 야간 근무 중 흥미로운 케이스를 만났습니다...',
          READ_CNT: 1250,
          AGREE_CNT: 45,
          REG_DATE: new Date('2024-01-15'),
          comment_cnt: 45,
          score: 95
        },
        {
          BOARD_IDX: 123457,
          CTG_CODE: '002',
          U_ID: 'doc456',
          TITLE: '수술실에서의 경험',
          CONTENT: '복잡한 수술을 성공적으로 마쳤습니다...',
          READ_CNT: 980,
          AGREE_CNT: 38,
          REG_DATE: new Date('2024-01-15'),
          comment_cnt: 38,
          score: 87
        }
      ];

      mockDbPool.execute.mockResolvedValue([mockRows]);

      const targetDate = new Date('2024-01-15');
      const result = await extractor.extractBestPosts(targetDate);

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0].board_idx).toBe(123456);
      expect(result.posts[0].title).toBe('응급실에서 만난 특별한 환자');
      expect(result.posts[0].score).toBe(95);
      
      expect(result.metadata.total_candidates).toBe(2);
      expect(result.metadata.selected_count).toBe(2);
      expect(result.metadata.processing_time).toMatch(/\d+\.?\d*초/);
    });

    it('데이터베이스 오류 시 적절한 에러를 던져야 한다', async () => {
      mockDbPool.execute.mockRejectedValue(new Error('DB connection failed'));

      const targetDate = new Date('2024-01-15');

      await expect(extractor.extractBestPosts(targetDate))
        .rejects
        .toThrow('데이터 추출 중 오류가 발생했습니다');
    });

    it('DOMAIN_SCHEMA 준수: 올바른 컬럼명을 사용해야 한다', async () => {
      mockDbPool.execute.mockResolvedValue([[]]);

      const targetDate = new Date('2024-01-15');
      await extractor.extractBestPosts(targetDate);

      const executedQuery = mockDbPool.execute.mock.calls[0][0];
      
      // DOMAIN_SCHEMA.md의 실제 컬럼명 확인
      expect(executedQuery).toContain('BOARD_IDX');
      expect(executedQuery).toContain('CTG_CODE');
      expect(executedQuery).toContain('U_ID');
      expect(executedQuery).toContain('READ_CNT');
      expect(executedQuery).toContain('REG_DATE');
      
      // 대용량 테이블 제약 확인
      expect(executedQuery).toContain('LIMIT 10');
      expect(executedQuery).toContain('REG_DATE >=');
    });
  });
});