import { Router } from 'express';
import { RecommendationController } from '../controllers/RecommendationController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const recommendationController = new RecommendationController();

// 모든 추천 관련 API는 인증 필요
router.use(authMiddleware);

// 개인화 추천 목록 조회
router.get('/jobs', recommendationController.getRecommendations.bind(recommendationController));

// 사용자 추천 선호도 업데이트  
router.put('/preferences', recommendationController.updatePreferences.bind(recommendationController));

export default router;