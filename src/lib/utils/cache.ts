/**
 * Cache utilities for Foodnager API
 * 
 * Provides a simple caching layer with TTL support.
 * Currently implements in-memory cache for development,
 * can be extended with Redis adapter for production.
 */

/**
 * Cache entry with value and expiration time
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * CacheAdapter interface
 * Can be implemented by different cache backends (Memory, Redis, etc.)
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-Memory cache implementation
 * Simple cache using Map for storage
 * Suitable for development and single-instance deployments
 */
class MemoryCache implements CacheAdapter {
  private store = new Map<string, CacheEntry<any>>();

  /**
   * Gets a value from cache
   * Returns null if key doesn't exist or has expired
   * 
   * @param key - Cache key
   * @returns Cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Sets a value in cache with TTL
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const expiresAt = Date.now() + (ttl * 1000);
    
    this.store.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Deletes a specific key from cache
   * 
   * @param key - Cache key to delete
   */
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Clears all entries from cache
   */
  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Deletes all keys matching a pattern
   * Pattern uses simple wildcard matching (e.g., 'tags:*' deletes all keys starting with 'tags:')
   * 
   * @param pattern - Pattern to match (supports * wildcard at the end)
   */
  async deletePattern(pattern: string): Promise<void> {
    const prefix = pattern.replace('*', '');
    const keysToDelete: string[] = [];

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.store.delete(key);
    }
  }

  /**
   * Gets current cache size (for debugging)
   */
  size(): number {
    return this.store.size;
  }
}

/**
 * Redis cache implementation (placeholder for future)
 * Can be implemented when scaling to multiple instances
 */
// class RedisCache implements CacheAdapter {
//   constructor(private client: RedisClient) {}
//   
//   async get<T>(key: string): Promise<T | null> {
//     const value = await this.client.get(key);
//     return value ? JSON.parse(value) : null;
//   }
//   
//   async set<T>(key: string, value: T, ttl: number): Promise<void> {
//     await this.client.setex(key, ttl, JSON.stringify(value));
//   }
//   
//   async delete(key: string): Promise<void> {
//     await this.client.del(key);
//   }
//   
//   async clear(): Promise<void> {
//     await this.client.flushdb();
//   }
// }

/**
 * Cache instance
 * Currently using MemoryCache
 * Can be swapped with RedisCache in production by setting CACHE_PROVIDER env var
 */
export const cache: CacheAdapter = new MemoryCache();

/**
 * Cache key prefixes for different data types
 * Helps organize cache keys and avoid collisions
 */
export const CACHE_KEYS = {
  UNITS_ALL: 'units:all',
  TAGS_ALL: 'tags:all',
  TAGS_SEARCH: (search: string) => `tags:search:${search.toLowerCase()}`,
  PRODUCT: (id: number) => `product:${id}`,
  RECIPE: (id: number) => `recipe:${id}`,
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  UNITS: 3600,      // 1 hour - units rarely change
  TAGS: 600,        // 10 minutes - tags change occasionally
  PRODUCTS: 300,    // 5 minutes - products change more frequently
  RECIPES: 600,     // 10 minutes - recipes change regularly
} as const;

