import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Skeleton,
  IconButton,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';

const ModernStatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  trend, 
  trendValue, 
  subtitle,
  loading = false,
  onClick,
  actionMenu,
}) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Skeleton variant="rectangular" width={24} height={24} />
          </Box>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="80%" height={16} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  const isPositiveTrend = trend === 'up' || (trendValue && trendValue > 0);
  const trendColor = isPositiveTrend ? 'success' : 'error';
  const TrendIcon = isPositiveTrend ? ArrowUpward : ArrowDownward;

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(theme.palette[color].main, 0.25)}`,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar
            sx={{
              backgroundColor: theme.palette[color].main,
              width: 48,
              height: 48,
              boxShadow: `0 4px 14px ${alpha(theme.palette[color].main, 0.3)}`,
            }}
          >
            {icon}
          </Avatar>
          
          {actionMenu && (
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* Main Value */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 0.5,
            lineHeight: 1.2,
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>

        {/* Title */}
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            mb: 1,
          }}
        >
          {title}
        </Typography>

        {/* Trend and Subtitle */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          {(trend || trendValue !== undefined) && (
            <Chip
              icon={<TrendIcon sx={{ fontSize: '1rem' }} />}
              label={trendValue ? `${Math.abs(trendValue)}%` : ''}
              size="small"
              color={trendColor}
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
          )}
          
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ModernStatsCard;
