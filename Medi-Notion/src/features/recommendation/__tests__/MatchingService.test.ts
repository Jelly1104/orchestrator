import { MatchingService } from '../services/MatchingService';
import { UserProfile, JobPosting } from '../types';

describe('MatchingService', () => {
  const matchingService = new MatchingService();

  describe('calculateMatchScore', () => {
    it('전문과목 일치 시 40점 추가', () => {
      // Arrange
      const userProfile: UserProfile = { 
        U_ID: 'test_doctor', 
        U_MAJOR_CODE_1: 'SPC103' 
      };
      const jobPosting: JobPosting = { 
        RECRUIT_IDX: 1, 
        TITLE: '테스트 공고',
        MAJOR_CODE: 'SPC103', 
        POST_DATE: new Date(),
        END_DATE: new Date(),
        APPROVAL_FLAG: 'Y',
        DEL_FLAG: 'N'
      };
      
      // Act
      const result = matchingService.calculateMatchScore(userProfile, jobPosting);
      
      // Assert
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: 'major_match', 
            score: 40,
            description: '전문과목 일치'
          })
        ])
      );
    });

    it('근무형태 일치 시 30점 추가', () => {
      // Arrange
      const userProfile: UserProfile = { 
        U_ID: 'test_doctor', 
        U_WORK_TYPE_1: 'EMP' 
      };
      const jobPosting: JobPosting = { 
        RECRUIT_IDX: 1, 
        TITLE: '테스트 공고',
        INVITE_TYPE: 'EMP', 
        POST_DATE: new Date(),
        END_DATE: new Date(),
        APPROVAL_FLAG: 'Y',
        DEL_FLAG: 'N'
      };
      
      // Act
      const result = matchingService.calculateMatchScore(userProfile, jobPosting);
      
      // Assert
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: 'work_type_match', 
            score: 30 
          })
        ])
      );
    });

    it('지역 완전 일치 시 20점 추가', () => {
      // Arrange
      const userProfile: UserProfile = { 
        U_ID: 'test_doctor', 
        U_OFFICE_ZIP: '06234' 
      };
      const jobPosting: JobPosting = { 
        RECRUIT_IDX: 1, 
        TITLE: '테스트 공고',
        WORK_AREA_CODE: '06234', 
        POST_DATE: new Date(),
        END_DATE: new Date(),
        APPROVAL_FLAG: 'Y',
        DEL_FLAG: 'N'
      };
      
      // Act
      const result = matchingService.calculateMatchScore(userProfile, jobPosting);
      
      // Assert
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: 'location_match', 
            score: 20,
            description: '지역 완전일치'
          })
        ])
      );
    });

    it('신규공고(3일 이내) 시 보너스 점수 추가', () => {
      // Arrange
      const userProfile: UserProfile = { U_ID: 'test_doctor' };
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const jobPosting: JobPosting = { 
        RECRUIT_IDX: 1, 
        TITLE: '테스트 공고',
        POST_DATE: threeDaysAgo,
        END_DATE: new Date(),
        APPROVAL_FLAG: 'Y',
        DEL_FLAG: 'N'
      };
      
      // Act
      const result = matchingService.calculateMatchScore(userProfile, jobPosting);
      
      // Assert
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: 'new_post',
            description: '신규공고'
          })
        ])
      );
      expect(result.score).toBeGreaterThan(5); // 기본점수 + 신규보너스
    });

    it('매칭 조건 없을 시 최소 점수 반환', () => {
      // Arrange
      const userProfile: UserProfile = { U_ID: 'test_doctor' };
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      
      const jobPosting: JobPosting = { 
        RECRUIT_IDX: 1, 
        TITLE: '테스트 공고',
        POST_DATE: oldDate,
        END_DATE: new Date(),
        APPROVAL_FLAG: 'Y',
        DEL_FLAG: 'N'
      };
      
      // Act
      const result = matchingService.calculateMatchScore(userProfile, jobPosting);
      
      // Assert
      expect(result.score).toBeLessThan(30);
      expect(result.score).toBeGreaterThan(0); // 기본점수는 있어야 함
    });

    it('복합 매칭 시 점수가 누적됨', () => {
      // Arrange
      const userProfile: UserProfile = { 
        U_ID: 'test_doctor',
        U_MAJOR_CODE_1: 'SPC103',
        U_WORK_TYPE_1: 'EMP',
        U_OFFICE_ZIP: '06234'
      };
      const jobPosting: JobPosting = { 
        RECRUIT_IDX: 1, 
        TITLE: '테스트 공고',
        MAJOR_CODE: 'SPC103',
        INVITE_TYPE: 'EMP',
        WORK_AREA_CODE: '06234',
        POST_DATE: new Date(), // 신규공고
        END_DATE: new Date(),
        APPROVAL_FLAG: 'Y',
        DEL_FLAG: 'N'
      };
      
      // Act
      const result = matchingService.calculateMatchScore(userProfile, jobPosting);
      
      // Assert
      expect(result.score).toBeGreaterThan(90); // 40+30+20+10 = 100점 근처
      expect(result.reasons).toHaveLength(4); // 4가지 이유 모두
    });
  });
});