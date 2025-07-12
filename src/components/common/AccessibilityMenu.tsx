// src/components/common/AccessibilityMenu.tsx
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import AccessibilityIcon from '@mui/icons-material/Accessibility';

// Define accessibility settings interface
export interface AccessibilitySettings {
  fontSize: number;
  lineHeight: number;
  contrast: 'normal' | 'high';
  reducedMotion: boolean;
  dyslexicFont: boolean;
}

// Default settings
const defaultSettings: AccessibilitySettings = {
  fontSize: 100, // percentage
  lineHeight: 1.5,
  contrast: 'normal',
  reducedMotion: false,
  dyslexicFont: false
};

// Context for accessibility settings
export const AccessibilityContext = React.createContext<{
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
}>({
  settings: defaultSettings,
  updateSettings: () => {}
});

// Hook to use accessibility settings
export const useAccessibility = () => React.useContext(AccessibilityContext);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Try to load from localStorage
    const savedSettings = localStorage.getItem('accessibility_settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });
  
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Save to localStorage
    localStorage.setItem('accessibility_settings', JSON.stringify(updated));
    
    // Apply settings to document
    applySettingsToDocument(updated);
  };
  
  // Apply settings on initial render
  React.useEffect(() => {
    applySettingsToDocument(settings);
  }, []);
  
  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Function to apply settings to document
const applySettingsToDocument = (settings: AccessibilitySettings) => {
  // Font size
  document.documentElement.style.setProperty(
    '--base-font-size', 
    `${settings.fontSize}%`
  );
  
  // Line height
  document.documentElement.style.setProperty(
    '--base-line-height', 
    `${settings.lineHeight}`
  );
  
  // Contrast
  if (settings.contrast === 'high') {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
  
  // Reduced motion
  if (settings.reducedMotion) {
    document.body.classList.add('reduced-motion');
  } else {
    document.body.classList.remove('reduced-motion');
  }
  
  // Dyslexic font
  if (settings.dyslexicFont) {
    document.body.classList.add('dyslexic-font');
  } else {
    document.body.classList.remove('dyslexic-font');
  }
};

export const AccessibilityMenu: React.FC = () => {
  const { settings, updateSettings } = useAccessibility();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleFontSizeChange = (_event: any, value: number | number[]) => {
    updateSettings({ fontSize: value as number });
  };
  
  const handleLineHeightChange = (_event: any, value: number | number[]) => {
    updateSettings({ lineHeight: value as number });
  };
  
  const handleContrastChange = () => {
    updateSettings({ 
      contrast: settings.contrast === 'normal' ? 'high' : 'normal' 
    });
  };
  
  const handleReducedMotionChange = () => {
    updateSettings({ reducedMotion: !settings.reducedMotion });
  };
  
  const handleDyslexicFontChange = () => {
    updateSettings({ dyslexicFont: !settings.dyslexicFont });
  };
  
  return (
    <>
      <IconButton 
        aria-label="Accessibility settings" 
        onClick={handleClick}
        color="inherit"
      >
        <AccessibilityIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 320, maxWidth: '100%', p: 2 }
        }}
      >
        <Typography variant="h6" gutterBottom>
          Accessibility Settings
        </Typography>
        
        <Typography id="font-size-slider" gutterBottom>
          Font Size: {settings.fontSize}%
        </Typography>
        <Slider
          value={settings.fontSize}
          onChange={handleFontSizeChange}
          aria-labelledby="font-size-slider"
          min={50}
          max={200}
          step={10}
          valueLabelDisplay="auto"
          sx={{ mb: 3 }}
        />
        
        <Typography id="line-height-slider" gutterBottom>
          Line Height: {settings.lineHeight}
        </Typography>
        <Slider
          value={settings.lineHeight}
          onChange={handleLineHeightChange}
          aria-labelledby="line-height-slider"
          min={1}
          max={3}
          step={0.1}
          valueLabelDisplay="auto"
          sx={{ mb: 3 }}
        />
        
        <Divider sx={{ my: 2 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.contrast === 'high'}
              onChange={handleContrastChange}
            />
          }
          label="High Contrast"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.reducedMotion}
              onChange={handleReducedMotionChange}
            />
          }
          label="Reduced Motion"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.dyslexicFont}
              onChange={handleDyslexicFontChange}
            />
          }
          label="Dyslexic-Friendly Font"
        />
      </Menu>
    </>
  );
};

export default AccessibilityMenu;
