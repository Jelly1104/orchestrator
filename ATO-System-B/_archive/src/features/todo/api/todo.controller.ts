import { Request, Response } from 'express';
import { TodoService } from '../services/todo.service';
import { TodoCreateRequest } from '../../../shared/types/todo.types';

export class TodoController {
  private todoService: TodoService;

  constructor() {
    this.todoService = new TodoService();
  }

  async getTodos(req: Request, res: Response) {
    try {
      // 임시로 하드코딩된 U_ID 사용 (인증 구현 시 req.user.U_ID로 대체)
      const uId = 'doc123';
      const todos = await this.todoService.getTodosByUserId(uId);
      
      res.status(200).json({
        success: true,
        data: todos
      });
    } catch (error) {
      console.error('Get todos error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch todos'
      });
    }
  }

  async createTodo(req: Request, res: Response) {
    try {
      const { content }: TodoCreateRequest = req.body;
      
      // 입력 검증
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Content is required'
        });
      }

      if (content.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Content must be less than 500 characters'
        });
      }

      const uId = 'doc123'; // 임시 하드코딩
      const todoId = await this.todoService.createTodo(uId, content.trim());
      
      res.status(201).json({
        success: true,
        data: {
          todo_id: todoId,
          message: 'Todo created successfully'
        }
      });
    } catch (error) {
      console.error('Create todo error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create todo'
      });
    }
  }

  async deleteTodo(req: Request, res: Response) {
    try {
      const todoId = parseInt(req.params.id);
      
      if (isNaN(todoId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid todo ID'
        });
      }

      const uId = 'doc123'; // 임시 하드코딩
      await this.todoService.deleteTodo(todoId, uId);
      
      res.status(200).json({
        success: true,
        data: {
          message: 'Todo deleted successfully'
        }
      });
    } catch (error) {
      console.error('Delete todo error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete todo'
      });
    }
  }
}