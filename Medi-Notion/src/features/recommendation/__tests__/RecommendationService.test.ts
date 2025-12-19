import { RecommendationService } from '../services/RecommendationService';
import { RecommendationRepository } from '../repository/RecommendationRepository';
import { MatchingService } from '../services/MatchingService';

// Mock dependencies
jest.mock('../repository/RecommendationRepository');
jest.mock('../services/MatchingService');

describe('RecommendationService', () => {
  let service: RecommendationService;
  let mockRepository: jest.Mocked<RecommendationRepository>;
  let mockMatchingService: jest.Mocked<MatchingService>;

  beforeEach(() => {
    mockRepository = new RecommendationRepository(null) as jest.Mocked<RecommendationRepository>;
    mockMatchingService = new MatchingService() as jest.Mocked<MatchingService>;
    
    service = new RecommendationService();
    (service as any).repository = mockRepository;
    (service as any).matchingService = mockMatchingService;
  });

  describe('getRecommendations', () => {
    it('사용자 프로필이 없으면 에러 발생', async () => {
      // Arrange
      mockRepository.getUserProfile.mockResolvedValue(null);
      
      // Act & Assert
      await expect(service.getRecommendations('invalid_user', 5))
        .rejects.toThrow('사용자 프로필 없음');
    });

    it('매칭 점수 30점 이상인 공고만 반환', async () => {
      // Arrange
      const mockUser = { U_ID: 'test_user', U_NAME: '테스트' };
      const mockJobs = [
        { 
          RECRUIT_IDX: 1, 
          TITLE: '공고1', 
          POST_DATE: new Date(), 
          END_DATE: new Date(),
          APPROVAL_FLAG: 'Y' as const,
          DEL_FLAG: 'N' as const
        },
        { 
          RECRUIT_IDX: 2, 
          TITLE: '공고2', 
          POST_DATE: new Date(), 
          END_DATE: new Date(),
          APPROVAL_FLAG: 'Y' as const,
          DEL_FLAG: 'N' as const
        }
      ];
      
      mockRepository.getUserProfile.mockResolvedValue(mockUser);
      mockRepository.getActiveJobPostings.mockResolvedValue(mockJobs);
      mockRepository.saveRecommendationLog.mockResolvedValue(undefined);
      
      // 첫 번째는 35점(포함), 두 번째는 25점(제외)
      mockMatchingService.calculateMatchScore
        .mockReturnValueOnce({ 
          score: 35, 
          reasons: [{ type: 'major_match', description: '전문과목 일치', score: 35 }] 
        })
        .mockReturnValueOnce({ 
          score: 25, 
          reasons: [{ type: 'new_post', description: '신규공고', score: 25 }] 
        });
      
      // Act
      const result = await service.getRecommendations('test_user', 5);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].recruit_idx).toBe(1);
      expect(result[0].match_score).toBe(35);
    });

    it('매칭 점수 순으로 정렬하여 반환', async () => {
      // Arrange
      const mockUser = { U_ID: 'test_user', U_NAME: '테스트' };
      const mockJobs = [
        { 
          RECRUIT_IDX: 1, 
          TITLE: '공고1', 
          POST_DATE: new Date(), 
          END_DATE: new Date(),
          APPROVAL_FLAG: 'Y' as const,
          DEL_FLAG: 'N' as const
        },
        { 
          RECRUIT_IDX: 2, 
          TITLE: '공고2', 
          POST_DATE: new Date(), 
          END_DATE: new Date(),
          APPROVAL_FLAG: 'Y' as const,
          DEL_FLAG: 'N' as const
        }
      ];
      
      mockRepository.getUserProfile.mockResolvedValue(mockUser);
      mockRepository.getActiveJobPostings.mockResolvedValue(mockJobs);
      mockRepository.saveRecommendationLog.mockResolvedValue(undefined);
      
      // 첫 번째는 40점, 두 번째는 80점 (더 높음)
      mockMatchingService.calculateMatchScore
        .mockReturnValueOnce({ score: 40, reasons: [] })
        .mockReturnValueOnce({ score: 80, reasons: [] });
      
      // Act
      const result = await service.getRecommendations('test_user', 5);
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].recruit_idx).toBe(2); // 80점이 먼저
      expect(result[1].recruit_idx).toBe(1); // 40점이 뒤에
    });
  });

  describe('updateSettings', () => {
    it('설정 데이터를 올바른 형식으로 변환하여 저장', async () => {
      // Arrange
      const inputData = {
        preferred_major_codes: ['IM', 'GS'],
        preferred_work_types: ['EMP'],
        salary_min: 50000000,
        notification_enabled: true
      };
      
      mockRepository.saveRecommendationSettings.mockResolvedValue(undefined);
      
      // Act
      const result = await service.updateSettings('test_user', inputData);
      
      // Assert
      expect(mockRepository.saveRecommendationSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          U_ID: 'test_user',
          PREFERRED_MAJOR_CODES: ['IM', 'GS'],
          PREFERRED_WORK_TYPES: ['EMP'],
          SALARY_MIN: 50000000,
          NOTIFICATION_ENABLED: 'Y'
        })
      );
      expect(result.NOTIFICATION_ENABLED).toBe('Y');
    });
  });
});