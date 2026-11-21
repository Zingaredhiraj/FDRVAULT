import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Route Guard & Security Headers', () => {
  const protectedRoutes = [
    { method: 'get', path: '/api/v1/fdrs' },
    { method: 'get', path: '/api/v1/institutions' },
    { method: 'get', path: '/api/v1/releases' },
    { method: 'get', path: '/api/v1/users' },
    { method: 'get', path: '/api/v1/audit' },
    { method: 'get', path: '/api/v1/dashboard/kpis' },
    { method: 'get', path: '/api/v1/notifications' },
    { method: 'get', path: '/api/v1/settings' },
  ];

  for (const { method, path } of protectedRoutes) {
    it(`rejects unauthenticated ${method.toUpperCase()} ${path} with 401`, async () => {
      const res = await (request(app) as any)[method](path);
      expect(res.status).toBe(401);
    });
  }

  it('allows public access to /health and /ready without token', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);

    const ready = await request(app).get('/ready');
    expect(ready.status).toBe(200);
  });
});
