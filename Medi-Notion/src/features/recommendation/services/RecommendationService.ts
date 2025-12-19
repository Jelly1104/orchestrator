import { RecommendationRepository } from '../repository/RecommendationRepository';
import { MatchingService } from './MatchingService';
import { RecommendedJob, RecommendationSettings, FeedbackRequest, RecommendationLog } from '../types';
import { db } from '../../../lib/database';

export class RecommendationService {
  private repository: RecommendationRepository;
  private matchingService: MatchingService;

  constructor() {
    this.repository = new RecommendationRepository(db);
    this.matchingService = new MatchingService();
  }

  /**
   * 사용자 맞춤 추천 공고 조회
   */
  async getRecommendations(uId: string, limit: number): Promise<RecommendedJob[]> {
    // 1. 사용자 프로필 조회
    const userProfile = await this.repository.getUserProfile(uId);
    if (!userProfile) {
      throw new Error('사용자 프로필 없음');
    }

    // 2. 활성 채용공고 조회
    const jobPostings = await this.repository.getActiveJobPostings(100);

    // 3. 매칭 점수 계산 및 정렬
    const recommendedJobs: RecommendedJob[] = [];
    
    for (const job of jobPostings) {
      const { score, reasons } = this.matchingService.calculateMatchScore(userProfile, job);
      
      // 최소 점수 임계값 (예: 30점 이상)
      if (score >= 30) {
        recommendedJobs.push({
          recruit_idx: job.RECRUIT_IDX,
          title: job.TITLE,
          hospital_name: job.HOSPITAL_NAME,
          match_score: score,
          match_reasons: reasons,
          salary_min: job.SALARY_MIN,
          area_name: job.WORK_AREA_CODE, // 실제로는 CODE_LOC 조인 필요
          post_date: job.POST_DATE
        });

        // 추천 로그 저장
        await this.repository.saveRecommendationLog({
          U_ID: uId,
          RECRUIT_IDX: job.RECRUIT_IDX,
          MATCH_SCORE: score,
          RECOMMENDED_AT: new Date()
        });
      }
    }

    // 매칭 점수 순 정렬 후 제한
    return recommendedJobs
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);
  }

  /**
   * 추천 설정 조회
   */
  async getSettings(uId: string): Promise<RecommendationSettings | null> {
    return await this.repository.getRecommendationSettings(uId);
  }

  /**
   * 추천 설정 업데이트
   */
  async updateSettings(uId: string, settingsData: any): Promise<RecommendationSettings> {
    const settings: RecommendationSettings = {
      U_ID: uId,
      PREFERRED_MAJOR_CODES: settingsData.preferred_major_codes || [],
      PREFERRED_WORK_TYPES: settingsData.preferred_work_types || [],
      PREFERRED_AREAS: settingsData.preferred_areas || [],
      SALARY_MIN: settingsData.salary_min || 0,
      SALARY_MAX: settingsData.salary_max || 999999999,
      NOTIFICATION_ENABLED: settingsData.notification_enabled ? 'Y' : 'N',
      NOTIFICATION_TYPE: settingsData.notification_type || 'push,email'
    };

    await this.repository.saveRecommendationSettings(settings);
    return settings;
  }

  /**
   * 피드백 제출
   */
  async submitFeedback(uId: string, feedback: FeedbackRequest): Promise<void> {
    // 추천 로그 업데이트 (피드백 필드)
    await this.repository.saveRecommendationLog({
      U_ID: uId,
      RECRUIT_IDX: feedback.recruit_idx,
      RECOMMENDED_AT: new Date(),
      FEEDBACK: `${feedback.feedback_type}${feedback.comment ? ':' + feedback.comment : ''}`
    });
  }
}