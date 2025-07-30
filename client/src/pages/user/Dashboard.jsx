import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Avatar,
  AvatarGroup,
  Fab,
  CircularProgress
} from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, getProjects, deleteProject, isLoading } = useProjectStore();
  const { user } = useAuthStore();

  useEffect(() => {
    getProjects();
  }, [getProjects]);

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteProject(projectId);
    }
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.fullName}!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Your Projects Dashboard
        </Typography>
      </Box>

      {projects.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create your first project to get started!
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/project')}
          >
            Create First Project
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid xs={12} sm={6} md={4} key={project.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {project.imageUrl && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={project.imageUrl}
                      alt={project.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                        {project.title}
                      </Typography>
                      <Chip
                        label={project.status || 'pending'}
                        color={getStatusColor(project.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description.length > 100
                        ? `${project.description.substring(0, 100)}...`
                        : project.description
                      }
                    </Typography>

                    {project.students && project.students.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {project.students.length} student{project.students.length > 1 ? 's' : ''}
                        </Typography>
                        <AvatarGroup max={3} sx={{ ml: 1 }}>
                          {project.students.map((student, index) => (
                            <Avatar key={index} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {student.name.charAt(0).toUpperCase()}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                      </Box>
                    )}

                    {project.supervisor && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Supervisor: {project.supervisor.name || project.supervisor.fullName || 'N/A'}
                        </Typography>
                      </Box>
                    )}

                    {project.coSupervisor && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Co-Supervisor: {project.coSupervisor.name || project.coSupervisor.fullName || 'N/A'}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={() => navigate('/project')}
          >
            <AddIcon />
          </Fab>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
