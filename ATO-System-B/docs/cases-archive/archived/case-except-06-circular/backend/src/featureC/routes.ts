import express, { Request, Response } from 'express';
import { CToBRequest, ApiResponse } from '../types';

const router = express.Router();
let completedRequests: Set<string> = new Set();

router.post('/api/c-to-b', (req: Request, res: Response) => {
  const { a_result }: CToBRequest = req.body;

  if (completedRequests.has(a_result)) {
    return res.status(400).json({ message: "Circular dependency detected" });
  }

  completedRequests.add(a_result);

  const response: ApiResponse = { message: "C to B success" };
  return res.json(response);
});

export default router;