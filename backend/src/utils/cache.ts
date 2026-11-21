/**
 * Simple in-memory LRU cache with TTL support.
 * No external dependencies — implemented using a Map (insertion order = LRU order).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // epoch ms
}

export class LRUCache<T = unknown> {
  private map: Map<string, CacheEntry<T>>;
  private readonly capacity: number;

  constructor(capacity = 1000) {
    this.map = new Map();
    this.capacity = capacity;
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    // LRU: move to end
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict least-recently-used (first entry)
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.map.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) {
        this.map.delete(key);
      }
    }
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}

/** Singleton cache instance shared across routes */
export const appCache = new LRUCache(2000);

/** TTL in milliseconds from env CACHE_TTL_SECONDS (default 30 s) */
export function getCacheTtlMs(): number {
  const seconds = parseInt(process.env.CACHE_TTL_SECONDS ?? '30', 10);
  return (isNaN(seconds) ? 30 : seconds) * 1000;
}

/**
 * Build a cache key from the authenticated user context + route name.
 * Format: `role:institutionId:routeName`
 */
export function buildCacheKey(
  role: string,
  institutionId: string | undefined,
  routeName: string
): string {
  return `${role}:${institutionId ?? 'global'}:${routeName}`;
}
