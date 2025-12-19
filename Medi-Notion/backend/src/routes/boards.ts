// boards.ts - Express 라우트 핸들러

import express, { Request, Response, NextFunction } from 'express';
import { BoardService } from '../services/BoardService.js';
import { BoardListQuery } from '../types/board.types.js';

export function createBoardsRouter(boardService: BoardService) {
  const router = express.Router();

  /**
   * GET /api/boards - 게시글 목록 조회
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 쿼리 파라미터 파싱
      const query: BoardListQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        category: req.query.category as string,
        search: req.query.search as string
      };

      // 서비스 호출
      const result = await boardService.getBoardList(query);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/boards/:id - 게시글 상세 조회
   */
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardIdx = parseInt(req.params.id, 10);
      
      if (!Number.isInteger(boardIdx)) {
        return res.status(400).json({
          success: false,
          error: '유효하지 않은 게시글 ID입니다.'
        });
      }

      const result = await boardService.getBoardDetail(boardIdx);
      res.json(result);
    } catch (error) {
      // 게시글 없음 처리
      if (error instanceof Error && error.message === '게시글을 찾을 수 없습니다.') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  });

  return router;
}