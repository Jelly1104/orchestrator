import { DatabaseService } from './database.service';
import { DashboardStats } from '../types/api.types';

export class DashboardService {
  constructor(private db: DatabaseService) {}

  async getStats(): Promise<DashboardStats> {
    try {
      // 회원 통계 - U_ALIVE: UST001(활성), UST000(탈퇴), UST002(휴면), UST003(정지)
      const [userStats] = await this.db.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(CASE WHEN U_ALIVE = 'UST001' THEN 1 END) as active_users
        FROM USERS
      `);

      // 게시글 통계 - 대용량 테이블 조회 시 날짜 제한
      const [postStats] = await this.db.query(`
        SELECT 
          COUNT(*) as total_posts,
          COUNT(CASE WHEN DATE(REG_DATE) = CURDATE() THEN 1 END) as today_posts
        FROM BOARD_MUZZIMA
        WHERE REG_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // 댓글 통계 - 인덱스 활용을 위한 날짜 제한
      const [commentStats] = await this.db.query(`
        SELECT 
          COUNT(*) as total_comments,
          COUNT(CASE WHEN DATE(REG_DATE) = CURDATE() THEN 1 END) as today_comments
        FROM COMMENT
        WHERE REG_DATE >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      return {
        totalUsers: userStats.total_users || 0,
        activeUsers: userStats.active_users || 0,
        totalPosts: postStats.total_posts || 0,
        todayPosts: postStats.today_posts || 0,
        totalComments: commentStats.total_comments || 0,
        todayComments: commentStats.today_comments || 0
      };
    } catch (error) {
      throw error;
    }
  }
}