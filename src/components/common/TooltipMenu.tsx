// src/components/common/TooltipMenu.tsx
import React, { useState } from 'react';
import {
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Paper,
  useTheme
} from '@mui/material';
import { TRANSITIONS } from '../../theme/theme';

export interface TooltipMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit';
}

interface TooltipMenuProps {
  icon: React.ReactNode;
  tooltip: string;
  items: TooltipMenuItem[];
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit' | 'default';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Tooltip menu component for compact UI actions
 */
const TooltipMenu: React.FC<TooltipMenuProps> = ({
  icon,
  tooltip,
  items,
  color = 'default',
  size = 'medium',
  disabled = false,
  placement = 'bottom',
  className
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  // Handle menu open
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    setAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Handle item click
  const handleItemClick = (onClick: () => void) => {
    handleClose();
    onClick();
  };
  
  return (
    <>
      <Tooltip title={tooltip} placement={placement} arrow>
        <span>
          <IconButton
            color={color}
            size={size}
            onClick={handleClick}
            disabled={disabled}
            className={className}
          >
            {icon}
          </IconButton>
        </span>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        transitionDuration={TRANSITIONS.MEDIUM}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            overflow: 'visible',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {items.map((item, index) => (
          <MenuItem
            key={index}
            onClick={() => handleItemClick(item.onClick)}
            disabled={item.disabled}
            divider={item.divider}
            sx={{
              py: 1,
              px: 2,
              ...(item.color && {
                color: theme.palette[item.color].main,
              }),
            }}
          >
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default TooltipMenu;
