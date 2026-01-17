/**
 * Theme configuration for styled-components
 * Supports light and dark modes
 */

// Light theme (current default)
export const lightTheme = {
  // Primary colors
  colors: {
    primary: '#594af1',
    primaryHover: 'linear-gradient(0deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), #594af1',
    
    // Background colors
    background: '#edeff2',
    backgroundWhite: '#ffffff',
    backgroundCard: '#ffffff',
    backgroundDisabled: 'rgba(0, 0, 0, 0.05)',
    backgroundLilac: 'rgba(249, 250, 252, 1)',
    
    // Text colors
    textPrimary: 'rgba(0, 0, 0, 0.85)',
    textSecondary: 'rgba(0, 0, 0, 0.5)',
    textTertiary: 'rgba(0, 0, 0, 0.3)',
    textWhite: '#ffffff',
    textBlack: '#000000',
    textInput: '#00142a',
    
    // Border colors
    borderLight: 'rgba(0, 0, 0, 0.1)',
    borderMedium: 'rgba(0, 0, 0, 0.15)',
    borderFocus: '#594af1',
    
    // Status colors
    success: '#0db27c',
    error: '#d65a5a',
    warning: '#e4b200',
    
    // Specific component colors
    buttonDisabled: 'rgba(0, 0, 0, 0.1)',
    inputCaret: '#594af1',
    inputPlaceholder: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Typography
  typography: {
    fontSizeTitleBig: '24px',
    fontSizeTitleBig1: '20px',
    fontSizeTitle: '18px',
    fontSizeTitleSmall: '16px',
    fontSizeContent: '14px',
    fontSizeDesc: '12px',
    fontSizeDescSmall: '12px',
    
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightSemiBold: '600',
    fontWeightBold: '700',
    
    lineHeightTitle: '29px',
    lineHeightContent: '24px',
    lineHeightDesc: '17px',
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  
  // Border radius
  borderRadius: {
    small: '6px',
    medium: '12px',
    large: '24px',
    round: '50%',
  },
  
  // Shadows
  shadows: {
    card: '0px 0px 20px rgba(0, 0, 0, 0.05)',
  },
  
  // App dimensions
  dimensions: {
    appWidth: '375px',
    appHeight: '600px',
    modalWidth: '290px',
  },
};

// Dark theme
export const darkTheme = {
  colors: {
    primary: '#7c6ff5',
    primaryHover: 'linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #7c6ff5',
    
    // Background colors
    background: '#1a1a2e',
    backgroundWhite: '#16213e',
    backgroundCard: '#1f2940',
    backgroundDisabled: 'rgba(255, 255, 255, 0.05)',
    backgroundLilac: '#0f0f23',
    
    // Text colors
    textPrimary: 'rgba(255, 255, 255, 0.9)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textTertiary: 'rgba(255, 255, 255, 0.4)',
    textWhite: '#ffffff',
    textBlack: '#ffffff',
    textInput: '#e8e8e8',
    
    // Border colors
    borderLight: 'rgba(255, 255, 255, 0.1)',
    borderMedium: 'rgba(255, 255, 255, 0.15)',
    borderFocus: '#7c6ff5',
    
    // Status colors
    success: '#2ed573',
    error: '#ff6b6b',
    warning: '#ffd32a',
    
    // Specific component colors
    buttonDisabled: 'rgba(255, 255, 255, 0.1)',
    inputCaret: '#7c6ff5',
    inputPlaceholder: 'rgba(255, 255, 255, 0.4)',
  },
  
  // Typography (same as light)
  typography: {
    fontSizeTitleBig: '24px',
    fontSizeTitleBig1: '20px',
    fontSizeTitle: '18px',
    fontSizeTitleSmall: '16px',
    fontSizeContent: '14px',
    fontSizeDesc: '12px',
    fontSizeDescSmall: '12px',
    
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightSemiBold: '600',
    fontWeightBold: '700',
    
    lineHeightTitle: '29px',
    lineHeightContent: '24px',
    lineHeightDesc: '17px',
  },
  
  // Spacing (same as light)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  
  // Border radius (same as light)
  borderRadius: {
    small: '6px',
    medium: '12px',
    large: '24px',
    round: '50%',
  },
  
  // Shadows
  shadows: {
    card: '0px 0px 20px rgba(0, 0, 0, 0.3)',
  },
  
  // App dimensions (same as light)
  dimensions: {
    appWidth: '375px',
    appHeight: '600px',
    modalWidth: '290px',
  },
};

// Default export
export default lightTheme;
