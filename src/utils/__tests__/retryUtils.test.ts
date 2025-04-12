// src/utils/__tests__/retryUtils.test.ts
import { executeWithRetries } from '../retryUtils';
import { appLog } from '../../components/LogViewer';

// Mock the appLog function
jest.mock('../../components/LogViewer', () => ({
  appLog: jest.fn(),
}));

describe('retryUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('executeWithRetries', () => {
    it('should execute the function and return the result if successful on first try', async () => {
      // Arrange
      const mockFn = jest.fn().mockResolvedValue({ data: 'success', error: null });
      
      // Act
      const result = await executeWithRetries(mockFn, 'testOperation');
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: 'success', error: null });
      expect(appLog).toHaveBeenCalledWith(
        'RetryUtils',
        'Operation testOperation completed successfully',
        'success'
      );
    });
    
    it('should retry the function if it fails and eventually succeed', async () => {
      // Arrange
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ data: 'success', error: null });
      
      // Act
      const result = await executeWithRetries(mockFn, 'testOperation', 2, 10);
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success', error: null });
      expect(appLog).toHaveBeenCalledWith(
        'RetryUtils',
        'Operation testOperation failed, retrying (1/2)...',
        'warning',
        new Error('Network error')
      );
      expect(appLog).toHaveBeenCalledWith(
        'RetryUtils',
        'Operation testOperation completed successfully on retry',
        'success'
      );
    });
    
    it('should return the error if all retries fail', async () => {
      // Arrange
      const mockError = new Error('Network error');
      const mockFn = jest.fn().mockRejectedValue(mockError);
      
      // Act
      const result = await executeWithRetries(mockFn, 'testOperation', 2, 10);
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
      expect(result).toEqual({ data: null, error: mockError });
      expect(appLog).toHaveBeenCalledWith(
        'RetryUtils',
        'Operation testOperation failed after 3 attempts',
        'error',
        mockError
      );
    });
    
    it('should handle Supabase errors correctly', async () => {
      // Arrange
      const mockSupabaseError = { message: 'Supabase error', code: 'PGRST301' };
      const mockFn = jest.fn().mockResolvedValue({ data: null, error: mockSupabaseError });
      
      // Act
      const result = await executeWithRetries(mockFn, 'testOperation');
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: null, error: mockSupabaseError });
      expect(appLog).toHaveBeenCalledWith(
        'RetryUtils',
        'Operation testOperation failed with Supabase error',
        'error',
        mockSupabaseError
      );
    });
  });
});
