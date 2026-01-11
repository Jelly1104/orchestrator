import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '../../src/services/dashboard.service';
import { DatabaseService } from '../../src/services/database.service';

// Mock DatabaseService
vi.mock('../../src/services/database.service');

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockDb: vi.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = vi.mocked(new DatabaseService());
    dashboardService = new DashboardService(mockDb);
  });

  describe('getStats', () => {
    it('통계 데이터를 올바르게 반환해야 한다', async () => {
      // Arrange - Legacy 스키마 준수한 Mock 데이터
      const mockStats = [
        { total_users: 20000, active_users: 15000 }
      ];
      const mockPosts = [
        { total_posts: 337000, today_posts: 150 }
      ];
      const mockComments = [
        { total_comments: 1826000, today_comments: 89 }
      ];

      mockDb.query
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockPosts)
        .mockResolvedValueOnce(mockComments);

      // Act
      const result = await dashboardService.getStats();

      // Assert
      expect(result).toEqual({
        totalUsers: 20000,
        activeUsers: 15000,
        totalPosts: 337000,
        todayPosts: 150,
        totalComments: 1826000,
        todayComments: 89
      });

      // 올바른 쿼리가 실행되었는지 검증
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM USERS WHERE U_ALIVE = ?'),
        ['Y']
      );
    });

    it('DB 오류 시 에러를 던져야 한다', async () => {
      // Arrange
      mockDb.query.mockRejectedValueOnce(new Error('DB Connection Failed'));

      // Act & Assert
      await expect(dashboardService.getStats()).rejects.toThrow('DB Connection Failed');
    });
  });
});