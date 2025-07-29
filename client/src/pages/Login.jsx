import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import useUserStore from '../store/useUserStore';

const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const resetPasswordSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
});

const Login = () => {
  const { login, resendVerificationEmail, resetPassword, loading, error, clearError } = useUserStore();
  const [message, setMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
    reset: resetForm,
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  });

  useEffect(() => {
    clearError();
  }, []);

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate('/');
    } else {
      setMessage(result.error);
    }
  };

  const handleResendVerification = async () => {
    const email = getValues('email');
    if (!email) {
      setSnackbar({
        open: true,
        message: 'Please enter your email first',
        severity: 'warning'
      });
      return;
    }

    const result = await resendVerificationEmail(email);
    setSnackbar({
      open: true,
      message: result.success ? result.message : result.error,
      severity: result.success ? 'success' : 'error'
    });
  };

  const onResetPasswordSubmit = async (data) => {
    const result = await resetPassword(data.email, data.newPassword);
    if (result.success) {
      setSnackbar({
        open: true,
        message: result.message,
        severity: 'success'
      });
      setShowResetModal(false);
      resetForm();
    } else {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error'
      });
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
            Sign In
          </Typography>

          {message && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => setShowResetModal(true)}
              >
                Forgot Password?
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={handleResendVerification}
                disabled={loading}
              >
                Resend Email Verification
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="text">Sign Up</Button>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Reset Password Modal */}
      <Dialog
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Reset Password</DialogTitle>
        <Box component="form" onSubmit={handleResetSubmit(onResetPasswordSubmit)}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="reset-email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              {...registerReset('email')}
              error={!!resetErrors.email}
              helperText={resetErrors.email?.message}
            />
            <TextField
              margin="dense"
              id="new-password"
              label="New Password"
              type="password"
              fullWidth
              variant="outlined"
              {...registerReset('newPassword')}
              error={!!resetErrors.newPassword}
              helperText={resetErrors.newPassword?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;