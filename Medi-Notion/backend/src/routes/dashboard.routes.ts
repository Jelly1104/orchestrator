import { Router } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { DatabaseService } from '../services/database.service';

const router = Router();
const db = new DatabaseService();
const dashboardService = new DashboardService(db);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await dashboardService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;