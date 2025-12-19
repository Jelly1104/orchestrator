import { UserProfile, JobPosting, RecommendedJob, MatchReason } from '../types';

export class MatchingService {
  /**
   * 매칭 점수 계산 (SDD.md 알고리즘 준수)
   */
  public calculateMatchScore(userProfile: UserProfile, jobPosting: JobPosting): {
    score: number;
    reasons: MatchReason[];
  } {
    let score = 0;
    const reasons: MatchReason[] = [];

    // 1. 전문과목 매칭 (40점)
    if (jobPosting.MAJOR_CODE && userProfile.U_MAJOR_CODE_1 === jobPosting.MAJOR_CODE) {
      score += 40;
      reasons.push({
        type: 'major_match',
        description: '전문과목 일치',
        score: 40
      });
    }

    // 2. 근무형태 매칭 (30점)
    if (jobPosting.INVITE_TYPE && userProfile.U_WORK_TYPE_1 === jobPosting.INVITE_TYPE) {
      score += 30;
      reasons.push({
        type: 'work_type_match', 
        description: '근무형태 일치',
        score: 30
      });
    }

    // 3. 지역 근접성 (20점)
    const locationScore = this.calculateLocationProximity(
      userProfile.U_OFFICE_ZIP,
      jobPosting.WORK_AREA_CODE
    );
    score += locationScore;
    if (locationScore >= 15) {
      reasons.push({
        type: 'location_match',
        description: locationScore === 20 ? '지역 완전일치' : '지역 선호',
        score: locationScore
      });
    }

    // 4. 신규공고 보너스 (10점)
    const daysSincePost = this.getDaysSincePost(jobPosting.POST_DATE);
    if (daysSincePost <= 7) {
      const newPostScore = Math.max(0, 10 - daysSincePost);
      score += newPostScore;
      reasons.push({
        type: 'new_post',
        description: '신규공고',
        score: newPostScore
      });
    }

    return { score, reasons };
  }

  /**
   * 지역 근접성 계산 (SDD.md 명세 준수)
   */
  private calculateLocationProximity(userZip?: string, jobAreaCode?: string): number {
    if (!userZip || !jobAreaCode) return 5; // 기본점수

    // 간단한 우편번호 기반 근접성 계산 (실제로는 CODE_LOC 테이블 조인 필요)
    const userPrefix = userZip.substring(0, 2);
    const jobPrefix = jobAreaCode.substring(0, 2);

    if (userZip === jobAreaCode) return 20; // 동일 구/시
    if (userPrefix === jobPrefix) return 15; // 동일 시/도, 인접 구
    return 10; // 동일 시/도
  }

  private getDaysSincePost(postDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - postDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}