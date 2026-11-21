import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('ETag & Caching Middleware', () => {
  it('adds ETag header on GET requests and returns 304 when If-None-Match matches', async () => {
    // Stable endpoint /ready has ETag
    const res1 = await request(app).get('/ready');
    expect(res1.status).toBe(200);
    const etag = res1.headers['etag'];
    expect(etag).toBeDefined();

    // Replay with If-None-Match
    const res2 = await request(app)
      .get('/ready')
      .set('If-None-Match', etag);
    expect(res2.status).toBe(304);
  });
});
