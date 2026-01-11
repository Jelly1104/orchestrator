import { Request, Response, NextFunction } from 'express';
import { TodoService } from './service';
import { TodoCreateRequest } from '../../../shared/types/todo.dto';

export class TodoController {
  private service = new TodoService();

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 실제 구현에서는 세션/JWT에서 U_ID를 추출해야 함
      const uId = req.user?.U_ID || 'test_user'; // Mock for development
      
      const todos = await this.service.findAllByUser(uId);
      res.json(todos);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uId = req.user?.U_ID || 'test_user'; // Mock for development
      const createRequest: TodoCreateRequest = req.body;

      // 입력 검증
      if (!createRequest.content || createRequest.content.trim().length === 0) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: '할일 내용을 입력해주세요.'
        });
      }

      if (createRequest.content.length > 500) {
        return res.status(400).json({
          error: 'CONTENT_TOO_LONG',
          message: '할일 내용은 500자를 초과할 수 없습니다.'
        });
      }

      const result = await this.service.create(uId, createRequest);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uId = req.user?.U_ID || 'test_user'; // Mock for development
      const todoId = parseInt(req.params.id);

      if (isNaN(todoId)) {
        return res.status(400).json({
          error: 'INVALID_TODO_ID',
          message: '유효하지 않은 투두 ID입니다.'
        });
      }

      const result = await this.service.softDelete(uId, todoId);
      if (!result) {
        return res.status(404).json({
          error: 'TODO_NOT_FOUND',
          message: '해당 투두를 찾을 수 없습니다.'
        });
      }

      res.json({ message: '투두가 삭제되었습니다.' });
    } catch (error) {
      next(error);
    }
  };
}