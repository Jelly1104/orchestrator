import express from 'express';
import cors from 'cors';
import { todoRoutes } from './features/todo/api/routes';

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우트
app.use('/api', todoRoutes);

// 정적 파일 제공 (React 빌드 파일)
app.use(express.static('dist'));

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;