import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { todoRoutes } from '../api/routes';

// TodoService 모킹
vi.mock('../services/todo.service', () => ({
  TodoService: vi.fn().mockImplementation(() => ({
    getTodosByUserId: vi.fn(),
    createTodo: vi.fn(),
    deleteTodo: vi.fn(),
  })),
}));

describe('Todo Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', todoRoutes);
  });

  describe('GET /api/todos', () => {
    it('할일 목록을 반환해야 한다', async () => {
      // Act
      const response = await request(app).get('/api/todos');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/todos', () => {
    it('유효한 할일을 생성해야 한다', async () => {
      // Act
      const response = await request(app)
        .post('/api/todos')
        .send({ content: '테스트 할일' });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });

    it('빈 내용으로 할일 생성 시 400 에러를 반환해야 한다', async () => {
      // Act
      const response = await request(app)
        .post('/api/todos')
        .send({ content: '' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Content is required');
    });

    it('500자 초과 내용으로 할일 생성 시 400 에러를 반환해야 한다', async () => {
      // Act
      const longContent = 'a'.repeat(501);
      const response = await request(app)
        .post('/api/todos')
        .send({ content: longContent });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('less than 500 characters');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('유효한 ID로 할일을 삭제해야 한다', async () => {
      // Act
      const response = await request(app).delete('/api/todos/1');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('유효하지 않은 ID로 삭제 시 400 에러를 반환해야 한다', async () => {
      // Act
      const response = await request(app).delete('/api/todos/invalid');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid todo ID');
    });
  });
});