import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Button,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  FolderOpen as ProjectIcon,
  School as SchoolIcon,
  SupervisorAccount as AdminIcon,
} from '@mui/icons-material';
import useUserStore from '../store/useUserStore';

const Dashboard = () => {
  const { user } = useUserStore();

  const statsCards = [
    {
      title: 'My Projects',
      value: '12',
      icon: <ProjectIcon />,
      color: '#1976d2',
    },
    {
      title: 'Completed Tasks',
      value: '24',
      icon: <DashboardIcon />,
      color: '#2e7d32',
    },
    ...(user?.role === 'admin' ? [
      {
        title: 'Total Users',
        value: '156',
        icon: <PeopleIcon />,
        color: '#ed6c02',
      },
      {
        title: 'Teachers',
        value: '8',
        icon: <SchoolIcon />,
        color: '#9c27b0',
      },
    ] : []),
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.fullName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your account today.
        </Typography>
      </Box>

      {/* User Profile Card */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            src={user?.profilePic}
            alt={user?.fullName}
            sx={{ width: 80, height: 80 }}
          >
            {user?.fullName?.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" gutterBottom>
              {user?.fullName}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={user?.role?.toUpperCase()}
                color={user?.role === 'admin' ? 'primary' : 'secondary'}
                size="small"
                icon={user?.role === 'admin' ? <AdminIcon /> : undefined}
              />
              <Chip
                label={user?.emailVerified ? 'Verified' : 'Unverified'}
                color={user?.emailVerified ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          </Box>
          <Button variant="outlined" size="small">
            Edit Profile
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: stat.color,
                      color: 'white',
                      borderRadius: 2,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div" color={stat.color}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ProjectIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">New Project</Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a new project
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">View Tasks</Typography>
                <Typography variant="body2" color="text.secondary">
                  Check your tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {user?.role === 'admin' && (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">Manage Users</Typography>
                    <Typography variant="body2" color="text.secondary">
                      User management
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">Manage Teachers</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Teacher management
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Box>

      {/* Recent Activity */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No recent activity to display
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;
