import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useUserStore from '../store/useUserStore';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    verifyEmail, 
    resendVerificationEmail, 
    syncEmailVerification, 
    loading, 
    user 
  } = useUserStore();

  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const email = searchParams.get('email') || user?.email;
  const mode = searchParams.get('mode'); // 'verify' for email link verification
  const oobCode = searchParams.get('oobCode'); // Firebase verification code

  useEffect(() => {
    // If this is a verification link from email
    if (mode === 'verifyEmail' && oobCode) {
      handleEmailVerification();
    }
    // If user is already verified, redirect
    else if (user?.emailVerified) {
      navigate('/');
    }
  }, [mode, oobCode, user]);

  useEffect(() => {
    // Countdown timer for resend button
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleEmailVerification = async () => {
    if (!email) {
      setVerificationStatus('error');
      return;
    }

    try {
      const result = await verifyEmail(email);
      if (result.success) {
        setVerificationStatus('success');
        toast.success('Email verified successfully!');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setVerificationStatus('error');
        toast.error(result.error || 'Email verification failed');
      }
    } catch (error) {
      setVerificationStatus('error');
      toast.error('Email verification failed');
    }
  };

  const handleResendVerification = async () => {
    if (!email || countdown > 0) return;

    setResendLoading(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.');
        setCountdown(60); // 60 second cooldown
      } else {
        toast.error(result.error || 'Failed to send verification email');
      }
    } catch (error) {
      toast.error('Failed to send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSyncVerification = async () => {
    if (!email) return;

    try {
      const result = await syncEmailVerification(email);
      if (result.success) {
        // Refresh the page or update user state
        window.location.reload();
      }
    } catch (error) {
      console.error('Sync verification failed:', error);
    }
  };

  const renderContent = () => {
    if (verificationStatus === 'success') {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="success.main">
            Email Verified Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your email has been verified. You will be redirected to the dashboard shortly.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            size="large"
          >
            Go to Dashboard
          </Button>
        </Box>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <EmailIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error.main">
            Verification Failed
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The verification link may be invalid or expired. Please try resending the verification email.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              startIcon={<ArrowBackIcon />}
            >
              Back to Login
            </Button>
            <Button
              variant="contained"
              onClick={handleResendVerification}
              disabled={resendLoading || countdown > 0}
              startIcon={resendLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
            </Button>
          </Stack>
        </Box>
      );
    }

    // Default verification pending state
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <EmailIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Verify Your Email Address
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          We've sent a verification email to:
        </Typography>
        <Typography variant="h6" color="primary" sx={{ mb: 3 }}>
          {email}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Please click the verification link in your email to activate your account.
          If you don't see the email, check your spam folder.
        </Typography>

        <Stack spacing={2}>
          <Button
            variant="contained"
            onClick={handleSyncVerification}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            size="large"
          >
            {loading ? 'Checking...' : 'I\'ve Verified My Email'}
          </Button>

          <Button
            variant="outlined"
            onClick={handleResendVerification}
            disabled={resendLoading || countdown > 0}
            startIcon={resendLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
          </Button>

          <Divider sx={{ my: 2 }} />

          <Button
            variant="text"
            onClick={() => navigate('/login')}
            startIcon={<ArrowBackIcon />}
            color="inherit"
          >
            Back to Login
          </Button>
        </Stack>
      </Box>
    );
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {!email && (
          <Alert severity="error" sx={{ mb: 3 }}>
            No email address provided. Please register or login first.
          </Alert>
        )}
        
        {renderContent()}
      </Paper>
    </Container>
  );
};

export default EmailVerification;
