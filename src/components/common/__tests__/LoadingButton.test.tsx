// src/components/common/__tests__/LoadingButton.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoadingButton from '../LoadingButton';
import theme from '../../../theme/theme';

// Wrap component with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('LoadingButton', () => {
  it('renders correctly with default props', () => {
    // Arrange & Act
    renderWithTheme(<LoadingButton>Click Me</LoadingButton>);
    
    // Assert
    expect(screen.getByText('Click Me')).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
  
  it('renders in loading state', () => {
    // Arrange & Act
    renderWithTheme(
      <LoadingButton loading loadingText="Loading...">
        Click Me
      </LoadingButton>
    );
    
    // Assert
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Click Me')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  it('renders in success state', () => {
    // Arrange & Act
    renderWithTheme(
      <LoadingButton success successIndicator={<CheckCircleIcon data-testid="success-icon" />}>
        Click Me
      </LoadingButton>
    );
    
    // Assert
    expect(screen.getByText('Click Me')).toBeInTheDocument();
    expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('calls onClick handler when clicked', () => {
    // Arrange
    const handleClick = jest.fn();
    renderWithTheme(<LoadingButton onClick={handleClick}>Click Me</LoadingButton>);
    
    // Act
    fireEvent.click(screen.getByText('Click Me'));
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClick handler when loading', () => {
    // Arrange
    const handleClick = jest.fn();
    renderWithTheme(
      <LoadingButton loading onClick={handleClick}>
        Click Me
      </LoadingButton>
    );
    
    // Act
    fireEvent.click(screen.getByRole('button'));
    
    // Assert
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('does not call onClick handler when in success state', () => {
    // Arrange
    const handleClick = jest.fn();
    renderWithTheme(
      <LoadingButton success onClick={handleClick}>
        Click Me
      </LoadingButton>
    );
    
    // Act
    fireEvent.click(screen.getByRole('button'));
    
    // Assert
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('renders with custom loading indicator', () => {
    // Arrange & Act
    renderWithTheme(
      <LoadingButton
        loading
        loadingIndicator={<div data-testid="custom-loader">Custom Loader</div>}
      >
        Click Me
      </LoadingButton>
    );
    
    // Assert
    expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
  
  it('renders with different loading positions', () => {
    // Test start position
    const { unmount } = renderWithTheme(
      <LoadingButton loading loadingPosition="start">
        Click Me
      </LoadingButton>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    unmount();
    
    // Test end position
    renderWithTheme(
      <LoadingButton loading loadingPosition="end">
        Click Me
      </LoadingButton>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
