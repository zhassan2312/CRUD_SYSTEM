import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/user';
import { useThemeMode } from './contexts/ThemeContext';
import { useEffect } from 'react';

// Auth Components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import EmailVerification from './pages/EmailVerification';

// User Components
import UserDashboard from './pages/user/Dashboard';
import AddProject from './pages/user/AddProject';
import ProjectDetails from './pages/user/ProjectDetails';
import UserProfile from './pages/user/UserProfile';
import SearchPage from './pages/SearchPage';

// Admin Components
import AdminDashboard from './pages/admin/AdminDashboard';
import Teachers from './pages/admin/Teachers';
import ProjectReview from './pages/admin/ProjectReview';
import Users from './pages/admin/Users';
import Admins from './pages/admin/Admins';
import BulkProjectManagement from './pages/admin/BulkProjectManagement';

// Components
import Sidebar from './components/layout/Sidebar';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { checkAuth, isLoading, user } = useAuthStore();
  const { darkMode, toggleDarkMode } = useThemeMode();

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
      <Route path="/email-verification" element={<EmailVerification />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      
      {/* Protected Routes with  Sidebar */}
      <Route path="/" element={
        <ProtectedRoute requiredRole="user">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <UserDashboard />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      <Route path="/project" element={
        <ProtectedRoute requiredRole="user">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <AddProject />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      <Route path="/project/:projectId" element={
        <ProtectedRoute requiredRole="user">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <ProjectDetails />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute requiredRole="user">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <UserProfile />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      <Route path="/search" element={
        <ProtectedRoute requiredRole="user">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <SearchPage />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <AdminDashboard />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/teachers" element={
        <ProtectedRoute requiredRole="admin">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <Teachers />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/projects" element={
        <ProtectedRoute requiredRole="admin">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <ProjectReview />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="admin">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <Users />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/admins" element={
        <ProtectedRoute requiredRole="admin">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <Admins />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/projects/bulk" element={
        <ProtectedRoute requiredRole="admin">
          <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <BulkProjectManagement />
          </Sidebar>
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/') : '/login'} />} />
    </Routes>
  );
}

export default App;
