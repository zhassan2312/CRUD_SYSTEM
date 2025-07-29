import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Alert, Button } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import useUserStore from '../store/useUserStore';

/**
 * Higher-Order Component for role-based access control
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - Configuration options
 * @param {string[]} options.allowedRoles - Array of allowed roles
 * @param {string} options.redirectTo - Redirect path for unauthorized users
 * @param {boolean} options.showError - Show error page instead of redirect
 * @param {string} options.errorMessage - Custom error message
 */
const withRoleBasedAccess = (WrappedComponent, options = {}) => {
  const {
    allowedRoles = ['user', 'admin', 'teacher'],
    redirectTo = '/',
    showError = true,
    errorMessage = 'You do not have permission to access this resource.'
  } = options;

  const RoleProtectedComponent = (props) => {
    const { user, loading } = useUserStore();

    // Show loading state
    if (loading) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '50vh' 
          }}
        >
          <Typography>Loading...</Typography>
        </Box>
      );
    }

    // Redirect to login if not authenticated
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Check role permission
    const userRole = user.role || 'user';
    const hasPermission = allowedRoles.includes(userRole);

    if (!hasPermission) {
      if (showError) {
        return (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '50vh',
              gap: 3,
              p: 3
            }}
          >
            <WarningIcon sx={{ fontSize: 64, color: 'warning.main' }} />
            <Typography variant="h5" gutterBottom>
              Access Restricted
            </Typography>
            <Alert severity="warning" sx={{ maxWidth: 400 }}>
              {errorMessage}
            </Alert>
            <Button 
              variant="contained" 
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </Box>
        );
      } else {
        return <Navigate to={redirectTo} replace />;
      }
    }

    // User has permission, render the wrapped component
    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  RoleProtectedComponent.displayName = `withRoleBasedAccess(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return RoleProtectedComponent;
};

export default withRoleBasedAccess;
