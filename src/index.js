import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import App from './App';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e4d2b', // Darker green for better logo visibility
      light: '#2d7d4a',
      dark: '#0f3d1f',
    },
    secondary: {
      main: '#d32f2f', // Darker red for better contrast
      light: '#ef5350',
      dark: '#c62828',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root')
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000, // Reduced from 4000ms to 3000ms (3 seconds)
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#1e4d2b',
              },
            },
            error: {
              style: {
                background: '#d32f2f',
              },
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
