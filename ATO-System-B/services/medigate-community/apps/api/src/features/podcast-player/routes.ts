import express from 'express';
import mysql from 'mysql2/promise';
import { BestPostsExtractor } from './services/bestPostsExtractor';
import { PIIPreprocessor } from './services/piiPreprocessor';
import { PodcastScriptGenerator } from './services/scriptGenerator';
import { ExtractBestPostsRequest, GenerateScriptRequest } from './types';

const router = express.Router();

// MySQL 연결 설정 (실제 환경에서는 환경변수 사용)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medigate'
};

// Phase A - 베스트 게시물 추출
router.get('/extract/best-posts', async (req, res) => {
  try {
    const { date } = req.query as ExtractBestPostsRequest;
    
    const connection = await mysql.createConnection(dbConfig);
    const extractor = new BestPostsExtractor(connection);
    
    // SQL 쿼리 파일 생성
    const sqlQuery = extractor.generateSqlQuery(date);
    
    await connection.end();
    
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="best_posts_query.sql"');
    res.send(sqlQuery);
    
  } catch (error) {
    console.error('Extract best posts error:', error);
    res.status(500).json({ 
      error: 'Failed to generate best posts query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/extract/preprocess', async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const connection = await mysql.createConnection(dbConfig);
    const extractor = new BestPostsExtractor(connection);
    const preprocessor = new PIIPreprocessor();
    
    // 실제 데이터 추출
    const bestPosts = await extractor.extractBestPosts(targetDate);
    
    if (bestPosts.length === 0) {
      await connection.end();
      return res.status(404).json({
        error: 'No posts found',
        message: `No best posts found for date: ${targetDate}`
      });
    }
    
    // PII 전처리
    const rawDataSummary = await preprocessor.processRawData(bestPosts, targetDate);
    
    await connection.end();
    
    res.json(rawDataSummary);
    
  } catch (error) {
    console.error('Preprocess error:', error);
    res.status(500).json({ 
      error: 'Failed to preprocess data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Phase B - 팟캐스트 대본 생성
router.post('/generate/script', async (req, res) => {
  try {
    const { raw_data_summary } = req.body as GenerateScriptRequest;
    
    if (!raw_data_summary || !raw_data_summary.best_posts) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'raw_data_summary is required'
      });
    }
    
    const scriptGenerator = new PodcastScriptGenerator();
    const script = scriptGenerator.generateScript(raw_data_summary);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="Podcast_Script.md"');
    res.send(script);
    
  } catch (error) {
    console.error('Generate script error:', error);
    res.status(500).json({ 
      error: 'Failed to generate script',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/generate/metadata', async (req, res) => {
  try {
    const { script } = req.body;
    
    if (!script) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'script content is required'
      });
    }
    
    const scriptGenerator = new PodcastScriptGenerator();
    const metadata = scriptGenerator.generateMetadata(script);
    
    res.json(metadata);
    
  } catch (error) {
    console.error('Generate metadata error:', error);
    res.status(500).json({ 
      error: 'Failed to generate metadata',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;