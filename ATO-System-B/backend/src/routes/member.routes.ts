import { Router } from 'express';
import { MemberService } from '../services/member.service';
import { DatabaseService } from '../services/database.service';

const router = Router();
const db = new DatabaseService();
const memberService = new MemberService(db);

// GET /api/members
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // 최대 100개 제한
    const search = req.query.search as string;

    const result = await memberService.getMembers(page, limit, search);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Members list error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;