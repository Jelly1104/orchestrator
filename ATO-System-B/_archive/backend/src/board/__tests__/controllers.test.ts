// 백엔드 테스트 코드

import request from 'supertest';
import app from '../../app';
import { sequelize } from '../../sequelize';

describe('Board API', () => {
  beforeAll(async () => {
    await sequelize.sync();
  });

  it('should fetch list of boards', async () => {
    const response = await request(app).get('/api/boards');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});