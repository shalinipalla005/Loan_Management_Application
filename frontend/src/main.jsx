import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4682A9', // Deep blue
      light: '#91C8E4', // Soft blue
      dark: '#749BC2', // Muted blue
      contrastText: '#FFFBDE', // Cream for text on primary
    },
    secondary: {
      main: '#749BC2',
      light: '#91C8E4',
      dark: '#4682A9',
      contrastText: '#FFFBDE',
    },
    background: {
      default: '#FFFBDE', // Cream
      paper: '#FFFFFF',
    },
    accent: {
      main: '#91C8E4',
      dark: '#749BC2',
    },
    text: {
      primary: '#222',
      secondary: '#4682A9',
    },
  },
  typography: {
    fontFamily: 'Avenir, Helvetica, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
