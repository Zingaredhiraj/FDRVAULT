import { createHash } from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * ETag / 304 middleware.
 *
 * Wraps res.json so that every successful GET response gets an ETag header
 * (first 16 hex chars of the SHA-256 of the JSON body).
 * If the request carries an `If-None-Match` header that matches the ETag
 * the middleware returns HTTP 304 instead.
 *
 * Usage:  router.use(etagMiddleware);   (before route handlers)
 *   or    router.get('/list', etagMiddleware, handler);
 */
export function etagMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'GET') {
    return next();
  }

  const originalJson = res.json.bind(res);

  // Override res.json to inject ETag logic
  res.json = function (body: unknown): Response {
    // Only process 2xx responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const payload = JSON.stringify(body);
      const etag = `"${createHash('sha256').update(payload).digest('hex').slice(0, 16)}"`;

      res.setHeader('ETag', etag);

      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === etag) {
        res.status(304).end();
        return res;
      }
    }

    return originalJson(body);
  };

  next();
}
