import { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();
export const useThemeMode = () => useContext(ThemeContext);

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'dark'
      ? {
          primary: { main: '#7C5CFC', light: '#9F85FD', dark: '#5A3BD9' },
          secondary: { main: '#00D9A6', light: '#33E1B8', dark: '#00B38A' },
          background: {
            default: '#0A0E1A',
            paper: '#111827',
          },
          text: { primary: '#F1F5F9', secondary: '#94A3B8' },
          divider: 'rgba(148, 163, 184, 0.08)',
          error: { main: '#FF5C6C' },
          warning: { main: '#FFB547' },
          success: { main: '#00D9A6' },
          info: { main: '#38BDF8' },
        }
      : {
          primary: { main: '#6C3FE8', light: '#8B6AEF', dark: '#4F1FD1' },
          secondary: { main: '#00C896', light: '#33D3AB', dark: '#00A87E' },
          background: {
            default: '#F4F6FB',
            paper: '#FFFFFF',
          },
          text: { primary: '#1E293B', secondary: '#64748B' },
          divider: 'rgba(100, 116, 139, 0.12)',
          error: { main: '#EF4444' },
          warning: { main: '#F59E0B' },
          success: { main: '#10B981' },
          info: { main: '#3B82F6' },
        }),
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.75rem' },
    body2: { color: mode === 'dark' ? '#94A3B8' : '#64748B' },
    button: { fontWeight: 600, letterSpacing: '0.03em' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          background: 'linear-gradient(135deg, #7C5CFC 0%, #6C3FE8 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #9F85FD 0%, #7C5CFC 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          ...(mode === 'dark' && {
            background: 'rgba(17, 24, 39, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.06)',
          }),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: mode === 'dark'
            ? '0 4px 30px rgba(0, 0, 0, 0.3)'
            : '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.04)',
          ...(mode === 'dark' && {
            background: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.06)',
          }),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 10,
          height: 28,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.06em',
          color: mode === 'dark' ? '#94A3B8' : '#64748B',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
  },
});

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');

  const toggleTheme = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
