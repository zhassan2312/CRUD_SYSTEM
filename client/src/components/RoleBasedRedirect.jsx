import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';

/**
 * RoleBasedRedirect - Redirects users to appropriate routes based on their role
 * This component is used for the default route and fallback redirects
 */
const RoleBasedRedirect = () => {
  const { user, loading } = useUserStore();

  // Show loading state while user data is being fetched
  if (loading) {
    return null; // or a loading spinner
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based redirection
  switch (user.role) {
    case 'admin':
    case 'teacher':
      return <Navigate to="/admin" replace />;
    case 'user':
    default:
      return <Navigate to="/" replace />;
  }
};

export default RoleBasedRedirect;
