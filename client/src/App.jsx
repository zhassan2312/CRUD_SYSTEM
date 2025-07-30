import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';

// Auth Components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// User Components
import UserDashboard from './pages/user/Dashboard';
import AddProject from './pages/user/AddProject';

// Admin Components
import AdminDashboard from './pages/admin/Dashboard';
import Teachers from './pages/admin/Teachers';
import ProjectReview from './pages/admin/ProjectReview';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { checkAuth, isLoading, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? '/admin' : '/'} />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to={user.role === 'admin' ? '/admin' : '/'} />} />
      <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to={user.role === 'admin' ? '/admin' : '/'} />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute requiredRole="user">
          <Layout>
            <UserDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/project" element={
        <ProtectedRoute requiredRole="user">
          <Layout>
            <AddProject />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/teachers" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <Teachers />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/projects" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <ProjectReview />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/') : '/login'} />} />
    </Routes>
  );
}

export default App;
