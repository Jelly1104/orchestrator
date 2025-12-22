// app.ts - Express 애플리케이션 설정

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mysql from 'mysql2/promise';

import { BoardRepository } from './repositories/BoardRepository.js';
import { BoardService } from './services/BoardService.js';
import { createBoardsRouter } from './routes/boards.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(helmet()); // 보안 헤더
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate Limiting (보안)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 100, // 최대 100회
  message: {
    success: false,
    error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use('/api', limiter);

app.use(express.json());

// DB 연결 설정
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medigate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const db = mysql.createPool(dbConfig);

// 의존성 주입
const boardRepository = new BoardRepository(db);
const boardService = new BoardService(boardRepository);

// 라우트 설정
app.use('/api/boards', createBoardsRouter(boardService));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 핸들러
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '요청하신 리소스를 찾을 수 없습니다.'
  });
});

// 에러 핸들러
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? '서버 오류가 발생했습니다.' 
      : err.message
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;