// src/services/cacheService.ts
import { appLog } from '../components/LogViewer';

/**
 * Cache configuration
 */
interface CacheConfig {
  // Default time-to-live in milliseconds (30 minutes)
  defaultTTL: number;
  // Maximum number of items in the cache
  maxItems: number;
  // Whether to use localStorage for persistence
  useLocalStorage: boolean;
  // Namespace for localStorage keys
  storageNamespace: string;
}

/**
 * Cache item with metadata
 */
interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  key: string;
}

/**
 * Default cache configuration
 */
const defaultConfig: CacheConfig = {
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxItems: 100,
  useLocalStorage: true,
  storageNamespace: 'alice_reader_cache_'
};

/**
 * Cache service for efficient data caching
 */
export class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private config: CacheConfig;
  private accessOrder: string[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.loadFromStorage();
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time-to-live in milliseconds (optional)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const actualTTL = ttl || this.config.defaultTTL;
    
    // Create cache item
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: actualTTL,
      key
    };

    // Update access order
    this.updateAccessOrder(key);
    
    // Add to cache
    this.cache.set(key, item);
    
    // Enforce max items limit
    this.enforceMaxItems();
    
    // Save to storage if enabled
    if (this.config.useLocalStorage) {
      this.saveToStorage();
    }
    
    appLog('CacheService', `Set cache item: ${key}`, 'debug');
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    // Return undefined if item not found
    if (!item) {
      appLog('CacheService', `Cache miss: ${key}`, 'debug');
      return undefined;
    }
    
    // Check if item is expired
    if (this.isExpired(item)) {
      appLog('CacheService', `Cache item expired: ${key}`, 'debug');
      this.remove(key);
      return undefined;
    }
    
    // Update access order
    this.updateAccessOrder(key);
    
    appLog('CacheService', `Cache hit: ${key}`, 'debug');
    return item.value;
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  remove(key: string): void {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    
    if (this.config.useLocalStorage) {
      this.saveToStorage();
    }
    
    appLog('CacheService', `Removed cache item: ${key}`, 'debug');
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    
    if (this.config.useLocalStorage) {
      this.clearStorage();
    }
    
    appLog('CacheService', 'Cache cleared', 'debug');
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (this.isExpired(item)) {
      this.remove(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get all valid (non-expired) keys in the cache
   * @returns Array of cache keys
   */
  keys(): string[] {
    // Clean up expired items first
    this.cleanExpired();
    
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): { size: number; maxSize: number; oldestItem: number; newestItem: number } {
    // Clean up expired items first
    this.cleanExpired();
    
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    
    this.cache.forEach(item => {
      if (item.timestamp < oldestTimestamp) oldestTimestamp = item.timestamp;
      if (item.timestamp > newestTimestamp) newestTimestamp = item.timestamp;
    });
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxItems,
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp
    };
  }

  /**
   * Check if an item is expired
   * @param item Cache item
   * @returns True if the item is expired
   */
  private isExpired<T>(item: CacheItem<T>): boolean {
    return Date.now() > item.timestamp + item.ttl;
  }

  /**
   * Clean up expired items
   */
  private cleanExpired(): void {
    const now = Date.now();
    
    this.cache.forEach((item, key) => {
      if (now > item.timestamp + item.ttl) {
        this.remove(key);
      }
    });
  }

  /**
   * Update the access order for LRU eviction
   * @param key Cache key
   */
  private updateAccessOrder(key: string): void {
    // Remove key from current position
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    
    // Add key to the end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Enforce the maximum items limit
   */
  private enforceMaxItems(): void {
    if (this.cache.size <= this.config.maxItems) {
      return;
    }
    
    // Remove oldest items until we're under the limit
    while (this.cache.size > this.config.maxItems && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder[0];
      this.remove(oldestKey);
      this.accessOrder.shift();
    }
  }

  /**
   * Save the cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      // Clean expired items before saving
      this.cleanExpired();
      
      // Convert cache to array for serialization
      const cacheArray = Array.from(this.cache.entries());
      
      // Save cache and access order
      localStorage.setItem(
        `${this.config.storageNamespace}data`,
        JSON.stringify(cacheArray)
      );
      
      localStorage.setItem(
        `${this.config.storageNamespace}order`,
        JSON.stringify(this.accessOrder)
      );
      
      appLog('CacheService', 'Cache saved to localStorage', 'debug');
    } catch (error) {
      appLog('CacheService', 'Error saving cache to localStorage', 'error', error);
    }
  }

  /**
   * Load the cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      // Load cache data
      const cacheData = localStorage.getItem(`${this.config.storageNamespace}data`);
      if (cacheData) {
        const cacheArray = JSON.parse(cacheData);
        this.cache = new Map(cacheArray);
      }
      
      // Load access order
      const orderData = localStorage.getItem(`${this.config.storageNamespace}order`);
      if (orderData) {
        this.accessOrder = JSON.parse(orderData);
      }
      
      // Clean expired items after loading
      this.cleanExpired();
      
      appLog('CacheService', 'Cache loaded from localStorage', 'debug');
    } catch (error) {
      appLog('CacheService', 'Error loading cache from localStorage', 'error', error);
      
      // Reset cache if there was an error
      this.cache = new Map();
      this.accessOrder = [];
    }
  }

  /**
   * Clear the cache from localStorage
   */
  private clearStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      localStorage.removeItem(`${this.config.storageNamespace}data`);
      localStorage.removeItem(`${this.config.storageNamespace}order`);
      
      appLog('CacheService', 'Cache cleared from localStorage', 'debug');
    } catch (error) {
      appLog('CacheService', 'Error clearing cache from localStorage', 'error', error);
    }
  }
}

// Create and export default instance
export const bookCache = new CacheService({
  defaultTTL: 60 * 60 * 1000, // 1 hour
  storageNamespace: 'alice_reader_book_'
});

export const sectionCache = new CacheService({
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  storageNamespace: 'alice_reader_section_'
});

export const dictionaryCache = new CacheService({
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  storageNamespace: 'alice_reader_dict_'
});

export const progressCache = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  storageNamespace: 'alice_reader_progress_'
});

export const statsCache = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  storageNamespace: 'alice_reader_stats_'
});

// Export a function to create custom cache instances
export function createCache(config: Partial<CacheConfig> = {}): CacheService {
  return new CacheService(config);
}
