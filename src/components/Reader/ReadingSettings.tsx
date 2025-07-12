// src/components/Reader/ReadingSettings.tsx
import React from 'react';
import { Box, Typography, Slider, ToggleButtonGroup, ToggleButton, Divider } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FormatLineSpacingIcon from '@mui/icons-material/FormatLineSpacing';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

export type ThemeOption = 'light' | 'dark' | 'sepia';

interface ReadingSettingsProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  lineSpacing: number;
  onLineSpacingChange: (spacing: number) => void;
}

const ReadingSettings: React.FC<ReadingSettingsProps> = ({
  fontSize,
  onFontSizeChange,
  theme,
  onThemeChange,
  lineSpacing,
  onLineSpacingChange
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Reading Settings
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography id="font-size-slider" gutterBottom>
        Font Size
      </Typography>
      <Slider
        value={fontSize}
        onChange={(_, newValue) => onFontSizeChange(newValue as number)}
        aria-labelledby="font-size-slider"
        min={12}
        max={24}
        step={1}
        marks
        valueLabelDisplay="auto"
        sx={{ mb: 3 }}
      />
      
      <Typography gutterBottom sx={{ mt: 2 }}>
        Theme
      </Typography>
      <ToggleButtonGroup
        value={theme}
        exclusive
        onChange={(_, newTheme) => newTheme && onThemeChange(newTheme)}
        aria-label="text theme"
        fullWidth
        sx={{ mb: 3 }}
      >
        <ToggleButton value="light" aria-label="light theme">
          <Brightness7Icon sx={{ mr: 1 }} /> Light
        </ToggleButton>
        <ToggleButton value="dark" aria-label="dark theme">
          <Brightness4Icon sx={{ mr: 1 }} /> Dark
        </ToggleButton>
        <ToggleButton value="sepia" aria-label="sepia theme">
          <AutoStoriesIcon sx={{ mr: 1 }} /> Sepia
        </ToggleButton>
      </ToggleButtonGroup>
      
      <Typography id="line-spacing-slider" gutterBottom sx={{ mt: 2 }}>
        Line Spacing
      </Typography>
      <Slider
        value={lineSpacing}
        onChange={(_, newValue) => onLineSpacingChange(newValue as number)}
        aria-labelledby="line-spacing-slider"
        min={1.2}
        max={2.2}
        step={0.1}
        marks
        valueLabelDisplay="auto"
      />
    </Box>
  );
};

export default ReadingSettings;
