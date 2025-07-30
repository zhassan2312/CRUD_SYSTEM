import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { theme } from './theme/theme';
import useUserStore from './store/useUserStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import LoadingScreen from './components/LoadingScreen';
import UserDebugInfo from './components/UserDebugInfo';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import AddProject from './pages/AddProject';
import EmailVerification from './pages/EmailVerification';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeachers from './pages/admin/Teachers';
import AdminUsers from './pages/admin/Users';
import ProjectReview from './pages/admin/ProjectReview';

const App = () => {
  const { initializeAuth, user } = useUserStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await initializeAuth();
      setIsInitializing(false);
    };
    initialize();
  }, []);

  if (isInitializing) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingScreen message="Checking authentication..." />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {user ? (
          <Layout>
            <UserDebugInfo />
            <Routes>
              {/* Home Route - Redirect based on role */}
              <Route 
                path="/" 
                element={
                  user?.role === 'admin' || user?.role === 'teacher' ? 
                    <Navigate to="/admin" replace /> :
                    <RoleBasedRoute allowedRoles={['user']}>
                      <Dashboard />
                    </RoleBasedRoute>
                } 
              />
              
              {/* Projects - Only for regular users */}
              <Route 
                path="/projects" 
                element={
                  <RoleBasedRoute allowedRoles={['user']}>
                    <Projects />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/project" 
                element={
                  <RoleBasedRoute allowedRoles={['user']}>
                    <AddProject />
                  </RoleBasedRoute>
                } 
              />
              
              {/* Email Verification */}
              <Route 
                path="/verify-email" 
                element={<EmailVerification />} 
              />
              
              {/* Admin Routes - Only for admin and teacher roles */}
              <Route 
                path="/admin" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'teacher']}>
                    <AdminDashboard />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/admin/teachers" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'teacher']}>
                    <AdminTeachers />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'teacher']}>
                    <AdminUsers />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/admin/projects" 
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'teacher']}>
                    <ProjectReview />
                  </RoleBasedRoute>
                } 
              />
              
              {/* Fallback route - redirect based on role */}
              <Route path="*" element={<RoleBasedRedirect />} />
            </Routes>
          </Layout>
        ) : (
          <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Box>
        )}
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </ThemeProvider>
  );
};

export default App;
