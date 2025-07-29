import React, { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  CircularProgress,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import useUserStore from '../store/useUserStore';

const EmailVerificationBanner = ({ user, onDismiss }) => {
  const { resendVerificationEmail, syncEmailVerification } = useUserStore();
  const [resendLoading, setResendLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if user is verified or component is dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      const result = await resendVerificationEmail(user.email);
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.');
        setCountdown(60); // 60 second cooldown
        
        // Start countdown timer
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
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
    setSyncLoading(true);
    try {
      const result = await syncEmailVerification(user.email);
      if (result.success) {
        toast.success('Email verification status updated!');
        // Refresh the page to update user state
        window.location.reload();
      } else {
        toast.info('Email is still not verified. Please check your email.');
      }
    } catch (error) {
      toast.error('Failed to check verification status');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Collapse in={!dismissed}>
      <Alert 
        severity="warning" 
        sx={{ mb: 3, borderRadius: 2 }}
        icon={<WarningIcon />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSyncVerification}
              disabled={syncLoading}
              startIcon={syncLoading ? <CircularProgress size={14} /> : <RefreshIcon />}
              sx={{ 
                borderColor: 'warning.main', 
                color: 'warning.main',
                '&:hover': {
                  borderColor: 'warning.dark',
                  backgroundColor: 'warning.light',
                  color: 'warning.dark'
                }
              }}
            >
              {syncLoading ? 'Checking...' : 'I\'ve Verified'}
            </Button>
            
            <Button
              size="small"
              variant="contained"
              onClick={handleResendVerification}
              disabled={resendLoading || countdown > 0}
              startIcon={resendLoading ? <CircularProgress size={14} /> : <EmailIcon />}
              sx={{ 
                backgroundColor: 'warning.main',
                '&:hover': {
                  backgroundColor: 'warning.dark'
                }
              }}
            >
              {countdown > 0 ? `Resend (${countdown}s)` : 'Resend Email'}
            </Button>
            
            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{ color: 'warning.main' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <AlertTitle>Email Verification Required</AlertTitle>
        Your email address <strong>{user.email}</strong> is not verified. 
        Please check your inbox and click the verification link to access all features.
      </Alert>
    </Collapse>
  );
};

export default EmailVerificationBanner;
