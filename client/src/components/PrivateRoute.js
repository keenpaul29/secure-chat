import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import config from '../config';

const PrivateRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Verify token by making a request to /api/auth/me
        await axios.get(
          config.getApiUrl('auth/me'),
          config.getRequestConfig(token)
        );
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth verification failed:', error);
        
        // Clear storage if token is invalid
        if (error.response?.status === 401) {
          localStorage.clear();
        }
        
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return url
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  return children;
};

export default PrivateRoute;
