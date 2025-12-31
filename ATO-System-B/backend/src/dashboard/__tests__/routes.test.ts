import request from 'supertest';
import app from '../../app'; // Express 앱 불러오기

describe('GET /api/dashboard/charts', () => {
  it('should return chart data', async () => {
    const response = await request(app).get('/api/dashboard/charts');
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('GET /api/dashboard/filters', () => {
  it('should return filter options', async () => {
    const response = await request(app).get('/api/dashboard/filters');
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
  });
});