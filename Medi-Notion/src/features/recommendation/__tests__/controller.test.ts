import { Request, Response } from 'express';
import { RecommendationController } from '../api/controller';
import { RecommendationService } from '../services/RecommendationService';

// Mock RecommendationService
jest.mock('../services/RecommendationService');

describe('RecommendationController', () => {
  let controller: RecommendationController;
  let mockService: jest.Mocked<RecommendationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = new RecommendationService() as jest.Mocked<RecommendationService>;
    controller = new RecommendationController();
    (controller as any).recommendationService = mockService;

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { U_ID: 'auth_user' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getRecommendations', () => {
    it('사용자 ID가 없으면 400 에러', async () => {
      // Arrange
      mockRequest.params = {};
      
      // Act
      await controller.getRecommendations(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: '사용자 ID가 필요합니다.' 
      });
    });

    it('권한이 없으면 403 에러', async () => {
      // Arrange
      mockRequest.params = { u_id: 'other_user' };
      mockRequest.user = { U_ID: 'auth_user' };
      
      // Act
      await controller.getRecommendations(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: '권한이 없습니다.' 
      });
    });

    it('매칭되는 공고가 없으면 204 응답', async () => {
      // Arrange
      mockRequest.params = { u_id: 'auth_user' };
      mockRequest.user = { U_ID: 'auth_user' };
      mockService.getRecommendations.mockResolvedValue([]);
      
      // Act
      await controller.getRecommendations(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: '매칭되는 공고가 없습니다.' 
      });
    });

    it('성공 시 추천 공고 반환', async () => {
      // Arrange
      mockRequest.params = { u_id: 'auth_user' };
      mockRequest.user = { U_ID: 'auth_user' };
      const mockRecommendations = [
        { 
          recruit_idx: 1, 
          title: '테스트 공고', 
          match_score: 85,
          match_reasons: [],
          post_date: new Date()
        }
      ];
      mockService.getRecommendations.mockResolvedValue(mockRecommendations);
      
      // Act
      await controller.getRecommendations(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        recommendations: mockRecommendations 
      });
    });
  });

  describe('updateSettings', () => {
    it('잘못된 입력값 형식 시 400 에러', async () => {
      // Arrange
      mockRequest.params = { u_id: 'auth_user' };
      mockRequest.user = { U_ID: 'auth_user' };
      mockRequest.body = {
        preferred_major_codes: 'not_array' // 잘못된 형식
      };
      
      // Act
      await controller.updateSettings(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: '전문과목은 배열 형태여야 합니다.' 
      });
    });
  });

  describe('submitFeedback', () => {
    it('필수 필드 누락 시 400 에러', async () => {
      // Arrange
      mockRequest.params = { u_id: 'auth_user' };
      mockRequest.user = { U_ID: 'auth_user' };
      mockRequest.body = {
        // recruit_idx 누락
        feedback_type: 'helpful'
      };
      
      // Act
      await controller.submitFeedback(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: '필수 필드가 누락되었습니다.' 
      });
    });

    it('유효하지 않은 피드백 타입 시 400 에러', async () => {
      // Arrange
      mockRequest.params = { u_id: 'auth_user' };
      mockRequest.user = { U_ID: 'auth_user' };
      mockRequest.body = {
        recruit_idx: 1,
        feedback_type: 'invalid_type'
      };
      
      // Act
      await controller.submitFeedback(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        error: '유효하지 않은 피드백 타입입니다.' 
      });
    });
  });
});