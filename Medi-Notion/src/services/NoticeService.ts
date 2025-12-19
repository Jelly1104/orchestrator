import { NoticeLegacyDto, UserProfileDto, NoticeWithScore, RelevanceCalculatorInput } from '../types/notice.types';

/**
 * 공지사항 개인화 추천 서비스
 * DOMAIN_SCHEMA.md의 Legacy DB 구조를 준수합니다.
 */
export class NoticeService {
  
  /**
   * 개인화 관련성 점수 계산
   * @param input 공지사항과 사용자 프로필
   * @returns 0-1 사이의 관련성 점수
   */
  static calculateRelevanceScore({ notice, userProfile }: RelevanceCalculatorInput): number {
    let score = 0.5; // 기본 점수
    const matchReasons: string[] = [];

    try {
      // TARGET_MAJOR JSON 파싱 (안전한 파싱)
      const targetMajors = notice.TARGET_MAJOR ? 
        JSON.parse(notice.TARGET_MAJOR) : [];
      
      // TARGET_WORK JSON 파싱  
      const targetWorkTypes = notice.TARGET_WORK ? 
        JSON.parse(notice.TARGET_WORK) : [];

      // 전문과목 매칭 (가중치: 0.3)
      if (Array.isArray(targetMajors) && 
          targetMajors.includes(userProfile.U_MAJOR_CODE_1)) {
        score += 0.3;
        matchReasons.push('전문과목 일치');
      }

      // 근무형태 매칭 (가중치: 0.2)
      if (Array.isArray(targetWorkTypes) && 
          targetWorkTypes.includes(userProfile.U_WORK_TYPE_1)) {
        score += 0.2;
        matchReasons.push('근무형태 일치');
      }

      // 중요도 반영 (가중치: 0.1 * importance/5)
      if (notice.IMPORTANCE >= 1 && notice.IMPORTANCE <= 5) {
        const importanceScore = (notice.IMPORTANCE / 5) * 0.1;
        score += importanceScore;
        
        if (notice.IMPORTANCE >= 4) {
          matchReasons.push('중요 공지');
        }
      }

    } catch (error) {
      console.warn('JSON 파싱 오류:', error);
      // 파싱 실패 시 기본 점수 유지
    }

    return Math.min(score, 1.0);
  }

  /**
   * 공지사항 목록을 사용자별 관련성 순으로 정렬
   * @param notices 원본 공지사항 목록
   * @param userProfile 사용자 프로필
   * @returns 개인화된 공지사항 목록
   */
  static personalizeNotices(
    notices: NoticeLegacyDto[], 
    userProfile: UserProfileDto
  ): NoticeWithScore[] {
    
    return notices
      .map(notice => {
        const relevanceScore = this.calculateRelevanceScore({ 
          notice, 
          userProfile 
        });
        
        const matchReasons = this.getMatchReasons(notice, userProfile);

        return {
          BOARD_IDX: notice.BOARD_IDX,
          TITLE: notice.TITLE,
          CONTENT: notice.CONTENT,
          IMPORTANCE: notice.IMPORTANCE,
          REG_DATE: notice.REG_DATE,
          RELEVANCE_SCORE: relevanceScore,
          MATCH_REASONS: matchReasons
        };
      })
      .sort((a, b) => b.RELEVANCE_SCORE - a.RELEVANCE_SCORE); // 높은 점수 순 정렬
  }

  /**
   * 매칭된 이유 목록 생성
   * @private
   */
  private static getMatchReasons(
    notice: NoticeLegacyDto, 
    userProfile: UserProfileDto
  ): string[] {
    const reasons: string[] = [];

    try {
      const targetMajors = JSON.parse(notice.TARGET_MAJOR || '[]');
      const targetWorkTypes = JSON.parse(notice.TARGET_WORK || '[]');

      if (targetMajors.includes(userProfile.U_MAJOR_CODE_1)) {
        reasons.push('전문과목 일치');
      }

      if (targetWorkTypes.includes(userProfile.U_WORK_TYPE_1)) {
        reasons.push('근무형태 일치');
      }

      if (notice.IMPORTANCE >= 4) {
        reasons.push('중요 공지');
      }

      if (userProfile.U_CAREER_YEAR >= 10 && notice.TITLE.includes('시니어')) {
        reasons.push('경력 매칭');
      }

    } catch (error) {
      console.warn('매칭 이유 분석 중 오류:', error);
    }

    return reasons.length > 0 ? reasons : ['일반 공지'];
  }

  /**
   * 페이징 정보 계산
   * @param total 전체 아이템 수
   * @param page 현재 페이지 (1부터 시작)
   * @param limit 페이지당 아이템 수
   */
  static calculatePagination(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      total,
      page: Math.max(1, page),
      limit: Math.min(100, limit), // 최대 100개 제한
      totalPages: Math.max(1, totalPages)
    };
  }
}