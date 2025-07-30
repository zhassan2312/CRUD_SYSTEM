import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  alpha,
  useTheme 
} from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        backdropFilter: 'blur(20px)',
        zIndex: 9999,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <AdminPanelSettings 
          sx={{ 
            fontSize: 64, 
            color: 'primary.main',
            filter: `drop-shadow(0 4px 8px ${alpha(theme.palette.primary.main, 0.3)})`,
          }} 
        />
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          PMS
        </Typography>
      </Box>

      {/* Loading Animation */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: 'primary.main',
            filter: `drop-shadow(0 4px 8px ${alpha(theme.palette.primary.main, 0.3)})`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress
            variant="determinate"
            value={25}
            size={60}
            thickness={4}
            sx={{
              color: alpha(theme.palette.secondary.main, 0.3),
              transform: 'rotate(90deg)',
            }}
          />
        </Box>
      </Box>

      {/* Loading Text */}
      <Typography
        variant="h6"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          textAlign: 'center',
          maxWidth: 300,
        }}
      >
        {message}
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mt: 1,
          opacity: 0.7,
        }}
      >
        Project Management System
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
