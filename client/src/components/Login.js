import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        config.getApiUrl('auth/login'),
        { email, password }
      );

      const { token, userId, username, publicKey } = response.data;

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);
      localStorage.setItem('publicKey', publicKey);

      // Redirect to intended page or home
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 423) {
        // Account locked
        setError(error.response.data.details || 'Account temporarily locked');
      } else if (error.response?.status === 401) {
        // Invalid credentials
        setError(
          error.response.data.details || 
          'Invalid email or password'
        );
      } else {
        setError('Error logging in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 3
        }}
      >
        <Paper 
          elevation={2}
          sx={{ 
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography 
            component="h1" 
            variant="h4" 
            sx={{ mb: 4 }}
          >
            Secure Chat
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, width: '100%' }}
            >
              {error}
            </Alert>
          )}

          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{ width: '100%' }}
          >
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoFocus
              autoComplete="email"
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Don't have an account?
              </Typography>
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                underline="hover"
              >
                Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
