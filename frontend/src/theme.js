import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#1976d2' : '#90caf9',
    },
    secondary: {
      main: mode === 'light' ? '#dc004e' : '#f48fb1',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"PT Sans", sans-serif',
    h1: {
      fontFamily: '"Cabin", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Cabin", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Cabin", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Cabin", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Cabin", sans-serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Cabin", sans-serif',
      fontWeight: 500,
    },
    button: {
      fontFamily: '"Cabin", sans-serif',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
}); 