/**
 * In-Memory Cache
 * Caches frequently accessed data to reduce database queries
 *
 * TODO (T032-T033): Implement caching layer for workspace data
 */

export class Cache<K, V> {
  private store: Map<K, V> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get a value from cache
   * TODO (T032): Implement
   */
  get(key: K): V | undefined {
    return this.store.get(key);
  }

  /**
   * Set a value in cache with LRU eviction
   * TODO (T032): Implement
   */
  set(key: K, value: V): void {
    // Simple implementation - will add LRU in T032
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
      }
    }
    this.store.set(key, value);
  }

  /**
   * Remove a value from cache
   * TODO (T033): Implement
   */
  delete(key: K): void {
    this.store.delete(key);
  }

  /**
   * Clear all cached values
   * TODO (T033): Implement
   */
  clear(): void {
    this.store.clear();
  }
}
