// 백엔드 API 라우트

import express from 'express';
import { getBoards } from './controllers';

const router = express.Router();

router.get('/boards', getBoards);

export default router;