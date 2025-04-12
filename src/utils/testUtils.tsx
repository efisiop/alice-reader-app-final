// src/utils/testUtils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ConsultantProvider } from '../contexts/ConsultantContext';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import theme from '../theme/theme';
import { mockSupabaseClient } from '../mocks/supabaseMock';

// Mock the supabase client
jest.mock('../services/supabaseClient', () => ({
  supabase: mockSupabaseClient,
}));

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...renderOptions }: CustomRenderOptions = {}
) {
  // Set the initial route
  window.history.pushState({}, 'Test page', route);
  
  // Create a wrapper with all providers
  const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <ConsultantProvider>
            <FeedbackProvider>
              <HashRouter>{children}</HashRouter>
            </FeedbackProvider>
          </ConsultantProvider>
        </AuthProvider>
      </ThemeProvider>
    );
  };
  
  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
}

// Create a function to mock authenticated user
export function mockAuthenticatedUser(isConsultant = false) {
  // Mock the useAuth hook
  jest.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
      },
      isAuthenticated: true,
      isConsultant,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      verifyBook: jest.fn(),
    }),
  }));
}

// Create a function to mock unauthenticated user
export function mockUnauthenticatedUser() {
  // Mock the useAuth hook
  jest.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
      user: null,
      isAuthenticated: false,
      isConsultant: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      verifyBook: jest.fn(),
    }),
  }));
}

// Export testing utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
