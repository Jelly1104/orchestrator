import request from 'supertest';
import express from 'express';
import { HelloController } from '../../controllers/helloController';

describe('HelloController', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    const controller = new HelloController();
    app.get('/api/hello', controller.getHelloWorld.bind(controller));
  });

  describe('GET /api/hello', () => {
    it('성공적으로 Hello World 응답을 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/hello')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Hello, World!');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
      
      // timestamp가 ISO 8601 형식인지 확인
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('응답 헤더가 올바르게 설정되어야 한다', async () => {
      const response = await request(app)
        .get('/api/hello')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});