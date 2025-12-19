import { DatabaseService } from './database.service';
import { MemberListItem, ApiResponse } from '../types/api.types';
import { UserLegacyDto } from '../types/legacy.types';

export class MemberService {
  constructor(private db: DatabaseService) {}

  async getMembers(
    page: number = 1, 
    limit: number = 10, 
    search?: string
  ): Promise<ApiResponse<MemberListItem[]>> {
    const offset = (page - 1) * limit;
    
    try {
      // 검색 조건 구성
      let whereClause = 'WHERE U_ALIVE = ?';
      let params: any[] = ['Y'];
      
      if (search) {
        whereClause += ' AND (U_EMAIL LIKE ? OR U_NAME LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // 회원 목록 조회 - Legacy 스키마 정확한 컬럼명 사용
      const members = await this.db.query<UserLegacyDto & { LAST_LOGIN?: Date }>(`
        SELECT 
          u.U_ID,
          u.U_EMAIL,
          u.U_NAME,
          u.U_KIND,
          u.U_ALIVE,
          u.U_REG_DATE,
          MAX(ul.LOGIN_DATE) as LAST_LOGIN
        FROM USERS u
        LEFT JOIN USER_LOGIN ul ON u.U_ID = ul.U_ID 
          AND ul.LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ${whereClause}
        GROUP BY u.U_ID
        ORDER BY u.U_REG_DATE DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      // 총 개수 조회
      const [countResult] = await this.db.query<{ total: number }>(`
        SELECT COUNT(*) as total
        FROM USERS u
        ${whereClause}
      `, params);

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      // Legacy DTO를 API 응답 형식으로 변환
      const data: MemberListItem[] = members.map(member => ({
        uId: member.U_ID,
        email: member.U_EMAIL,
        name: member.U_NAME,
        kind: member.U_KIND,
        status: member.U_ALIVE === 'Y' ? 'active' : 'inactive',
        regDate: member.U_REG_DATE.toISOString(),
        lastLogin: member.LAST_LOGIN?.toISOString()
      }));

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}