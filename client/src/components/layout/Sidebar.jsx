import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Collapse,
  useTheme,
  useMediaQuery,
  Chip,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Assignment,
  School,
  Search,
  Add,
  Person,
  Notifications,
  Logout,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Home,
  FolderOpen,
  Analytics,
  Group,
  AdminPanelSettings,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/user';
import { useUserNotificationStore } from '../../store/user';
import NotificationCenter from '../notifications/NotificationCenter';

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 72;

const ModernSidebar = ({ children, darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  const { user, logout } = useAuthStore();
  const { unreadCount, getNotifications, checkForNewNotifications } = useUserNotificationStore();
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'user';

  useEffect(() => {
    if (user) {
      getNotifications();
      checkForNewNotifications();
    }
  }, [user, getNotifications, checkForNewNotifications]);

  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
      setCollapsed(false);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleExpandMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      {
        text: 'Dashboard',
        icon: <Dashboard />,
        path: isAdmin ? '/admin' : '/',
        active: location.pathname === (isAdmin ? '/admin' : '/'),
      },
    ];

    if (isAdmin) {
      return [
        ...commonItems,
        {
          text: 'Project Management',
          icon: <Assignment />,
          expandable: true,
          key: 'projects',
          children: [
            { text: 'All Projects', path: '/admin/projects' },
            { text: 'Bulk Operations', path: '/admin/projects/bulk' },
          ]
        },
        {
          text: 'User Management',
          icon: <Group />,
          expandable: true,
          key: 'users',
          children: [
            { text: 'Students', path: '/admin/users' },
            { text: 'Teachers', path: '/admin/teachers' },
            { text: 'Administrators', path: '/admin/admins' },
          ]
        },
        {
          text: 'System',
          icon: <Settings />,
          expandable: true,
          key: 'system',
          children: [
            { text: 'Settings', path: '/admin/settings' },
            { text: 'Backup', path: '/admin/backup' },
            { text: 'Logs', path: '/admin/logs' },
          ]
        },
      ];
    }

    if (isTeacher) {
      return [
        ...commonItems,
        {
          text: 'My Projects',
          icon: <FolderOpen />,
          path: '/teacher/projects',
          active: location.pathname.startsWith('/teacher/projects'),
        },
        {
          text: 'Students',
          icon: <School />,
          path: '/teacher/students',
          active: location.pathname === '/teacher/students',
        },
        {
          text: 'Reviews',
          icon: <Assignment />,
          path: '/teacher/reviews',
          active: location.pathname === '/teacher/reviews',
        },
      ];
    }

    // Student navigation
    return [
      ...commonItems,
      {
        text: 'Add Project',
        icon: <Add />,
        path: '/project',
        active: location.pathname === '/project',
      },
    ];
  };

  const renderNavigationItem = (item, isChild = false) => {
    if (item.expandable) {
      const isExpanded = expandedMenus[item.key];
      
      return (
        <React.Fragment key={item.key}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => handleExpandMenu(item.key)}
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'initial',
                px: 2.5,
                ml: isChild ? 2 : 0,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 'auto' : 3,
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <>
                  <ListItemText
                    primary={item.text}
                    sx={{ opacity: 1 }}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </ListItem>
          
          {!collapsed && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children?.map((child) => (
                  <ListItem key={child.path} disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                      onClick={() => navigate(child.path)}
                      selected={location.pathname === child.path}
                      sx={{
                        minHeight: 40,
                        pl: 4,
                        pr: 2.5,
                        ml: 2,
                        mr: 1,
                        borderRadius: 1,
                      }}
                    >
                      <ListItemText
                        primary={child.text}
                        primaryTypographyProps={{
                          fontSize: '0.8rem',
                          fontWeight: location.pathname === child.path ? 600 : 400,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.path || item.text} disablePadding sx={{ display: 'block' }}>
        <Tooltip title={collapsed ? item.text : ''} placement="right">
          <ListItemButton
            onClick={() => item.path && navigate(item.path)}
            selected={item.active}
            sx={{
              minHeight: 48,
              justifyContent: collapsed ? 'center' : 'initial',
              px: 2.5,
              ml: isChild ? 2 : 0,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? 'auto' : 3,
                justifyContent: 'center',
                color: 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={item.text}
                sx={{ opacity: 1 }}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: item.active ? 600 : 500,
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo and Brand */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettings sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: '1.25rem',
              }}
            >
              PMS
            </Typography>
          </Box>
        )}
        
        {collapsed && (
          <AdminPanelSettings sx={{ color: 'primary.main', fontSize: 32 }} />
        )}
        
        {!isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              color: 'text.secondary',
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* User Info */}
      {!collapsed && (
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: 'primary.main',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Chip
                label={user?.role?.toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  mt: 0.5,
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {getNavigationItems().map((item) => renderNavigationItem(item))}
        </List>
      </Box>

      <Divider />

      {/* Bottom Actions */}
      <Box sx={{ p: 1 }}>
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <Tooltip title={collapsed ? 'Toggle Theme' : ''} placement="right">
              <ListItemButton
                onClick={toggleDarkMode}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 'auto' : 3,
                    justifyContent: 'center',
                    color: 'inherit',
                  }}
                >
                  {darkMode ? <LightMode /> : <DarkMode />}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={darkMode ? 'Light Mode' : 'Dark Mode'}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  const actualDrawerWidth = collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${actualDrawerWidth}px)` },
          ml: { lg: `${actualDrawerWidth}px` },
          backgroundColor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={() => setNotificationOpen(true)}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'primary.main',
                fontSize: '0.875rem',
              }}
            >
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: 2,
                minWidth: 200,
                mt: 1,
              },
            }}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { lg: actualDrawerWidth }, flexShrink: { lg: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: actualDrawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { lg: `calc(100% - ${actualDrawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Notification Center */}
      <NotificationCenter
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </Box>
  );
};

export default ModernSidebar;
