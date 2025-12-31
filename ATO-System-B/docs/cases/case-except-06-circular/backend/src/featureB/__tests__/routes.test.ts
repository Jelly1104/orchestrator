import request from 'supertest';
import express from 'express';
import bRoutes from '../routes';

const app = express();
app.use(express.json());
app.use('/', bRoutes);

describe('POST /api/b-to-a', () => {
  it('should return success when c_result is provided', async () => {
    const response = await request(app)
      .post('/api/b-to-a')
      .send({ c_result: 'testResult' });
      
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('B to A success');
  });

  it('should detect circular dependency', async () => {
    // Initial request to add to completedRequests
    await request(app).post('/api/b-to-a').send({ c_result: 'duplicateResult' });

    // Second request with same data should fail
    const response = await request(app)
      .post('/api/b-to-a')
      .send({ c_result: 'duplicateResult' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Circular dependency detected');
  });
});