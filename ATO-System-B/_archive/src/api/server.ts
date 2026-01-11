import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 4000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// API 라우트 설정
app.use('/api', apiRoutes);

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 서버 시작
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
  });
}

export default app;