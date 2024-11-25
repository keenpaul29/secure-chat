import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

const INACTIVITY_TIMEOUT = 5* 60 * 1000; // 5 minute in milliseconds

const AutoLogout = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      // Only set timer if user is logged in
      if (localStorage.getItem('token')) {
        timeoutId = setTimeout(() => {
          // Clear all auth data
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('userId');
          localStorage.removeItem('privateKey');
          
          // Redirect to login
          navigate('/login');
          alert('You have been logged out due to inactivity');
        }, INACTIVITY_TIMEOUT);
      }
    };

    // Reset timer on any user activity
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activities.forEach(activity => {
      document.addEventListener(activity, resetTimer);
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activities.forEach(activity => {
        document.removeEventListener(activity, resetTimer);
      });
    };
  }, [navigate]);

  return null;
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AutoLogout />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
