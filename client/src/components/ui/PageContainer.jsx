import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  NavigateNext,
  Refresh,
  Settings,
  Help,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const ModernPageContainer = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  children,
  maxWidth = 'xl',
  padding = 3,
  showRefresh = false,
  onRefresh,
  badge,
  gradient = false,
}) => {
  const theme = useTheme();
  const location = useLocation();

  const generateBreadcrumbs = () => {
    if (breadcrumbs.length > 0) return breadcrumbs;
    
    // Auto-generate breadcrumbs from path
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const autoBreadcrumbs = [{ label: 'Home', path: '/' }];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      autoBreadcrumbs.push({
        label,
        path: index === pathSegments.length - 1 ? null : currentPath,
      });
    });
    
    return autoBreadcrumbs;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: gradient
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
          : 'transparent',
      }}
    >
      {/* Page Header */}
      <Box
        sx={{
          background: gradient
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
            : alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: padding,
          py: 3,
          px: padding,
        }}
      >
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{
            mb: 2,
            '& .MuiBreadcrumbs-separator': {
              color: 'text.secondary',
            },
          }}
        >
          {generateBreadcrumbs().map((crumb, index) => (
            crumb.path ? (
              <Link
                key={index}
                component={RouterLink}
                to={crumb.path}
                underline="hover"
                color="text.secondary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography
                key={index}
                color="text.primary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {crumb.label}
              </Typography>
            )
          ))}
        </Breadcrumbs>

        {/* Title Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: gradient
                    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                    : 'inherit',
                  backgroundClip: gradient ? 'text' : 'unset',
                  WebkitBackgroundClip: gradient ? 'text' : 'unset',
                  WebkitTextFillColor: gradient ? 'transparent' : 'inherit',
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>
              
              {badge && (
                <Chip
                  label={badge.label}
                  color={badge.color || 'primary'}
                  size="small"
                  variant={badge.variant || 'outlined'}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              )}
            </Box>
            
            {subtitle && (
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  maxWidth: 600,
                  lineHeight: 1.6,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showRefresh && (
              <Tooltip title="Refresh">
                <IconButton
                  onClick={onRefresh}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
            
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {action}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Page Content */}
      <Box
        sx={{
          maxWidth: maxWidth,
          mx: 'auto',
          px: padding,
          pb: padding,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ModernPageContainer;
