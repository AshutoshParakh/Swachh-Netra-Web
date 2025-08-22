// Protected route component for admin-only access
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { currentUser, userData, loading, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Verifying admin access...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser || !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check specific permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
        p={3}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          You don't have the required permission to access this page.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Required permission: {requiredPermission}
        </Typography>
      </Box>
    );
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;
