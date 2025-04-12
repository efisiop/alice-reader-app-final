// src/services/__tests__/cacheService.test.ts
import { cache, booksCache, sectionsCache, statsCache } from '../cacheService';

describe('cacheService', () => {
  beforeEach(() => {
    // Clear all caches before each test
    cache.clear();
    booksCache.clear();
    sectionsCache.clear();
    statsCache.clear();
  });
  
  describe('cache', () => {
    it('should set and get a value', () => {
      // Arrange
      const key = 'testKey';
      const value = { id: 1, name: 'Test' };
      
      // Act
      cache.set(key, value);
      const result = cache.get(key);
      
      // Assert
      expect(result).toEqual(value);
    });
    
    it('should return null for a non-existent key', () => {
      // Arrange
      const key = 'nonExistentKey';
      
      // Act
      const result = cache.get(key);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should remove a value', () => {
      // Arrange
      const key = 'testKey';
      const value = { id: 1, name: 'Test' };
      cache.set(key, value);
      
      // Act
      cache.remove(key);
      const result = cache.get(key);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should clear all values', () => {
      // Arrange
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Act
      cache.clear();
      
      // Assert
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
    
    it('should expire values after the specified time', () => {
      // Arrange
      jest.useFakeTimers();
      const key = 'testKey';
      const value = { id: 1, name: 'Test' };
      
      // Act
      cache.set(key, value, 1000); // 1 second expiry
      
      // Assert - Value exists before expiry
      expect(cache.get(key)).toEqual(value);
      
      // Advance time by 1.1 seconds
      jest.advanceTimersByTime(1100);
      
      // Assert - Value is expired
      expect(cache.get(key)).toBeNull();
      
      // Clean up
      jest.useRealTimers();
    });
  });
  
  describe('specialized caches', () => {
    it('should use booksCache for book data', () => {
      // Arrange
      const key = 'book_1';
      const value = { id: 1, title: 'Test Book' };
      
      // Act
      booksCache.set(key, value);
      const result = booksCache.get(key);
      
      // Assert
      expect(result).toEqual(value);
    });
    
    it('should use sectionsCache for section data', () => {
      // Arrange
      const key = 'section_1';
      const value = { id: 1, content: 'Test content' };
      
      // Act
      sectionsCache.set(key, value);
      const result = sectionsCache.get(key);
      
      // Assert
      expect(result).toEqual(value);
    });
    
    it('should use statsCache for statistics data', () => {
      // Arrange
      const key = 'stats_1';
      const value = { pages_read: 10, total_reading_time: 3600 };
      
      // Act
      statsCache.set(key, value);
      const result = statsCache.get(key);
      
      // Assert
      expect(result).toEqual(value);
    });
    
    it('should have separate storage for each specialized cache', () => {
      // Arrange
      const key = 'shared_key';
      
      // Act
      booksCache.set(key, 'books value');
      sectionsCache.set(key, 'sections value');
      statsCache.set(key, 'stats value');
      
      // Assert
      expect(booksCache.get(key)).toBe('books value');
      expect(sectionsCache.get(key)).toBe('sections value');
      expect(statsCache.get(key)).toBe('stats value');
    });
  });
});
