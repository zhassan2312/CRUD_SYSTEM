import React, { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  FolderOpen as ProjectIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../../store/useProjectStore';
import useTeacherStore from '../../store/useTeacherStore';
import useUserStore from '../../store/useUserStore';
import useStatsStore from '../../store/useStatsStore';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, users, fetchUsers } = useUserStore();
  const { projects, fetchProjects, loading: projectLoading } = useProjectStore();
  const { teachers, fetchTeachers, loading: teacherLoading } = useTeacherStore();
  const { stats: adminStats, fetchAdminStats, loading: statsLoading } = useStatsStore();

  const [hasInitialized, setHasInitialized] = useState(false);

  const [localStats, setLocalStats] = useState({
    totalProjects: 0,
    totalTeachers: 0,
    uniqueStudents: 0,
    totalUsers: 0,
    completedProjects: 0,
    pendingProjects: 0,
  });

  useEffect(() => {
    // Only fetch data if user is authenticated and is an admin
    if (user?.role === 'admin' && !hasInitialized) {
      setHasInitialized(true);
      fetchProjects();
      fetchTeachers();
      fetchUsers();
      fetchAdminStats();
    }
  }, [user, hasInitialized]);

  useEffect(() => {
    // Use admin stats if available, otherwise calculate locally
    if (adminStats && adminStats.totalProjects !== undefined) {
      setLocalStats(adminStats);
    } else if (projects && teachers && users) {
      // Fallback to local calculation
      const uniqueStudentEmails = new Set();
      
      projects.forEach(project => {
        if (project.students && Array.isArray(project.students)) {
          project.students.forEach(student => {
            if (student.email) {
              uniqueStudentEmails.add(student.email.toLowerCase());
            }
          });
        }
      });

      const completedCount = projects.filter(p => p.status === 'completed').length;
      const pendingCount = projects.filter(p => p.status === 'pending' || p.status === 'in-progress').length;

      setLocalStats({
        totalProjects: projects.length,
        totalTeachers: teachers.length,
        uniqueStudents: uniqueStudentEmails.size,
        totalUsers: users.length,
        completedProjects: completedCount,
        pendingProjects: pendingCount,
      });
    }
  }, [adminStats, projects, teachers, users]);

  const statsCards = [
    {
      title: 'Total Projects',
      value: localStats.totalProjects,
      icon: <ProjectIcon />,
      color: '#1976d2',
      description: `${localStats.completedProjects} completed, ${localStats.pendingProjects} pending`,
      onClick: () => navigate('/admin/projects'),
    },
    {
      title: 'Teachers',
      value: localStats.totalTeachers,
      icon: <SchoolIcon />,
      color: '#9c27b0',
      description: 'Available supervisors',
      onClick: () => navigate('/admin/teachers'),
    },
    {
      title: 'Unique Students',
      value: localStats.uniqueStudents,
      icon: <PeopleIcon />,
      color: '#ed6c02',
      description: 'From all projects',
      onClick: () => {},
    },
    {
      title: 'Total Users',
      value: localStats.totalUsers,
      icon: <DashboardIcon />,
      color: '#2e7d32',
      description: 'Registered users',
      onClick: () => navigate('/admin/users'),
    },
  ];

  const loading = projectLoading || teacherLoading || authLoading || statsLoading;

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Verifying permissions...
          </Typography>
        </Box>
      </Container>
    );
  }

  // If not authenticated at all, show login prompt
  if (!user) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>
          You must be logged in to access the admin dashboard.
          <Box sx={{ mt: 2 }}>
            <button 
              onClick={() => navigate('/login')}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#1976d2', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Go to Login
            </button>
          </Box>
        </Alert>
      </Container>
    );
  }

  // Check if user is admin
  if (user.role !== 'admin') {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of system statistics and recent activity
        </Typography>
      </Box>

      {/* Stats Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer', 
                  '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                  transition: 'all 0.3s ease-in-out'
                }}
                onClick={stat.onClick}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h4" component="div" color={stat.color} sx={{ fontWeight: 'bold' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="h6" color="text.primary">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Recent Projects */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Recent Projects
          </Typography>
          <IconButton onClick={() => navigate('/admin/projects')} color="primary">
            <ViewIcon />
          </IconButton>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : projects.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Supervisor</TableCell>
                  <TableCell>Students</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.slice(0, 5).map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {project.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {project.description?.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {project.supervisor}
                      </Typography>
                      {project.coSupervisor && (
                        <Typography variant="caption" color="text.secondary">
                          Co: {project.coSupervisor}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {project.students?.length || 0} student(s)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={project.status || 'pending'}
                        color={
                          project.status === 'completed' ? 'success' :
                          project.status === 'in-progress' ? 'primary' : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(project.createdAt?.toDate ? project.createdAt.toDate() : project.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        onClick={() => navigate('/admin/projects')}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No projects yet
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Recent Teachers */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Recent Teachers
          </Typography>
          <IconButton onClick={() => navigate('/admin/teachers')} color="primary">
            <ViewIcon />
          </IconButton>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : teachers.length > 0 ? (
          <Grid container spacing={2}>
            {teachers.slice(0, 6).map((teacher) => (
              <Grid key={teacher.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      src={teacher.profilePicUrl} 
                      alt={teacher.fullName}
                      sx={{ width: 50, height: 50 }}
                    >
                      {teacher.fullName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {teacher.fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {teacher.department}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {teacher.specialization}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => navigate('/admin/teachers')}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No teachers yet
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
