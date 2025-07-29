import React from 'react';
import { Navigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';

const ProtectedRoute = ({ children, allowedRoles = ['user', 'admin'] }) => {
  const { user } = useUserStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
