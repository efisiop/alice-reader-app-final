// src/components/Reader/__tests__/ReadingProgressWidget.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/testUtils';
import ReadingProgressWidget from '../ReadingProgressWidget';
import * as statisticsService from '../../../services/statisticsService';

// Mock the statistics service
jest.mock('../../../services/statisticsService');

describe('ReadingProgressWidget', () => {
  // Set up mocks before each test
  beforeEach(() => {
    // Mock getBasicReadingStats function
    (statisticsService.getBasicReadingStats as jest.Mock).mockResolvedValue({
      total_reading_time: 3600, // 1 hour in seconds
      pages_read: 25,
      percentage_complete: 25,
      streak_days: 3,
      reading_pace: 25, // pages per hour
    });
  });
  
  it('renders the widget correctly', async () => {
    // Arrange & Act
    render(
      <ReadingProgressWidget
        userId="user-123"
        bookId="book-456"
        currentPage={25}
        totalPages={100}
      />
    );
    
    // Assert
    expect(screen.getByText(/reading progress/i)).toBeInTheDocument();
    
    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText(/25% complete/i)).toBeInTheDocument();
      expect(screen.getByText(/page 25 of 100/i)).toBeInTheDocument();
    });
  });
  
  it('toggles expanded state when clicked', async () => {
    // Arrange
    const handleToggle = jest.fn();
    
    render(
      <ReadingProgressWidget
        userId="user-123"
        bookId="book-456"
        currentPage={25}
        totalPages={100}
        expanded={false}
        onToggleExpand={handleToggle}
      />
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/25% complete/i)).toBeInTheDocument();
    });
    
    // Act - Click the expand button
    fireEvent.click(screen.getByRole('button'));
    
    // Assert
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
  
  it('displays loading state while fetching stats', () => {
    // Arrange - Mock a delayed response
    (statisticsService.getBasicReadingStats as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(null), 100))
    );
    
    // Act
    render(
      <ReadingProgressWidget
        userId="user-123"
        bookId="book-456"
        currentPage={25}
        totalPages={100}
        expanded={true}
      />
    );
    
    // Assert
    expect(screen.getByText(/loading statistics/i)).toBeInTheDocument();
  });
  
  it('displays fallback message when no stats are available', async () => {
    // Arrange - Mock null response
    (statisticsService.getBasicReadingStats as jest.Mock).mockResolvedValue(null);
    
    // Act
    render(
      <ReadingProgressWidget
        userId="user-123"
        bookId="book-456"
        currentPage={25}
        totalPages={100}
        expanded={true}
      />
    );
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/start reading to see your statistics/i)).toBeInTheDocument();
    });
  });
  
  it('displays reading stats when expanded', async () => {
    // Arrange
    render(
      <ReadingProgressWidget
        userId="user-123"
        bookId="book-456"
        currentPage={25}
        totalPages={100}
        expanded={true}
      />
    );
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/1 hr/i)).toBeInTheDocument(); // 3600 seconds = 1 hour
      expect(screen.getByText(/25 pages/i)).toBeInTheDocument();
      expect(screen.getByText(/3 day streak/i)).toBeInTheDocument();
      expect(screen.getByText(/25 pages\/hr/i)).toBeInTheDocument();
    });
  });
  
  it('formats time correctly', async () => {
    // Arrange - Mock different reading times
    (statisticsService.getBasicReadingStats as jest.Mock).mockResolvedValue({
      total_reading_time: 5400, // 1 hour 30 minutes
      pages_read: 25,
      percentage_complete: 25,
    });
    
    // Act
    render(
      <ReadingProgressWidget
        userId="user-123"
        bookId="book-456"
        currentPage={25}
        totalPages={100}
        expanded={true}
      />
    );
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/1 hr 30 min/i)).toBeInTheDocument();
    });
  });
});
