# Alice Reader App Testing Guide

This guide provides comprehensive instructions for testing the Alice Reader app, including setup, execution, and best practices.

## Table of Contents

1. [Testing Setup](#testing-setup)
2. [Running Tests](#running-tests)
3. [Writing Tests](#writing-tests)
4. [Test Data](#test-data)
5. [Mocking](#mocking)
6. [Continuous Integration](#continuous-integration)
7. [Troubleshooting](#troubleshooting)

## Testing Setup

### Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/efisiop/alice-reader-app.git
   cd alice-reader-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the test environment:
   ```bash
   cp .env.test.example .env.test
   ```

4. Edit `.env.test` with your test environment configuration.

### Test Database Setup

To set up the test database with sample data:

```bash
npm run test:setup
```

This script will:
1. Clear existing data from the test database
2. Generate sample test data
3. Insert the test data into the database

## Running Tests

### Unit Tests

Unit tests focus on testing individual components, functions, and modules in isolation.

```bash
npm run test:unit
```

### Integration Tests

Integration tests focus on testing the interaction between multiple components or modules.

```bash
npm run test:integration
```

### End-to-End Tests

End-to-end tests focus on testing the entire application from the user's perspective.

```bash
npm run test:e2e
```

### All Tests

Run all tests (unit, integration, and end-to-end).

```bash
npm run test:all
```

### Watch Mode

Run tests in watch mode to automatically re-run tests when files change.

```bash
npm run test:unit -- --watch
```

### Coverage

Generate a test coverage report.

```bash
npm run test:unit -- --coverage
```

The coverage report will be available in the `coverage` directory.

## Writing Tests

### Test File Structure

Tests should be organized in `__tests__` directories adjacent to the code they test.

```
src/
  components/
    Button/
      Button.tsx
      __tests__/
        Button.test.tsx
        Button.integration.tsx
  utils/
    formatDate.ts
    __tests__/
      formatDate.test.ts
```

### Naming Conventions

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.ts` or `*.integration.tsx`
- End-to-end tests: `*.e2e.ts` or `*.e2e.tsx`

### Test Structure

Tests should follow the Arrange-Act-Assert (AAA) pattern:

```typescript
describe('Component', () => {
  it('should do something', () => {
    // Arrange
    const props = { ... };
    
    // Act
    const result = someFunction(props);
    
    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

### Testing React Components

Use React Testing Library to test React components:

```typescript
import { render, screen, fireEvent } from '../../utils/testUtils';
import Button from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    // Arrange
    render(<Button>Click me</Button>);
    
    // Assert
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    // Act
    fireEvent.click(screen.getByText('Click me'));
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Hooks

Use React Testing Library's `renderHook` to test custom hooks:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import useCounter from '../useCounter';

describe('useCounter', () => {
  it('increments the count', () => {
    // Arrange
    const { result } = renderHook(() => useCounter());
    
    // Act
    act(() => {
      result.current.increment();
    });
    
    // Assert
    expect(result.current.count).toBe(1);
  });
});
```

### Testing Asynchronous Code

Use `async/await` to test asynchronous code:

```typescript
describe('fetchData', () => {
  it('fetches data successfully', async () => {
    // Arrange
    const mockData = { id: 1, name: 'Test' };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockData),
      ok: true,
    } as any);
    
    // Act
    const result = await fetchData();
    
    // Assert
    expect(result).toEqual(mockData);
  });
});
```

## Test Data

### Test Data Generator

Use the test data generator to create sample data for tests:

```typescript
import { generateUser, generateBook } from '../../utils/testDataGenerator';

describe('BookComponent', () => {
  it('renders book details', () => {
    // Arrange
    const book = generateBook();
    
    // Act
    render(<BookComponent book={book} />);
    
    // Assert
    expect(screen.getByText(book.title)).toBeInTheDocument();
  });
});
```

### Mock Data

Use mock data for tests that don't need to generate random data:

```typescript
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('UserProfile', () => {
  it('renders user profile', () => {
    // Arrange
    render(<UserProfile user={mockUser} />);
    
    // Assert
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});
```

## Mocking

### Mocking Functions

Use Jest's `jest.fn()` to mock functions:

```typescript
const mockFunction = jest.fn();
mockFunction.mockReturnValue('mocked value');
```

### Mocking Modules

Use Jest's `jest.mock()` to mock modules:

```typescript
jest.mock('../../services/api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'mocked data' }),
}));
```

### Mocking Supabase

Use the Supabase mock for tests:

```typescript
import { mockSupabaseClient } from '../../mocks/supabaseMock';

jest.mock('../../services/supabaseClient', () => ({
  supabase: mockSupabaseClient,
}));
```

### Mocking Context

Use the test utilities to mock context:

```typescript
import { renderWithProviders } from '../../utils/testUtils';

describe('Component', () => {
  it('renders with context', () => {
    // Arrange & Act
    renderWithProviders(<Component />);
    
    // Assert
    expect(screen.getByText('Context Value')).toBeInTheDocument();
  });
});
```

## Continuous Integration

The Alice Reader app uses GitHub Actions for continuous integration. The CI pipeline runs the following steps:

1. Install dependencies
2. Run linting
3. Run type checking
4. Run unit tests
5. Run integration tests
6. Generate coverage report
7. Build the application

The CI pipeline is configured in `.github/workflows/ci.yml`.

## Troubleshooting

### Common Issues

#### Tests Fail with "Cannot find module"

Make sure the module is installed and the import path is correct.

```bash
npm install
```

#### Tests Fail with "TypeError: Cannot read property 'X' of undefined"

Check that you're properly mocking dependencies and providing required props.

#### Tests Timeout

Increase the test timeout:

```typescript
jest.setTimeout(10000); // 10 seconds
```

#### Tests Fail with "Error: Not implemented: navigation"

Mock the navigation functions:

```typescript
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost/',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});
```

### Debugging Tests

To debug tests, add the `--debug` flag:

```bash
npm run test:unit -- --debug
```

You can also add `debugger` statements to your tests and run them with Node.js inspector:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open Chrome DevTools and connect to the Node.js inspector.

### Getting Help

If you're stuck, check the following resources:

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Supabase Documentation](https://supabase.io/docs)
- [GitHub Issues](https://github.com/efisiop/alice-reader-app/issues)
