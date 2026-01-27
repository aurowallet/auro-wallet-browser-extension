import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      primaryHover: string;
      background: string;
      backgroundWhite: string;
      backgroundCard: string;
      backgroundDisabled: string;
      backgroundLilac: string;
      textPrimary: string;
      textSecondary: string;
      textTertiary: string;
      textWhite: string;
      textBlack: string;
      textInput: string;
      borderLight: string;
      borderMedium: string;
      borderFocus: string;
      success: string;
      error: string;
      warning: string;
      buttonDisabled: string;
      inputCaret: string;
      inputPlaceholder: string;
    };
    typography: {
      fontSizeTitleBig: string;
      fontSizeTitleBig1: string;
      fontSizeTitle: string;
      fontSizeTitleSmall: string;
      fontSizeContent: string;
      fontSizeDesc: string;
      fontSizeDescSmall: string;
      fontWeightNormal: string;
      fontWeightMedium: string;
      fontWeightSemiBold: string;
      fontWeightBold: string;
      lineHeightTitle: string;
      lineHeightContent: string;
      lineHeightDesc: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    borderRadius: {
      small: string;
      medium: string;
      large: string;
      round: string;
    };
    shadows: {
      card: string;
    };
    dimensions: {
      appWidth: string;
      appHeight: string;
      modalWidth: string;
    };
  }
}
