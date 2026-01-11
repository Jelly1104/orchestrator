import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberService } from '../../src/services/member.service';
import { DatabaseService } from '../../src/services/database.service';

vi.mock('../../src/services/database.service');

describe('MemberService', () => {
  let memberService: MemberService;
  let mockDb: vi.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = vi.mocked(new DatabaseService());
    memberService = new MemberService(mockDb);
  });

  describe('getMembers', () => {
    it('페이지네이션과 함께 회원 목록을 반환해야 한다', async () => {
      // Arrange - Legacy 스키마 정확한 컬럼명 사용
      const mockMembers = [
        {
          U_ID: 'doc001',
          U_EMAIL: 'doctor@example.com',
          U_NAME: '김의사',
          U_KIND: 'DOC001',
          U_ALIVE: 'Y',
          U_REG_DATE: new Date('2024-01-01'),
          LAST_LOGIN: new Date('2024-12-15')
        }
      ];
      const mockCount = [{ total: 1 }];

      mockDb.query
        .mockResolvedValueOnce(mockMembers)
        .mockResolvedValueOnce(mockCount);

      // Act
      const result = await memberService.getMembers(1, 10);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        uId: 'doc001',
        email: 'doctor@example.com',
        name: '김의사',
        kind: 'DOC001',
        status: 'active',
        regDate: '2024-01-01T00:00:00.000Z',
        lastLogin: '2024-12-15T00:00:00.000Z'
      });
      expect(result.pagination.total).toBe(1);
    });

    it('검색 조건이 있으면 필터링해야 한다', async () => {
      // Arrange
      const mockMembers = [];
      const mockCount = [{ total: 0 }];
      
      mockDb.query
        .mockResolvedValueOnce(mockMembers)
        .mockResolvedValueOnce(mockCount);

      // Act
      await memberService.getMembers(1, 10, 'test@example.com');

      // Assert - LIKE 검색 쿼리 확인
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE U_EMAIL LIKE ?'),
        expect.arrayContaining(['%test@example.com%'])
      );
    });
  });
});