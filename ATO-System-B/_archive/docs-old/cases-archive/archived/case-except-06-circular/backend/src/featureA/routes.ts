import express, { Request, Response } from 'express';
import { AToCRequest, ApiResponse } from '../types';

const router = express.Router();
let completedRequests: Set<string> = new Set();

router.post('/api/a-to-c', (req: Request, res: Response) => {
  const { b_result }: AToCRequest = req.body;

  if (completedRequests.has(b_result)) {
    return res.status(400).json({ message: "Circular dependency detected" });
  }

  completedRequests.add(b_result);

  const response: ApiResponse = { message: "A to C success" };
  return res.json(response);
});

export default router;