import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  Chip,
  Button,
  Tabs,
  Tab,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Pagination,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as ProjectIcon,
  Person as PersonIcon,
  Announcement as AnnouncementIcon
} from '@mui/icons-material';
import { useNotificationStore } from '../../store/useNotificationStore';

const NotificationCenter = ({ open, onClose }) => {
  const [currentTab, setCurrentTab] = useState('all');
  
  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    filterNotifications,
    goToPage,
    formatNotificationTime
  } = useNotificationStore();

  useEffect(() => {
    if (open) {
      getNotifications();
    }
  }, [open, getNotifications]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    
    switch (newValue) {
      case 'all':
        filterNotifications(false, '');
        break;
      case 'unread':
        filterNotifications(true, '');
        break;
      case 'project':
        filterNotifications(false, 'project');
        break;
      case 'system':
        filterNotifications(false, 'system');
        break;
      default:
        filterNotifications(false, '');
    }
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handlePageChange = (event, page) => {
    goToPage(page);
  };

  const getNotificationIcon = (type, category) => {
    const iconProps = { sx: { color: getNotificationColor(type) } };
    
    switch (category) {
      case 'project':
        return <ProjectIcon {...iconProps} />;
      case 'admin':
        return <PersonIcon {...iconProps} />;
      case 'system':
        return <AnnouncementIcon {...iconProps} />;
      default:
        switch (type) {
          case 'success':
            return <SuccessIcon {...iconProps} />;
          case 'warning':
            return <WarningIcon {...iconProps} />;
          case 'error':
            return <ErrorIcon {...iconProps} />;
          default:
            return <InfoIcon {...iconProps} />;
        }
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#2196f3';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'project':
        return 'Project';
      case 'admin':
        return 'Admin';
      case 'system':
        return 'System';
      default:
        return 'General';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 } }
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" />
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Action Buttons */}
        {unreadCount > 0 && (
          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllRead}
              variant="outlined"
              fullWidth
            >
              Mark All as Read
            </Button>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 'auto' }}
        >
          <Tab label="All" value="all" />
          <Tab 
            label={
              <Badge badgeContent={unreadCount} color="error" showZero={false}>
                Unread
              </Badge>
            } 
            value="unread" 
          />
          <Tab label="Projects" value="project" />
          <Tab label="System" value="system" />
        </Tabs>
      </Box>

      {/* Notifications List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={3} textAlign="center">
            <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentTab === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."
              }
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification, index) => (
              <Box key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': { backgroundColor: 'action.selected' },
                    cursor: 'pointer'
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'transparent', color: getNotificationColor(notification.type) }}>
                      {getNotificationIcon(notification.type, notification.category)}
                    </Avatar>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: notification.isRead ? 'normal' : 'bold',
                            mb: 0.5 
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Box display="flex" gap={1} mb={1}>
                          <Chip 
                            label={getCategoryLabel(notification.category)}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatNotificationTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {notification.message}
                      </Typography>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      {!notification.isRead && (
                        <Tooltip title="Mark as read">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => handleDelete(notification.id, e)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                
                {index < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Box>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            size="small"
            sx={{ display: 'flex', justifyContent: 'center' }}
          />
        </Box>
      )}
    </Drawer>
  );
};

export default NotificationCenter;
