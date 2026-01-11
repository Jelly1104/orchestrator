import express, { Request, Response } from 'express';
import { BToARequest, ApiResponse } from '../types';

const router = express.Router();
let completedRequests: Set<string> = new Set();

router.post('/api/b-to-a', (req: Request, res: Response) => {
  const { c_result }: BToARequest = req.body;

  if (completedRequests.has(c_result)) {
    return res.status(400).json({ message: "Circular dependency detected" });
  }

  completedRequests.add(c_result);

  const response: ApiResponse = { message: "B to A success" };
  return res.json(response);
});

export default router;