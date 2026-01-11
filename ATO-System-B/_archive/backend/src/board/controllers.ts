// 백엔드 컨트롤러

import { Request, Response } from 'express';
import { BoardModel } from './models';

export const getBoards = async (req: Request, res: Response) => {
  try {
    const boards = await BoardModel.findAll({
      order: [['REG_DATE', 'DESC']],
      limit: 10 // Example limit for pagination
    });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};