import { UserProfile, JobPosting, RecommendationSettings, RecommendationLog } from '../types';

export class RecommendationRepository {
  private db: any; // MySQL connection

  constructor(db: any) {
    this.db = db;
  }

  /**
   * 사용자 프로필 조회 (DOMAIN_SCHEMA.md 실제 컬럼명 사용)
   */
  async getUserProfile(uId: string): Promise<UserProfile | null> {
    const query = `
      SELECT 
        u.U_ID,
        u.U_NAME,
        ud.U_MAJOR_CODE_1,
        ud.U_WORK_TYPE_1,
        ud.U_OFFICE_ZIP
      FROM USERS u
      LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
      WHERE u.U_ID = ? AND u.U_ALIVE = 'Y'
    `;
    
    const [rows] = await this.db.query(query, [uId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 활성 채용공고 조회 (인덱스 활용, 대용량 테이블 최적화)
   */
  async getActiveJobPostings(limit: number = 100): Promise<JobPosting[]> {
    const query = `
      SELECT 
        RECRUIT_IDX,
        TITLE,
        HOSPITAL_NAME,
        MAJOR_CODE,
        INVITE_TYPE,
        WORK_AREA_CODE,
        SALARY_MIN,
        SALARY_MAX,
        REG_DATE as POST_DATE,
        END_DATE,
        APPROVAL_FLAG,
        DEL_FLAG
      FROM CBIZ_RECJOB
      WHERE APPROVAL_FLAG = 'Y'
        AND END_DATE >= NOW()
        AND DEL_FLAG = 'N'
      ORDER BY REG_DATE DESC
      LIMIT ?
    `;
    
    const [rows] = await this.db.query(query, [limit]);
    return rows;
  }

  /**
   * 추천 로그 저장
   */
  async saveRecommendationLog(log: RecommendationLog): Promise<void> {
    const query = `
      INSERT INTO RECOMMENDATION_LOG 
      (U_ID, RECRUIT_IDX, MATCH_SCORE, RECOMMENDED_AT, FEEDBACK)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await this.db.query(query, [
      log.U_ID,
      log.RECRUIT_IDX,
      log.MATCH_SCORE,
      log.RECOMMENDED_AT,
      log.FEEDBACK
    ]);
  }

  /**
   * 추천 설정 조회
   */
  async getRecommendationSettings(uId: string): Promise<RecommendationSettings | null> {
    const query = `
      SELECT 
        U_ID,
        PREFERRED_MAJOR_CODES,
        PREFERRED_WORK_TYPES,
        PREFERRED_AREAS,
        SALARY_MIN,
        SALARY_MAX,
        NOTIFICATION_ENABLED,
        NOTIFICATION_TYPE
      FROM RECOMMENDATION_SETTINGS
      WHERE U_ID = ?
    `;
    
    const [rows] = await this.db.query(query, [uId]);
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      PREFERRED_MAJOR_CODES: JSON.parse(row.PREFERRED_MAJOR_CODES || '[]'),
      PREFERRED_WORK_TYPES: JSON.parse(row.PREFERRED_WORK_TYPES || '[]'),
      PREFERRED_AREAS: JSON.parse(row.PREFERRED_AREAS || '[]')
    };
  }

  /**
   * 추천 설정 저장/업데이트
   */
  async saveRecommendationSettings(settings: RecommendationSettings): Promise<void> {
    const query = `
      INSERT INTO RECOMMENDATION_SETTINGS 
      (U_ID, PREFERRED_MAJOR_CODES, PREFERRED_WORK_TYPES, PREFERRED_AREAS, 
       SALARY_MIN, SALARY_MAX, NOTIFICATION_ENABLED, NOTIFICATION_TYPE, UPDATED_AT)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        PREFERRED_MAJOR_CODES = VALUES(PREFERRED_MAJOR_CODES),
        PREFERRED_WORK_TYPES = VALUES(PREFERRED_WORK_TYPES),
        PREFERRED_AREAS = VALUES(PREFERRED_AREAS),
        SALARY_MIN = VALUES(SALARY_MIN),
        SALARY_MAX = VALUES(SALARY_MAX),
        NOTIFICATION_ENABLED = VALUES(NOTIFICATION_ENABLED),
        NOTIFICATION_TYPE = VALUES(NOTIFICATION_TYPE),
        UPDATED_AT = NOW()
    `;
    
    await this.db.query(query, [
      settings.U_ID,
      JSON.stringify(settings.PREFERRED_MAJOR_CODES),
      JSON.stringify(settings.PREFERRED_WORK_TYPES),
      JSON.stringify(settings.PREFERRED_AREAS),
      settings.SALARY_MIN,
      settings.SALARY_MAX,
      settings.NOTIFICATION_ENABLED,
      settings.NOTIFICATION_TYPE
    ]);
  }
}