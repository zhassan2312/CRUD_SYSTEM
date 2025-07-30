import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerificationEmail, isLoading } = useAuthStore();
  
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  
  // Get email and message from navigation state or URL params
  const stateEmail = location.state?.email;
  const stateMessage = location.state?.message;
  const fromLogin = location.state?.fromLogin;
  const token = searchParams.get('token');

  useEffect(() => {
    // If there's a token in URL, automatically verify
    if (token) {
      handleVerification(token);
    } else if (stateMessage) {
      setMessage(stateMessage);
    }
  }, [token]);

  const handleVerification = async (verificationToken) => {
    try {
      setVerificationStatus('pending');
      const result = await verifyEmail(verificationToken);
      
      if (result.success) {
        setVerificationStatus('success');
        setMessage(result.message || 'Email verified successfully! You can now login.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setMessage(result.error || 'Email verification failed.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('An unexpected error occurred during verification.');
    }
  };

  const handleResendVerification = async () => {
    if (!stateEmail) {
      setMessage('Email address not available. Please try registering again.');
      return;
    }

    try {
      setResendLoading(true);
      const result = await resendVerificationEmail(stateEmail);
      
      if (result.success) {
        if (result.alreadyVerified) {
          setVerificationStatus('success');
          setMessage('Email is already verified! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setMessage('Verification email sent! Please check your inbox.');
        }
      } else {
        setMessage(result.error || 'Failed to resend verification email.');
      }
    } catch (error) {
      setMessage('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />;
      case 'error':
        return <ErrorIcon color="error" sx={{ fontSize: 60 }} />;
      default:
        return <EmailIcon color="primary" sx={{ fontSize: 60 }} />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {getStatusIcon()}
            
            <Typography component="h1" variant="h4" gutterBottom sx={{ mt: 2 }}>
              {verificationStatus === 'success' ? 'Email Verified!' : 
               verificationStatus === 'error' ? 'Verification Failed' : 
               'Email Verification'}
            </Typography>

            {message && (
              <Alert severity={getStatusColor()} sx={{ width: '100%', mb: 3 }}>
                {message}
              </Alert>
            )}

            {token && isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography>Verifying your email...</Typography>
              </Box>
            )}

            {verificationStatus === 'success' && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                Your email has been successfully verified. You will be redirected to the login page automatically.
              </Typography>
            )}

            {verificationStatus !== 'success' && !token && (
              <>
                <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
                  {stateEmail ? (
                    <>
                      We've sent a verification email to <strong>{stateEmail}</strong>. 
                      Please check your inbox and click the verification link to activate your account.
                    </>
                  ) : (
                    'Please check your email for a verification link to activate your account.'
                  )}
                </Typography>

                {stateEmail && (
                  <>
                    <Divider sx={{ width: '100%', mb: 3 }} />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                      Didn't receive the email? Check your spam folder or resend verification email.
                    </Typography>

                    <Button
                      variant="outlined"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      sx={{ mb: 2 }}
                    >
                      {resendLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Sending...
                        </>
                      ) : (
                        'Resend Verification Email'
                      )}
                    </Button>
                  </>
                )}
              </>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {verificationStatus === 'success' ? (
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/login')}
                  >
                    Back to Login
                  </Button>
                  {!fromLogin && (
                    <Button
                      variant="text"
                      onClick={() => navigate('/register')}
                    >
                      Register Again
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerification;
