// src/components/common/EnhancedCard.tsx
import React from 'react';
import {
  Card,
  CardProps,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Box,
  IconButton,
  Divider,
  useTheme,
  Tooltip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { TRANSITIONS } from '../../theme/theme';
import TooltipMenu, { TooltipMenuItem } from './TooltipMenu';

interface EnhancedCardProps extends Omit<CardProps, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  menuItems?: TooltipMenuItem[];
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  footerDivider?: boolean;
  headerDivider?: boolean;
  noPadding?: boolean;
  hoverEffect?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  minHeight?: number | string;
  maxHeight?: number | string;
  scrollable?: boolean;
}

/**
 * Enhanced card component with consistent styling and animations
 */
const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  actions,
  menuItems,
  headerAction,
  footer,
  footerDivider = true,
  headerDivider = false,
  noPadding = false,
  hoverEffect = true,
  clickable = false,
  onClick,
  minHeight,
  maxHeight,
  scrollable = false,
  className,
  ...props
}) => {
  const theme = useTheme();
  
  // Render header
  const renderHeader = () => {
    if (!title && !subtitle && !icon && !menuItems && !headerAction) {
      return null;
    }
    
    return (
      <>
        <CardHeader
          title={
            title && (
              <Typography variant="h6" component="div">
                {title}
              </Typography>
            )
          }
          subheader={subtitle}
          avatar={icon}
          action={
            headerAction || (menuItems && menuItems.length > 0 ? (
              <TooltipMenu
                icon={<MoreVertIcon />}
                tooltip="Options"
                items={menuItems}
                size="small"
              />
            ) : null)
          }
          sx={{ pb: headerDivider ? 1 : undefined }}
        />
        
        {headerDivider && <Divider />}
      </>
    );
  };
  
  // Render content
  const renderContent = () => {
    if (!children) {
      return null;
    }
    
    return (
      <CardContent
        sx={{
          p: noPadding ? 0 : 2,
          '&:last-child': { pb: noPadding ? 0 : 2 },
          overflow: scrollable ? 'auto' : 'visible',
          maxHeight: scrollable ? maxHeight : undefined,
        }}
      >
        {children}
      </CardContent>
    );
  };
  
  // Render footer
  const renderFooter = () => {
    if (!actions && !footer) {
      return null;
    }
    
    return (
      <>
        {footerDivider && <Divider />}
        <CardActions sx={{ p: 2 }}>
          {actions || footer}
        </CardActions>
      </>
    );
  };
  
  return (
    <Card
      {...props}
      className={`${className || ''} ${hoverEffect ? 'hover-lift' : ''}`}
      onClick={clickable || onClick ? onClick : undefined}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        transition: `all ${TRANSITIONS.MEDIUM}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        minHeight,
        maxHeight,
        cursor: (clickable || onClick) ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        ...props.sx,
      }}
    >
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </Card>
  );
};

export default EnhancedCard;
