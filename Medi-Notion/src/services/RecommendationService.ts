import { 
  UserPreferences, 
  JobRecommendation, 
  RecommendationResponse, 
  MatchingCriteria,
  JobPostLegacyDto,
  UserProfileLegacyDto 
} from '../types/recommendation.types';
import { DatabaseService } from './DatabaseService';

export class RecommendationService {
  private db: DatabaseService;
  private matchingCriteria: MatchingCriteria = {
    majorWeight: 0.4,
    experienceWeight: 0.25,
    locationWeight: 0.2,
    salaryWeight: 0.15
  };

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
  }

  async getRecommendationsForUser(userId: string): Promise<RecommendationResponse> {
    // 1. 사용자 프로필 조회
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new Error(`User profile not found: ${userId}`);
    }

    // 2. 활성 채용공고 조회 (인덱스 활용)
    const activeJobs = await this.getActiveJobs();

    // 3. 매칭 점수 계산 및 정렬
    const scoredJobs = this.calculateMatchingScores(userProfile, activeJobs);
    const topRecommendations = scoredJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return {
      recommendations: topRecommendations,
      totalCount: topRecommendations.length,
      lastUpdated: new Date().toISOString(),
      userId
    };
  }

  private async getUserProfile(userId: string): Promise<UserProfileLegacyDto | null> {
    // DOMAIN_SCHEMA.md 준수: 실제 컬럼명 사용
    const query = `
      SELECT u.U_ID, u.U_NAME, u.U_KIND,
             d.U_MAJOR_CODE_1, d.U_MAJOR_CODE_2, d.U_WORK_TYPE_1,
             d.U_OFFICE_ZIP, d.U_CAREER_YEAR
      FROM USERS u
      LEFT JOIN USER_DETAIL d ON u.U_ID = d.U_ID
      WHERE u.U_ID = ? AND u.U_ALIVE = 'Y'
    `;
    
    const result = await this.db.query(query, [userId]);
    return result[0] || null;
  }

  private async getActiveJobs(): Promise<JobPostLegacyDto[]> {
    // 대용량 테이블 조회 시 인덱스 활용 (DOMAIN_SCHEMA 경고사항 준수)
    const query = `
      SELECT REC_IDX, TITLE, COMPANY_NAME, SALARY_MIN, SALARY_MAX,
             MAJOR_CODE, WORK_TYPE_CODE, LOCATION_CODE, EXPERIENCE_MIN,
             END_DATE, APPROVAL_FLAG, DISPLAY_FLAG, DEL_FLAG, REG_DATE
      FROM CBIZ_RECJOB
      WHERE APPROVAL_FLAG = 'Y'
        AND DISPLAY_FLAG = 'Y'
        AND DEL_FLAG = 'N'
        AND END_DATE >= CURDATE()
      ORDER BY REG_DATE DESC
      LIMIT 200
    `;
    
    return await this.db.query(query);
  }

  private calculateMatchingScores(
    userProfile: UserProfileLegacyDto,
    jobs: JobPostLegacyDto[]
  ): JobRecommendation[] {
    return jobs.map(job => {
      const majorScore = this.calculateMajorMatch(
        [userProfile.U_MAJOR_CODE_1, userProfile.U_MAJOR_CODE_2].filter(Boolean),
        job.MAJOR_CODE
      );
      
      const experienceScore = this.calculateExperienceMatch(
        userProfile.U_CAREER_YEAR,
        job.EXPERIENCE_MIN
      );
      
      const locationScore = this.calculateLocationMatch(
        userProfile.U_OFFICE_ZIP,
        job.LOCATION_CODE
      );
      
      const salaryScore = this.calculateSalaryMatch(
        job.SALARY_MIN,
        job.SALARY_MAX
      );

      const totalScore = Math.round(
        majorScore * this.matchingCriteria.majorWeight +
        experienceScore * this.matchingCriteria.experienceWeight +
        locationScore * this.matchingCriteria.locationWeight +
        salaryScore * this.matchingCriteria.salaryWeight
      );

      const matchReasons = this.generateMatchReasons(
        majorScore, experienceScore, locationScore, salaryScore
      );

      return {
        jobId: job.REC_IDX.toString(),
        title: job.TITLE,
        hospital: job.COMPANY_NAME,
        location: job.LOCATION_CODE, // 실제로는 CODE_LOC와 조인 필요
        salary: job.SALARY_MAX,
        matchScore: totalScore,
        matchReasons,
        deadline: job.END_DATE,
        requirements: {
          majorCode: job.MAJOR_CODE,
          experienceYears: job.EXPERIENCE_MIN,
          workType: job.WORK_TYPE_CODE
        }
      };
    });
  }

  private calculateMajorMatch(userMajors: string[], jobMajor: string): number {
    if (userMajors.includes(jobMajor)) return 100; // 정확 일치
    if (this.isRelatedMajor(userMajors, jobMajor)) return 70; // 유사 전공
    return 50; // 전과목 지원 가능
  }

  private calculateExperienceMatch(userExp: number, requiredExp: number): number {
    if (!requiredExp) return 100; // 경력 무관
    const diff = Math.abs(userExp - requiredExp);
    if (diff <= 1) return 100;
    if (diff <= 2) return 80;
    if (diff <= 3) return 60;
    return 30;
  }

  private calculateLocationMatch(userLocation: string, jobLocation: string): number {
    if (!userLocation || !jobLocation) return 50;
    // 간단화: 앞 2자리 지역코드 비교
    const userRegion = userLocation.substring(0, 2);
    const jobRegion = jobLocation.substring(0, 2);
    return userRegion === jobRegion ? 100 : 30;
  }

  private calculateSalaryMatch(salaryMin: number, salaryMax: number): number {
    // 현재는 단순화된 로직, 추후 사용자 희망 연봉과 매칭
    if (salaryMax >= 100000000) return 100; // 1억 이상
    if (salaryMax >= 80000000) return 80;   // 8천만 이상
    if (salaryMax >= 60000000) return 60;   // 6천만 이상
    return 40;
  }

  private isRelatedMajor(userMajors: string[], jobMajor: string): boolean {
    // 간단화된 유사 전공 판단 로직
    const relatedGroups = [
      ['IM', 'FM'], // 내과, 가정의학과
      ['GS', 'OS', 'PS'], // 외과 계열
      ['PED', 'NEO'], // 소아과 계열
    ];

    return relatedGroups.some(group => 
      group.includes(jobMajor) && userMajors.some(major => group.includes(major))
    );
  }

  private generateMatchReasons(
    majorScore: number,
    experienceScore: number, 
    locationScore: number,
    salaryScore: number
  ): string[] {
    const reasons: string[] = [];
    
    if (majorScore >= 90) reasons.push('전공 정확 일치');
    else if (majorScore >= 70) reasons.push('유사 전공');
    
    if (experienceScore >= 90) reasons.push('경력 요구사항 부합');
    if (locationScore >= 90) reasons.push('희망 지역 일치');
    if (salaryScore >= 80) reasons.push('경쟁력 있는 연봉');
    
    return reasons.length > 0 ? reasons : ['기본 조건 충족'];
  }
}