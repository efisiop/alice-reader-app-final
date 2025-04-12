# Service Hooks Migration Guide

This guide provides instructions for migrating existing components to use the new service hooks system in the Alice Reader app.

## Overview

The Alice Reader app has been refactored to use a Service Registry pattern with React hooks for accessing services. This approach resolves circular dependencies, improves code maintainability, and provides better error handling and loading states.

## Benefits of Migration

- **Simplified Service Access**: Use hooks to access services without manual initialization
- **Automatic Loading States**: Get loading states for free with the hooks
- **Consistent Error Handling**: Get error states and standardized error handling
- **Dependency Management**: Services are initialized in the correct order based on dependencies
- **Testability**: Easier to mock services for testing

## Migration Steps

### 1. Identify Direct Service Imports

Look for components that directly import services:

```typescript
// Before
import bookService from '../../services/bookService';
import { getBookDetails } from '../../services/bookService';
```

### 2. Replace with Service Hooks

Replace direct imports with the appropriate service hook:

```typescript
// After
import { useBookService } from '../../hooks/useService';
```

### 3. Update Component Implementation

Update the component to use the service hook:

```typescript
// Before
function BookDetails({ bookId }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    bookService.getBookDetails(bookId)
      .then(data => {
        setBook(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [bookId]);
  
  // Component implementation
}
```

```typescript
// After
function BookDetails({ bookId }) {
  const { service: bookService, loading: serviceLoading, error: serviceError } = useBookService();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!bookService) return;
    
    setLoading(true);
    bookService.getBookDetails(bookId)
      .then(data => {
        setBook(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [bookService, bookId]);
  
  // Handle service loading and errors
  if (serviceLoading || loading) {
    return <LoadingIndicator />;
  }
  
  if (serviceError) {
    return <ErrorDisplay error={serviceError} />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  // Component implementation
}
```

### 4. Handle Loading and Error States

Make sure to handle both service loading/errors and operation loading/errors:

```typescript
// Combined loading state
const isLoading = serviceLoading || loading;

// Combined error state
const errorMessage = serviceError?.message || error;
```

### 5. Update Service Method Calls

Update service method calls to check for service availability:

```typescript
// Before
const handleSave = async () => {
  try {
    await bookService.saveBookmark(bookId, page);
    // Success handling
  } catch (err) {
    // Error handling
  }
};
```

```typescript
// After
const handleSave = async () => {
  if (!bookService) return;
  
  try {
    await bookService.saveBookmark(bookId, page);
    // Success handling
  } catch (err) {
    // Error handling
  }
};
```

## Example Migration

### Before

```typescript
import React, { useState, useEffect } from 'react';
import bookService from '../../services/bookService';

function BookReader({ bookId }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    bookService.getBookDetails(bookId)
      .then(data => {
        setBook(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [bookId]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div>
      <h1>{book.title}</h1>
      <p>By {book.author}</p>
      <div>{book.content}</div>
    </div>
  );
}

export default BookReader;
```

### After

```typescript
import React, { useState, useEffect } from 'react';
import { useBookService } from '../../hooks/useService';

function BookReader({ bookId }) {
  const { service: bookService, loading: serviceLoading, error: serviceError } = useBookService();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!bookService) return;
    
    setLoading(true);
    bookService.getBookDetails(bookId)
      .then(data => {
        setBook(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [bookService, bookId]);
  
  if (serviceLoading || loading) {
    return <div>Loading...</div>;
  }
  
  if (serviceError) {
    return <div>Service Error: {serviceError.message}</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div>
      <h1>{book.title}</h1>
      <p>By {book.author}</p>
      <div>{book.content}</div>
    </div>
  );
}

export default BookReader;
```

## Common Patterns

### Combining Multiple Services

```typescript
function ReaderDashboard({ userId }) {
  const { service: bookService, loading: bookLoading, error: bookError } = useBookService();
  const { service: statsService, loading: statsLoading, error: statsError } = useStatisticsService();
  
  // Combined loading and error states
  const isLoading = bookLoading || statsLoading;
  const error = bookError || statsError;
  
  // Component implementation
}
```

### Creating Custom Hooks for Complex Logic

```typescript
function useBookWithStats(bookId, userId) {
  const { service: bookService, loading: bookLoading, error: bookError } = useBookService();
  const { service: statsService, loading: statsLoading, error: statsError } = useStatisticsService();
  
  const [book, setBook] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!bookService || !statsService) return;
    
    // Load book and stats
    Promise.all([
      bookService.getBookDetails(bookId),
      statsService.getReadingStats(userId, bookId)
    ])
      .then(([bookData, statsData]) => {
        setBook(bookData);
        setStats(statsData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [bookService, statsService, bookId, userId]);
  
  return {
    book,
    stats,
    loading: bookLoading || statsLoading || loading,
    error: bookError || statsError || error
  };
}
```

## Testing Components with Service Hooks

When testing components that use service hooks, you'll need to mock the hooks:

```typescript
// Mock the useBookService hook
jest.mock('../../hooks/useService', () => ({
  useBookService: () => ({
    service: {
      getBookDetails: jest.fn().mockResolvedValue({
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author'
      })
    },
    loading: false,
    error: null
  })
}));

// Test the component
test('renders book details', async () => {
  render(<BookReader bookId="test-book" />);
  
  // Wait for the component to render
  await screen.findByText('Test Book');
  
  // Assert that the book details are displayed
  expect(screen.getByText('Test Book')).toBeInTheDocument();
  expect(screen.getByText('By Test Author')).toBeInTheDocument();
});
```

## Troubleshooting

### Service is undefined

If a service is undefined, make sure:

1. The service is properly registered in the registry
2. The service is properly initialized
3. You're using the correct service name in the hook
4. You're checking for service availability before using it

### Loading state never resolves

If the loading state never resolves, check:

1. The service initialization function is properly implemented
2. There are no circular dependencies
3. The service is properly registered in the registry
4. The component is properly handling the loading state

### Error handling

If errors are not properly handled, make sure:

1. You're checking for both service errors and operation errors
2. You're displaying error messages to the user
3. You're providing retry mechanisms for failed operations

## Conclusion

Migrating to the new service hooks system will improve the maintainability and reliability of the Alice Reader app. By following this guide, you can ensure a smooth transition to the new system.
