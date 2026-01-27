/**
 * Theme Provider wrapper for the application
 * Provides theme context to all styled-components
 */
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { lightTheme, darkTheme } from './theme';

// Theme mode constants
export const THEME_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Context for theme mode switching
const ThemeModeContext = createContext({
  mode: THEME_MODE.LIGHT,
  toggleTheme: () => {},
  setThemeMode: (_newMode: string) => {},
});

// Hook to access theme mode
export const useThemeMode = () => useContext(ThemeModeContext);

// Theme Provider component
export const ThemeProvider = ({ children, initialMode = THEME_MODE.LIGHT }: { children: ReactNode; initialMode?: string }) => {
  const [mode, setMode] = useState(initialMode);

  const toggleTheme = useCallback(() => {
    setMode((prevMode) =>
      prevMode === THEME_MODE.LIGHT ? THEME_MODE.DARK : THEME_MODE.LIGHT
    );
  }, []);

  const setThemeMode = useCallback((newMode: string) => {
    if (newMode === THEME_MODE.LIGHT || newMode === THEME_MODE.DARK) {
      setMode(newMode);
    }
  }, []);

  const theme = useMemo(() => {
    return mode === THEME_MODE.LIGHT ? lightTheme : darkTheme;
  }, [mode]);

  const contextValue = useMemo(() => ({
    mode,
    toggleTheme,
    setThemeMode,
  }), [mode, toggleTheme, setThemeMode]);

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export default ThemeProvider;
