// Admin login page
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Security
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, resetPassword, currentUser, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      // Error is handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    try {
      setError(null);
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
      // Error is handled by AuthContext
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 450,
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <AdminPanelSettings
              sx={{
                fontSize: 60,
                color: 'primary.main',
                mb: 2
              }}
            />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Admin Portal
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Swachh Netra Management System
            </Typography>
          </Box>

          {/* Security Notice */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'warning.light',
              color: 'warning.contrastText',
              p: 2,
              borderRadius: 1,
              mb: 3
            }}
          >
            <Security sx={{ mr: 1 }} />
            <Typography variant="body2">
              Admin credentials required for access
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Reset Email Sent Alert */}
          {resetEmailSent && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Password reset email sent! Check your inbox.
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In as Admin'
              )}
            </Button>
          </form>

          <Divider sx={{ my: 2 }} />

          {/* Forgot Password */}
          <Box textAlign="center">
            <Link
              component="button"
              variant="body2"
              onClick={handleResetPassword}
              disabled={loading}
              sx={{ textDecoration: 'none' }}
            >
              Forgot your password?
            </Link>
          </Box>

          {/* Footer */}
          <Box textAlign="center" mt={3}>
            <Typography variant="caption" color="text.secondary">
              Swachh Netra Admin Portal v1.0.0
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
