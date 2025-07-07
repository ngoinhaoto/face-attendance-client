const CACHE_EXPIRY = 3 * 60 * 1000; // 5 minutes in milliseconds

class CacheService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data if it exists and hasn't expired
   * @param {string} key - Cache key
   * @returns {any} Cached data or null if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) return null;

    const { data, timestamp } = this.cache.get(key);
    const now = Date.now();

    if (now - timestamp > CACHE_EXPIRY) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate a specific cache entry
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries that match a prefix
   * @param {string} prefix - Prefix to match
   */
  invalidateByPrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }
}

export default new CacheService();
