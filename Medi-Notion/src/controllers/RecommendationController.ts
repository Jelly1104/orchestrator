import { Request, Response } from 'express';
import { RecommendationService } from '../services/RecommendationService';
import { DatabaseService } from '../services/DatabaseService';

export class RecommendationController {
  private recommendationService: RecommendationService;

  constructor() {
    const dbService = new DatabaseService();
    this.recommendationService = new RecommendationService(dbService);
  }

  async getRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user?.U_ID; // JWT에서 추출
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const recommendations = await this.recommendationService.getRecommendationsForUser(userId);
      
      res.json({
        success: true,
        data: recommendations,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Recommendation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updatePreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.U_ID;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { majorCodes, workTypes, preferredRegions, salaryMin, salaryMax } = req.body;

      // 입력 검증
      if (!majorCodes || !Array.isArray(majorCodes)) {
        return res.status(400).json({ error: 'Invalid majorCodes' });
      }

      // 사용자 선호도 업데이트 로직
      // 실제로는 USER_PREFERENCE 테이블에 저장
      const preferences = {
        U_ID: userId,
        majorCodes,
        workTypes: workTypes || [],
        preferredRegions: preferredRegions || [],
        salaryMin: salaryMin || 0,
        salaryMax: salaryMax || 999999999,
        updatedAt: new Date()
      };

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: preferences
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}