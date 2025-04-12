// src/components/common/__tests__/EnhancedCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import EnhancedCard from '../EnhancedCard';
import theme from '../../../theme/theme';

// Wrap component with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('EnhancedCard', () => {
  it('renders correctly with default props', () => {
    // Arrange & Act
    renderWithTheme(
      <EnhancedCard>
        <div data-testid="card-content">Card Content</div>
      </EnhancedCard>
    );
    
    // Assert
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
  
  it('renders with title and subtitle', () => {
    // Arrange & Act
    renderWithTheme(
      <EnhancedCard title="Card Title" subtitle="Card Subtitle">
        <div>Card Content</div>
      </EnhancedCard>
    );
    
    // Assert
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
  });
  
  it('renders with icon', () => {
    // Arrange & Act
    renderWithTheme(
      <EnhancedCard
        title="Card Title"
        icon={<InfoIcon data-testid="card-icon" />}
      >
        <div>Card Content</div>
      </EnhancedCard>
    );
    
    // Assert
    expect(screen.getByTestId('card-icon')).toBeInTheDocument();
  });
  
  it('renders with actions', () => {
    // Arrange & Act
    renderWithTheme(
      <EnhancedCard
        title="Card Title"
        actions={<button data-testid="action-button">Action</button>}
      >
        <div>Card Content</div>
      </EnhancedCard>
    );
    
    // Assert
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });
  
  it('calls onClick when clickable', () => {
    // Arrange
    const handleClick = jest.fn();
    
    // Act
    renderWithTheme(
      <EnhancedCard clickable onClick={handleClick}>
        <div>Card Content</div>
      </EnhancedCard>
    );
    
    // Assert
    const card = screen.getByText('Card Content').closest('.MuiPaper-root');
    expect(card).toHaveStyle('cursor: pointer');
    
    // Act
    if (card) {
      fireEvent.click(card);
    }
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('renders with header divider', () => {
    // Arrange & Act
    renderWithTheme(
      <EnhancedCard title="Card Title" headerDivider>
        <div>Card Content</div>
      </EnhancedCard>
    );
    
    // Assert
    const dividers = screen.getAllByRole('separator');
    expect(dividers.length).toBeGreaterThan(0);
  });
  
  it('renders with footer and footer divider', () => {
    // Arrange & Act
    renderWithTheme(
      <EnhancedCard
        title="Card Title"
        footer={<div data-testid="footer">Footer Content</div>}
        footerDivider
      >
        <div>Card Content</div>
      </EnhancedCard>
    );
    
    // Assert
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    const dividers = screen.getAllByRole('separator');
    expect(dividers.length).toBeGreaterThan(0);
  });
  
  it('renders with no padding when specified', () => {
    // Arrange & Act
    renderWithTheme(
      <EnhancedCard title="Card Title" noPadding>
        <div data-testid="content">Card Content</div>
      </EnhancedCard>
    );
    
    // Assert
    const content = screen.getByTestId('content').closest('.MuiCardContent-root');
    expect(content).toHaveStyle('padding: 0px');
  });
});
