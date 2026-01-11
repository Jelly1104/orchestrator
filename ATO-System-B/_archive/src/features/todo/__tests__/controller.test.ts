import { TodoController } from '../api/controller';
import { TodoService } from '../api/service';
import { Request, Response, NextFunction } from 'express';

// Mock TodoService
jest.mock('../api/service');
const MockedTodoService = TodoService as jest.MockedClass<typeof TodoService>;

describe('TodoController', () => {
  let controller: TodoController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockService: jest.Mocked<TodoService>;

  beforeEach(() => {
    controller = new TodoController();
    mockService = new MockedTodoService() as jest.Mocked<TodoService>;
    (controller as any).service = mockService;

    mockRequest = {
      user: { U_ID: 'test_user' },
      body: {},
      params: {}
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('사용자의 투두 목록을 반환해야 한다', async () => {
      // Arrange
      const mockTodos = [
        { todo_id: 1, content: '테스트 투두', reg_date: '2025-01-01T00:00:00Z' }
      ];
      mockService.findAllByUser.mockResolvedValue(mockTodos);

      // Act
      await controller.list(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.findAllByUser).toHaveBeenCalledWith('test_user');
      expect(mockResponse.json).toHaveBeenCalledWith(mockTodos);
    });

    it('서비스 에러 시 next를 호출해야 한다', async () => {
      // Arrange
      const error = new Error('Database error');
      mockService.findAllByUser.mockRejectedValue(error);

      // Act
      await controller.list(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('create', () => {
    it('유효한 투두를 생성해야 한다', async () => {
      // Arrange
      mockRequest.body = { content: '새로운 투두' };
      const mockResult = { todo_id: 1, message: '투두가 추가되었습니다.' };
      mockService.create.mockResolvedValue(mockResult);

      // Act
      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.create).toHaveBeenCalledWith('test_user', { content: '새로운 투두' });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('빈 내용일 때 400 에러를 반환해야 한다', async () => {
      // Arrange
      mockRequest.body = { content: '' };

      // Act
      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'INVALID_INPUT',
        message: '할일 내용을 입력해주세요.'
      });
    });

    it('500자 초과 시 400 에러를 반환해야 한다', async () => {
      // Arrange
      mockRequest.body = { content: 'a'.repeat(501) };

      // Act
      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'CONTENT_TOO_LONG',
        message: '할일 내용은 500자를 초과할 수 없습니다.'
      });
    });
  });

  describe('delete', () => {
    it('투두를 성공적으로 삭제해야 한다', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockService.softDelete.mockResolvedValue(true);

      // Act
      await controller.delete(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.softDelete).toHaveBeenCalledWith('test_user', 1);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: '투두가 삭제되었습니다.' });
    });

    it('존재하지 않는 투두 삭제 시 404를 반환해야 한다', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockService.softDelete.mockResolvedValue(false);

      // Act
      await controller.delete(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'TODO_NOT_FOUND',
        message: '해당 투두를 찾을 수 없습니다.'
      });
    });

    it('유효하지 않은 ID 시 400을 반환해야 한다', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };

      // Act
      await controller.delete(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'INVALID_TODO_ID',
        message: '유효하지 않은 투두 ID입니다.'
      });
    });
  });
});