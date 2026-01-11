import request from 'supertest';
import express from 'express';
import aRoutes from '../routes';

const app = express();
app.use(express.json());
app.use('/', aRoutes);

describe('POST /api/a-to-c', () => {
  it('should return success when b_result is provided', async () => {
    const response = await request(app)
      .post('/api/a-to-c')
      .send({ b_result: 'testResult' });
      
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('A to C success');
  });

  it('should detect circular dependency', async () => {
    // Initial request to add to completedRequests
    await request(app).post('/api/a-to-c').send({ b_result: 'duplicateResult' });

    // Second request with same data should fail
    const response = await request(app)
      .post('/api/a-to-c')
      .send({ b_result: 'duplicateResult' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Circular dependency detected');
  });
});