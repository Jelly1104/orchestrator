import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TodoService } from '../services/todo.service';
import mysql from 'mysql2/promise';

// 모킹된 데이터베이스
const mockConnection = {
  execute: vi.fn(),
  end: vi.fn(),
};

// MySQL 모킹
vi.mock('mysql2/promise', () => ({
  default: {
    createConnection: vi.fn(() => Promise.resolve(mockConnection)),
  },
}));

describe('TodoService', () => {
  let todoService: TodoService;

  beforeEach(() => {
    todoService = new TodoService();
    vi.clearAllMocks();
  });

  describe('getTodosByUserId', () => {
    it('사용자 ID로 할일 목록을 조회해야 한다', async () => {
      // Arrange
      const mockTodos = [
        {
          TODO_ID: 1,
          U_ID: 'doc123',
          CONTENT: '테스트 할일',
          REG_DATE: '2025-01-01 10:00:00',
          DEL_FLAG: 'N'
        }
      ];
      mockConnection.execute.mockResolvedValue([mockTodos]);

      // Act
      const result = await todoService.getTodosByUserId('doc123');

      // Assert
      expect(result).toEqual(mockTodos);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT TODO_ID, U_ID, CONTENT'),
        ['doc123']
      );
    });
  });

  describe('createTodo', () => {
    it('새로운 할일을 생성해야 한다', async () => {
      // Arrange
      const mockResult = { insertId: 1 };
      mockConnection.execute.mockResolvedValue([mockResult]);

      // Act
      const result = await todoService.createTodo('doc123', '새 할일');

      // Assert
      expect(result).toBe(1);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO TODO_LIST'),
        ['doc123', '새 할일']
      );
    });
  });

  describe('deleteTodo', () => {
    it('할일을 소프트 삭제해야 한다', async () => {
      // Arrange
      const mockResult = { affectedRows: 1 };
      mockConnection.execute.mockResolvedValue([mockResult]);

      // Act
      await todoService.deleteTodo(1, 'doc123');

      // Assert
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE TODO_LIST SET DEL_FLAG = \'Y\''),
        [1, 'doc123']
      );
    });

    it('존재하지 않는 할일 삭제 시 에러를 던져야 한다', async () => {
      // Arrange
      const mockResult = { affectedRows: 0 };
      mockConnection.execute.mockResolvedValue([mockResult]);

      // Act & Assert
      await expect(todoService.deleteTodo(999, 'doc123'))
        .rejects.toThrow('Todo not found or already deleted');
    });
  });
});