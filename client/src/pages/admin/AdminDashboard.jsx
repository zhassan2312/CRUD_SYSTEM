import React, { useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  People,
  School,
  Assignment,
  TrendingUp,
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/admin';
import { useTeacherStore } from '../../store/admin';
import { useAuthStore } from '../../store/user';
import { useUserStore } from '../../store/admin';
import ModernPageContainer from '../../components/ui/PageContainer';
import ModernStatsCard from '../../components/ui/StatsCard';
import FileStatistics from '../../components/admin/FileStatistics';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { projects: adminProjects, getAllProjects, updateProjectStatus, isLoading: projectsLoading } = useProjectStore();
  const { teachers, getAllTeachers, isLoading: teachersLoading } = useTeacherStore();
  const { user } = useAuthStore();
  const { users, getAllUsers } = useUserStore();

  useEffect(() => {
    getAllProjects();
    getAllTeachers();
    getAllUsers();
  }, [getAllProjects, getAllTeachers, getAllUsers]);

  const handleStatusChange = async (projectId, status) => {
    const reviewData = {
      status,
      reviewedBy: user?.uid,
      reviewDate: new Date().toISOString(),
      comments: `Status changed to ${status}`
    };
    await updateProjectStatus(projectId, reviewData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Calculate stats - with null checks and correct data source
  const allProjectsData = adminProjects?.data || [];
  const recentProjects = allProjectsData.slice(0, 5);
  const pendingCount = allProjectsData.filter(p => p.status === 'pending' || !p.status).length;
  const approvedCount = allProjectsData.filter(p => p.status === 'approved').length;
  const rejectedCount = allProjectsData.filter(p => p.status === 'rejected').length;

  const totalUsers = users?.data?.length || 0;
  const totalStudents = users?.data?.filter(u => u.role === 'user')?.length || 0;
  const totalTeachers = teachers?.length || 0;
  const totalProjects = allProjectsData.length;

  return (
    <ModernPageContainer
      title="Admin Dashboard"
      subtitle={`Welcome back, ${user?.firstName} ${user?.lastName}! Here's what's happening in your system.`}
      gradient
      showRefresh
      onRefresh={() => {
        getAllProjects();
        getAllTeachers();
        getAllUsers();
      }}
      badge={{
        label: 'Admin Panel',
        color: 'primary',
        variant: 'filled'
      }}
    >
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatsCard
            title="Total Users"
            value={totalUsers}
            icon={<People />}
            color="primary"
            trend="up"
            trendValue={12}
            subtitle="All system users"
            onClick={() => navigate('/admin/users')}
            loading={users?.loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatsCard
            title="Projects"
            value={totalProjects}
            icon={<Assignment />}
            color="secondary"
            trend="up"
            trendValue={8}
            subtitle="Total projects"
            onClick={() => navigate('/admin/projects')}
            loading={projectsLoading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatsCard
            title="Teachers"
            value={totalTeachers}
            icon={<School />}
            color="success"
            trend="up"
            trendValue={5}
            subtitle="Active teachers"
            onClick={() => navigate('/admin/teachers')}
            loading={teachersLoading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatsCard
            title="Pending Reviews"
            value={pendingCount}
            icon={<Schedule />}
            color="warning"
            trend={pendingCount > 0 ? "up" : "down"}
            trendValue={pendingCount > 0 ? 15 : -10}
            subtitle="Need attention"
            onClick={() => navigate('/admin/projects?filter=pending')}
            loading={projectsLoading}
          />
        </Grid>
      </Grid>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* File Statistics */}
        <Grid item xs={12} lg={6}>
          <FileStatistics />
        </Grid>

        {/* Project Status Overview */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Project Status Overview
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/admin/projects')}
                  size="small"
                >
                  View All
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'success.lighter' }}>
                    <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {approvedCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'warning.lighter' }}>
                    <Schedule sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {pendingCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'error.lighter' }}>
                    <Cancel sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                      {rejectedCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rejected
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Progress Bar */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Review Progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={totalProjects > 0 ? ((approvedCount + rejectedCount) / totalProjects) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {totalProjects > 0 ? Math.round(((approvedCount + rejectedCount) / totalProjects) * 100) : 0}% Reviewed
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {approvedCount + rejectedCount} of {totalProjects}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Projects */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Projects
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/admin/projects')}
                  size="small"
                >
                  View All
                </Button>
              </Box>

              {projectsLoading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <LinearProgress sx={{ mb: 2 }} />
                  <Typography color="text.secondary">Loading projects...</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Students</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentProjects.map((project) => (
                        <TableRow key={project.id} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {project.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {project.description?.substring(0, 50)}...
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {project.students?.[0]?.name?.[0] || 'S'}
                              </Avatar>
                              <Typography variant="body2">
                                {project.students?.[0]?.name || 'Unknown'}
                                {project.students?.length > 1 && (
                                  <Chip
                                    label={`+${project.students.length - 1}`}
                                    size="small"
                                    sx={{ ml: 1, height: 16, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              label={project.status || 'pending'}
                              color={getStatusColor(project.status)}
                              size="small"
                              sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/admin/projects/${project.id}`)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              
                              {project.status === 'pending' && (
                                <>
                                  <Tooltip title="Approve">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleStatusChange(project.id, 'approved')}
                                    >
                                      <CheckCircle />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title="Reject">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleStatusChange(project.id, 'rejected')}
                                    >
                                      <Cancel />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ModernPageContainer>
  );
};

export default AdminDashboard;
