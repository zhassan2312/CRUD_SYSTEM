import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Alert, Button, Chip } from '@mui/material';
import { 
  AdminPanelSettings as AdminIcon,
  School as TeacherIcon,
  Person as UserIcon,
  Security as SecurityIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import useUserStore from '../store/useUserStore';

// Role hierarchy: admin > teacher > user
const ROLE_HIERARCHY = {
  admin: 3,
  teacher: 2,
  user: 1
};

const ROLE_ICONS = {
  admin: <AdminIcon />,
  teacher: <TeacherIcon />,
  user: <UserIcon />
};

const ROLE_COLORS = {
  admin: 'error',
  teacher: 'warning',
  user: 'primary'
};

/**
 * RoleBasedRoute - Enhanced route protection with role hierarchy and email verification
 * @param {React.ReactNode} children - Components to render
 * @param {string[]} allowedRoles - Array of allowed roles
 * @param {number} minRoleLevel - Minimum role level required (1=user, 2=teacher, 3=admin)
 * @param {boolean} exact - Exact role match required
 * @param {boolean} requireEmailVerification - Require email verification
 * @param {string} redirectTo - Custom redirect path for unauthorized access
 */
const RoleBasedRoute = ({ 
  children, 
  allowedRoles = ['user', 'admin', 'teacher'],
  minRoleLevel = null,
  exact = false,
  requireEmailVerification = true,
  redirectTo = null
}) => {
  const { user, loading } = useUserStore();
  const location = useLocation();

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
        <Typography>Verifying permissions...</Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification for certain routes
  if (requireEmailVerification && !user.emailVerified) {
    // Allow access to email verification page itself
    if (location.pathname === '/verify-email') {
      return children;
    }
    
    // For admin routes and project creation, require verification
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
            minHeight: '60vh',
            gap: 3,
            p: 3,
            textAlign: 'center'
          }}
        >
          <SecurityIcon sx={{ fontSize: 80, color: 'warning.main' }} />
          
          <Typography variant="h4" color="warning.main" gutterBottom>
            Email Verification Required
          </Typography>
          
          <Alert severity="warning" sx={{ maxWidth: 500 }}>
            <Typography variant="body2">
              <strong>Email Verification Required</strong><br/>
              Your email address <strong>{user.email}</strong> must be verified 
              before accessing administrative features or creating projects.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            <Button 
              variant="contained" 
              onClick={() => window.location.href = `/verify-email?email=${user.email}`}
            >
              Verify Email
            </Button>
          </Box>
        </Box>
      );
    }
  }

  const userRole = user.role || 'user';
  const userRoleLevel = ROLE_HIERARCHY[userRole] || 1;

  // Check access based on role hierarchy
  let hasAccess = false;

  if (minRoleLevel) {
    // Check minimum role level
    hasAccess = userRoleLevel >= minRoleLevel;
  } else if (exact) {
    // Exact role match
    hasAccess = allowedRoles.includes(userRole);
  } else {
    // Default: check if user role is in allowed roles OR has higher hierarchy
    hasAccess = allowedRoles.includes(userRole) || 
                allowedRoles.some(role => userRoleLevel >= ROLE_HIERARCHY[role]);
  }

  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          gap: 3,
          p: 3,
          textAlign: 'center'
        }}
      >
        <SecurityIcon sx={{ fontSize: 80, color: 'error.main' }} />
        
        <Typography variant="h4" color="error" gutterBottom>
          Insufficient Permissions
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body1">Your Role:</Typography>
          <Chip 
            icon={ROLE_ICONS[userRole]} 
            label={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            color={ROLE_COLORS[userRole]}
            variant="outlined"
          />
        </Box>

        <Alert severity="warning" sx={{ maxWidth: 500 }}>
          <Typography variant="body2">
            <strong>Access Requirements:</strong><br/>
            {minRoleLevel ? (
              `Minimum Role Level: ${Object.keys(ROLE_HIERARCHY).find(
                key => ROLE_HIERARCHY[key] === minRoleLevel
              )?.toUpperCase() || 'Unknown'} or higher`
            ) : (
              `Allowed Roles: ${allowedRoles.map(role => 
                role.charAt(0).toUpperCase() + role.slice(1)
              ).join(', ')}`
            )}
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Button 
            variant="contained" 
            onClick={() => window.location.href = '/'}
          >
            Go Home
          </Button>
        </Box>
      </Box>
    );
  }

  return children;
};

export default RoleBasedRoute;
