import { Router, Request, Response } from 'express';
import { DailyBestExtractor } from '../services/DailyBestExtractor';
import { PodcastScriptGenerator } from '../services/PodcastScriptGenerator';
import { DatabasePool } from '../config/database';
import { ExtractionResponse, GenerationResponse, GenerationOptions } from '../types/podcast.types';

interface ExtractQueryParams {
  date?: string;
}

interface GenerateRequestBody {
  posts: any[];
  options?: Partial<GenerationOptions>;
}

export function createPodcastRoutes(dbPool: DatabasePool): Router {
  const router = Router();
  const extractor = new DailyBestExtractor(dbPool);
  const generator = new PodcastScriptGenerator();

  // Phase A: 베스트 게시물 추출
  router.get('/daily-briefing/extract', async (req: Request<{}, ExtractionResponse, {}, ExtractQueryParams>, res: Response<ExtractionResponse>) => {
    const startTime = new Date();
    
    try {
      const { date: dateParam } = req.query;
      const targetDate = parseTargetDate(dateParam);

      console.log(`[API] 베스트 게시물 추출 요청: ${targetDate.toISOString().split('T')[0]}`);

      const result = await extractor.extractBestPosts(targetDate);

      const responseTime = new Date().getTime() - startTime.getTime();
      console.log(`[API] 추출 완료 (${responseTime}ms): ${result.posts.length}건`);

      res.json({
        status: 'success',
        data: {
          extraction_date: targetDate.toISOString().split('T')[0],
          posts: result.posts,
          metadata: result.metadata
        }
      });

    } catch (error) {
      const responseTime = new Date().getTime() - startTime.getTime();
      console.error(`[API] 추출 API 오류 (${responseTime}ms):`, error);
      
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
      const statusCode = error instanceof Error && error.message.includes('유효하지 않은') ? 400 : 500;
      
      res.status(statusCode).json({
        status: 'error',
        error: errorMessage
      });
    }
  });

  // Phase B: 대본 생성
  router.post('/daily-briefing/generate', async (req: Request<{}, GenerationResponse, GenerateRequestBody>, res: Response<GenerationResponse>) => {
    const startTime = new Date();
    
    try {
      const { posts, options } = req.body;

      // 입력 검증
      const validationError = validateGenerateRequest(posts);
      if (validationError) {
        return res.status(400).json({
          status: 'error',
          error: validationError
        });
      }

      const generationOptions: GenerationOptions = {
        target_duration: options?.target_duration || '8-10분',
        host_character: options?.host_character || 'professional',
        guest_character: options?.guest_character || 'experienced',
        tone: options?.tone || 'conversational'
      };

      console.log(`[API] 대본 생성 요청: ${posts.length}개 게시물, 옵션: ${JSON.stringify(generationOptions)}`);

      const script = await generator.generateScript(posts, generationOptions);

      const responseTime = new Date().getTime() - startTime.getTime();
      console.log(`[API] 대본 생성 완료 (${responseTime}ms): ${script.segments.length}개 세그먼트`);

      res.json({
        status: 'success',
        data: script
      });

    } catch (error) {
      const responseTime = new Date().getTime() - startTime.getTime();
      console.error(`[API] 대본 생성 API 오류 (${responseTime}ms):`, error);
      
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : '대본 생성 중 오류가 발생했습니다'
      });
    }
  });

  return router;
}

function parseTargetDate(dateParam?: string): Date {
  if (dateParam) {
    const targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
      throw new Error('유효하지 않은 날짜 형식입니다. YYYY-MM-DD 형식을 사용해주세요.');
    }
    return targetDate;
  } else {
    // 기본값: 어제
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }
}

function validateGenerateRequest(posts: any[]): string | null {
  if (!posts || !Array.isArray(posts)) {
    return '게시물 데이터는 배열 형태여야 합니다';
  }

  if (posts.length === 0) {
    return '최소 1개 이상의 게시물이 필요합니다';
  }

  // 게시물 데이터 유효성 검사
  const invalidPost = posts.find(post => 
    !post.board_idx || 
    !post.title || 
    !post.content_preview
  );

  if (invalidPost) {
    return '게시물 데이터에 필수 필드(board_idx, title, content_preview)가 누락되었습니다';
  }

  return null;
}