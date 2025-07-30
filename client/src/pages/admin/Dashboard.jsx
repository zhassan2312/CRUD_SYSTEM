import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useTeacherStore } from '../../store/teacherStore';
import { useAuthStore } from '../../store/authStore';
import FileStatistics from '../../components/admin/FileStatistics';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { allProjects, getAllProjects, updateProjectStatus, isLoading: projectsLoading } = useProjectStore();
  const { teachers, getTeachers, isLoading: teachersLoading } = useTeacherStore();
  const { user } = useAuthStore();

  useEffect(() => {
    getAllProjects();
    getTeachers();
  }, [getAllProjects, getTeachers]);

  const handleStatusChange = async (projectId, status) => {
    await updateProjectStatus(projectId, status);
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

  // Calculate stats
  const stats = {
    totalProjects: allProjects.length,
    totalTeachers: teachers.length,
    totalStudents: allProjects.reduce((total, project) => {
      const uniqueEmails = new Set();
      project.students?.forEach(student => uniqueEmails.add(student.email));
      return total + uniqueEmails.size;
    }, 0),
    pendingProjects: allProjects.filter(p => p.status === 'pending' || !p.status).length,
    approvedProjects: allProjects.filter(p => p.status === 'approved').length,
    rejectedProjects: allProjects.filter(p => p.status === 'rejected').length,
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Welcome back, {user?.fullName}!
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Projects
                  </Typography>
                  <Typography variant="h4">
                    {projectsLoading ? <CircularProgress size={24} /> : stats.totalProjects}
                  </Typography>
                </Box>
                <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Teachers
                  </Typography>
                  <Typography variant="h4">
                    {teachersLoading ? <CircularProgress size={24} /> : stats.totalTeachers}
                  </Typography>
                </Box>
                <SchoolIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4">
                    {projectsLoading ? <CircularProgress size={24} /> : stats.totalStudents}
                  </Typography>
                </Box>
                <PeopleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Projects
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {projectsLoading ? <CircularProgress size={24} /> : stats.pendingProjects}
                  </Typography>
                </Box>
                <AssignmentIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Project Status Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Status Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Pending:</Typography>
                  <Chip label={stats.pendingProjects} color="warning" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Approved:</Typography>
                  <Chip label={stats.approvedProjects} color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Rejected:</Typography>
                  <Chip label={stats.rejectedProjects} color="error" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Quick Actions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate('/admin/teachers')}
                >
                  Manage Teachers
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => {
                    const pendingProject = allProjects.find(p => p.status === 'pending' || !p.status);
                    if (pendingProject) {
                      document.getElementById(`project-${pendingProject.id}`)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Review Pending Projects
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* File Statistics Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          File Management Statistics
        </Typography>
        <FileStatistics />
      </Box>

      {/* Recent Projects Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            All Projects
          </Typography>
        </Box>
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projectsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : allProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No projects found
                  </TableCell>
                </TableRow>
              ) : (
                allProjects.map((project) => (
                  <TableRow key={project.id} id={`project-${project.id}`}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {project.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.description.substring(0, 50)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {project.students?.length || 0} students
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={project.status || 'pending'}
                        color={getStatusColor(project.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleStatusChange(project.id, 'approved')}
                          disabled={project.status === 'approved'}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleStatusChange(project.id, 'rejected')}
                          disabled={project.status === 'rejected'}
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
