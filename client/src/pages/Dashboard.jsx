import React, { useEffect } from 'react';
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
  CardMedia,
  CardActions,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  FolderOpen as ProjectIcon,
  School as SchoolIcon,
  SupervisorAccount as AdminIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';
import useProjectStore from '../store/useProjectStore';
import useTeacherStore from '../store/useTeacherStore';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

const Dashboard = () => {
  const { user } = useUserStore();
  const { userProjects, fetchUserProjects, loading: projectLoading } = useProjectStore();
  const { teachers, fetchTeachers } = useTeacherStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProjects();
    fetchTeachers();
  }, []);

  const statsCards = [
    {
      title: 'My Projects',
      value: userProjects.length.toString(),
      icon: <ProjectIcon />,
      color: '#1976d2',
    },
    {
      title: 'Completed Projects',
      value: userProjects.filter(p => p.status === 'completed').length.toString(),
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
        value: teachers.length.toString(),
        icon: <SchoolIcon />,
        color: '#9c27b0',
      },
    ] : []),
  ];

  return (
    <Container maxWidth="lg">
      {/* Email Verification Banner */}
      <EmailVerificationBanner user={user} />

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
            <Card 
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => navigate('/projects')}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <AddIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">New Project</Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a new project
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => navigate('/projects')}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <ProjectIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">View Projects</Typography>
                <Typography variant="body2" color="text.secondary">
                  Check your projects
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {user?.role === 'admin' && (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card 
                  sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                  onClick={() => navigate('/admin/users')}
                >
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
                <Card 
                  sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                  onClick={() => navigate('/admin/teachers')}
                >
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

      {/* Recent Projects */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Recent Projects
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects')}
          >
            Create New
          </Button>
        </Box>
        
        {projectLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Loading projects...
            </Typography>
          </Box>
        ) : userProjects.length > 0 ? (
          <Grid container spacing={3}>
            {userProjects.slice(0, 3).map((project) => (
              <Grid size={{ xs: 12, md: 4 }} key={project.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {project.imageUrl && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={project.imageUrl}
                      alt={project.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {project.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description?.substring(0, 100)}
                      {project.description?.length > 100 && '...'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={project.status || 'In Progress'}
                        color={project.status === 'completed' ? 'success' : 'primary'}
                        size="small"
                      />
                      {project.supervisor && (
                        <Chip
                          label={`Supervisor: ${project.supervisor}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(project.createdAt?.toDate ? project.createdAt.toDate() : project.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton 
                      size="small" 
                      onClick={() => navigate('/projects')}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => navigate('/projects')}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No projects yet. Create your first project to get started!
            </Typography>
          </Box>
        )}
      </Paper>

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
