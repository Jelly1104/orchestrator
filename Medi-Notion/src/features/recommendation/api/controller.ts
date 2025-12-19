import { Request, Response } from 'express';
import { RecommendationService } from '../services/RecommendationService';
import { FeedbackRequest } from '../types';
import { 
  recommendationSettingsSchema, 
  feedbackSchema, 
  recommendationQuerySchema 
} from '../validation/schemas';
import { 
  RecommendationError, 
  UnauthorizedError, 
  ValidationError,
  UserNotFoundError 
} from '../errors/RecommendationError';

export class RecommendationController {
  private recommendationService: RecommendationService;

  constructor() {
    this.recommendationService = new RecommendationService();
  }

  /**
   * 추천 공고 조회
   * GET /api/v1/recommendations/{u_id}
   */
  getRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { u_id } = req.params;
      const authUserId = req.user?.U_ID; // JWT에서 추출한 실제 사용자 ID

      // 입력값 검증
      if (!u_id) {
        res.status(400).json({ error: '사용자 ID가 필요합니다.' });
        return;
      }

      // 본인 확인
      if (authUserId !== u_id) {
        throw new UnauthorizedError();
      }

      // 쿼리 파라미터 검증
      const { error: queryError, value: queryParams } = recommendationQuerySchema.validate(req.query);
      if (queryError) {
        throw new ValidationError(queryError.details[0].message);
      }

      const recommendations = await this.recommendationService.getRecommendations(
        u_id, 
        queryParams.limit
      );
      
      if (recommendations.length === 0) {
        res.status(204).json({ message: '매칭되는 공고가 없습니다.' });
        return;
      }

      res.json({ recommendations });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * 추천 설정 조회
   * GET /api/v1/recommendations/{u_id}/settings
   */
  getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { u_id } = req.params;
      const authUserId = req.user?.U_ID;

      // 본인 확인
      if (authUserId !== u_id) {
        throw new UnauthorizedError();
      }
      
      const settings = await this.recommendationService.getSettings(u_id);
      res.json(settings);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * 추천 설정 업데이트
   * PUT /api/v1/recommendations/{u_id}/settings
   */
  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { u_id } = req.params;
      const authUserId = req.user?.U_ID;

      // 본인 확인
      if (authUserId !== u_id) {
        throw new UnauthorizedError();
      }

      // 입력값 검증
      const { error, value: validatedData } = recommendationSettingsSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const updatedSettings = await this.recommendationService.updateSettings(u_id, validatedData);
      
      res.json({
        success: true,
        updated_settings: updatedSettings
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * 피드백 제출
   * POST /api/v1/recommendations/{u_id}/feedback
   */
  submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { u_id } = req.params;
      const authUserId = req.user?.U_ID;

      // 본인 확인
      if (authUserId !== u_id) {
        throw new UnauthorizedError();
      }

      // 입력값 검증
      const { error, value: validatedData } = feedbackSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      await this.recommendationService.submitFeedback(u_id, validatedData);
      
      res.json({ success: true });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * 에러 처리
   */
  private handleError(error: unknown, res: Response): void {
    console.error('RecommendationController Error:', error);

    if (error instanceof RecommendationError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        code: error.code
      });
      return;
    }

    if (error instanceof Error) {
      // 알려진 에러 패턴 매핑
      if (error.message.includes('사용자 프로필 없음')) {
        res.status(404).json({ 
          error: '사용자 프로필을 찾을 수 없습니다.',
          code: 'USER_NOT_FOUND'
        });
        return;
      }
    }
    
    // 예상치 못한 에러
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}