// src/components/Auth/__tests__/LoginForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/testUtils';
import LoginForm from '../LoginForm';
import { useAuth } from '../../../contexts/AuthContext';
import { useFeedback } from '../../../contexts/FeedbackContext';

// Mock the auth context
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the feedback context
jest.mock('../../../contexts/FeedbackContext', () => ({
  useFeedback: jest.fn(),
}));

describe('LoginForm', () => {
  // Set up mocks before each test
  beforeEach(() => {
    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      login: jest.fn().mockResolvedValue({ success: true }),
      isAuthenticated: false,
    });
    
    // Mock useFeedback hook
    (useFeedback as jest.Mock).mockReturnValue({
      showSuccess: jest.fn(),
      showError: jest.fn(),
    });
  });
  
  it('renders the login form correctly', () => {
    // Arrange & Act
    render(<LoginForm />);
    
    // Assert
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  it('validates email and password fields', async () => {
    // Arrange
    render(<LoginForm />);
    
    // Act - Submit without filling fields
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
  
  it('validates email format', async () => {
    // Arrange
    render(<LoginForm />);
    
    // Act - Enter invalid email
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });
  
  it('calls login function with correct values on submit', async () => {
    // Arrange
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
    });
    
    render(<LoginForm />);
    
    // Act - Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
  
  it('shows loading state during login', async () => {
    // Arrange
    const mockLogin = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
    });
    
    render(<LoginForm />);
    
    // Act - Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert - Button should be in loading state
    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  it('shows error message on login failure', async () => {
    // Arrange
    const mockLogin = jest.fn().mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });
    
    const mockShowError = jest.fn();
    
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
    });
    
    (useFeedback as jest.Mock).mockReturnValue({
      showSuccess: jest.fn(),
      showError: mockShowError,
    });
    
    render(<LoginForm />);
    
    // Act - Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});
