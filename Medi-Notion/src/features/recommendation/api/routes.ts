import { Router } from 'express';
import { RecommendationController } from './controller';

const router = Router();
const controller = new RecommendationController();

// 추천 공고 조회
router.get('/:u_id', controller.getRecommendations);

// 추천 설정 관리
router.get('/:u_id/settings', controller.getSettings);
router.put('/:u_id/settings', controller.updateSettings);

// 피드백 수집
router.post('/:u_id/feedback', controller.submitFeedback);

export default router;