import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/prisma';

async function loginAs(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'Demo@1234' });
  return res.body.data?.accessToken;
}

describe('Query Count / N+1 Prevention', () => {
  it('GET /api/v1/fdrs executes within bounded query count (no N+1)', async () => {
    const token = await loginAs('admin@aicte.demo');

    let queryCount = 0;
    (prisma as any).$use(async (params: any, next: any) => {
      queryCount++;
      return next(params);
    });

    const res = await request(app)
      .get('/api/v1/fdrs?page=1&pageSize=20')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Listing 20 FDRs must not execute 20 queries (e.g. 1 count + 1 findMany = 2 queries)
    expect(queryCount).toBeLessThanOrEqual(5);
  });
});
