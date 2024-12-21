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
  Container,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { generateKeyPair } from '../utils/encryption';

const steps = ['Account Details', 'Security Setup'];

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateStep1 = () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (username.length < 3 || username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) {
      return;
    }

    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeStep === 0) {
      handleNext();
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Generate encryption keys
      const { publicKey, privateKey } = await generateKeyPair();

      // Register user
      const response = await axios.post(
        config.getApiUrl('auth/register'),
        {
          username,
          email,
          password,
          publicKey
        }
      );

      const { token, userId } = response.data;

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);
      localStorage.setItem('publicKey', publicKey);
      localStorage.setItem('privateKey', privateKey);

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.status === 400) {
        setError(error.response.data.details || 'Invalid registration data');
        if (error.response.data.details?.includes('username')) {
          setActiveStep(0);
        }
      } else {
        setError('Error creating account. Please try again.');
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
            Create Account
          </Typography>

          <Stepper 
            activeStep={activeStep} 
            sx={{ width: '100%', mb: 4 }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

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
            {activeStep === 0 ? (
              <>
                <TextField
                  label="Username"
                  fullWidth
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                  autoComplete="username"
                  helperText="Letters, numbers, and underscores only"
                />

                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
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
                  autoComplete="new-password"
                  helperText="At least 8 characters"
                />

                <TextField
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                />
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Security Setup
                </Typography>
                <Typography color="text.secondary" paragraph>
                  We're generating your secure encryption keys...
                </Typography>
                <Typography color="text.secondary" paragraph>
                  This will enable end-to-end encryption for your messages.
                </Typography>
                {isLoading && (
                  <CircularProgress sx={{ mt: 2 }} />
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : activeStep === steps.length - 1 ? (
                  'Create Account'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>

            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                gap: 0.5,
                mt: 2
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Already have an account?
              </Typography>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                underline="hover"
              >
                Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
