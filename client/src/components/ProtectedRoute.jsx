import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Alert, Button } from '@mui/material';
import { Lock as LockIcon, Home as HomeIcon, Email as EmailIcon } from '@mui/icons-material';
import useUserStore from '../store/useUserStore';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['user', 'admin', 'teacher'],
  requireEmailVerification = true 
}) => {
  const { user, loading } = useUserStore();
  const location = useLocation();

  // Show loading state while authentication is being checked
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
        <Typography>Checking authentication...</Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification for critical actions
  if (requireEmailVerification && !user.emailVerified) {
    // Allow access to email verification page itself
    if (location.pathname === '/verify-email') {
      return children;
    }
    
    // For critical operations (project creation, admin actions), require verification
    const criticalPaths = ['/project', '/admin'];
    const isCriticalPath = criticalPaths.some(path => location.pathname.startsWith(path));
    
    if (isCriticalPath) {
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
          <EmailIcon sx={{ fontSize: 64, color: 'warning.main' }} />
          <Typography variant="h4" color="warning.main" gutterBottom>
            Email Verification Required
          </Typography>
          <Alert severity="warning" sx={{ maxWidth: 500, textAlign: 'center' }}>
            You need to verify your email address before accessing this feature. 
            Please check your inbox for a verification link.
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            <Button 
              variant="contained" 
              startIcon={<EmailIcon />}
              onClick={() => window.location.href = `/verify-email?email=${user.email}`}
            >
              Verify Email
            </Button>
          </Box>
        </Box>
      );
    }
  }

  // Check if user has required role
  const userRole = user.role || 'user';
  if (!allowedRoles.includes(userRole)) {
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
        <LockIcon sx={{ fontSize: 64, color: 'error.main' }} />
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Alert severity="warning" sx={{ maxWidth: 400 }}>
          You don't have permission to access this page. 
          Required roles: {allowedRoles.join(', ')}. 
          Your role: {userRole}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<HomeIcon />}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
