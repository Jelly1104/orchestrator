import request from 'supertest';
import express from 'express';
import cRoutes from '../routes';

const app = express();
app.use(express.json());
app.use('/', cRoutes);

describe('POST /api/c-to-b', () => {
  it('should return success when a_result is provided', async () => {
    const response = await request(app)
      .post('/api/c-to-b')
      .send({ a_result: 'testResult' });
      
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('C to B success');
  });

  it('should detect circular dependency', async () => {
    // Initial request to add to completedRequests
    await request(app).post('/api/c-to-b').send({ a_result: 'duplicateResult' });

    // Second request with same data should fail
    const response = await request(app)
      .post('/api/c-to-b')
      .send({ a_result: 'duplicateResult' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Circular dependency detected');
  });
});