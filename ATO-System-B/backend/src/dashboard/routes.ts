import express from 'express';
import { getChartData, getFilterOptions } from './controllers';

const router = express.Router();

/**
 * @route GET /api/dashboard/charts
 * @desc 대시보드 차트 데이터를 제공
 */
router.get('/charts', async (req, res) => {
  try {
    const chartData = await getChartData();
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: '차트 데이터를 불러오는 중 문제가 발생했습니다.' });
  }
});

/**
 * @route GET /api/dashboard/filters
 * @desc 대시보드 필터 데이터를 제공
 */
router.get('/filters', async (req, res) => {
  try {
    const filterOptions = await getFilterOptions();
    res.json(filterOptions);
  } catch (error) {
    res.status(500).json({ error: '필터 데이터를 불러오는 중 문제가 발생했습니다.' });
  }
});

export default router;