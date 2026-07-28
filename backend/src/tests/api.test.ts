import request from 'supertest';
import server from '../app';
import prisma from '../config/prisma';

describe('TransitFlow API Integration Tests', () => {
  afterAll(async () => {
    // Disconnect Prisma Client and close HTTP server
    await prisma.$disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe('GET /health', () => {
    it('should return 200 OK and healthy status', async () => {
      const res = await request(server).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should fail with 400 Bad Request when parameters are missing', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: '' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should fail with 400 Bad Request for incorrect user credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@transitflow.com', password: 'wrongpassword' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
