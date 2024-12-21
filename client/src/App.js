import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// Components
import Chat from './components/Chat';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              <Register />
            } 
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />

          {/* Catch all route */}
          <Route 
            path="*" 
            element={
              <Navigate to="/" replace />
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
