/**
 * Utility functions for date formatting to replace date-fns dependency
 */

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 * @param date The date to format
 * @param options Additional options
 * @returns A string representing the relative time
 */
export function formatRelativeTime(date: Date | string | number): string {
  try {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    
    // Convert to seconds, minutes, hours, days
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffYears > 0) {
      return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
    } else if (diffMonths > 0) {
      return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    } else if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'just now';
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date using Intl.DateTimeFormat
 * @param date The date to format
 * @param options Intl.DateTimeFormat options
 * @returns A formatted date string
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  try {
    const dateObj = new Date(date);
    // Provide default options or use what's passed
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date and time using Intl.DateTimeFormat
 * @param date The date to format
 * @param options Intl.DateTimeFormat options
 * @returns A formatted date and time string
 */
export function formatDateTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  try {
    const dateObj = new Date(date);
    // Provide default options or use what's passed
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return 'Invalid date';
  }
}
