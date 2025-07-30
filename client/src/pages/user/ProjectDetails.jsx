import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Box,
  Chip,
  Button,
  Grid,
  Alert,
  Skeleton,
  Fab,
  Avatar,
  AvatarGroup,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  CloudUpload,
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment,
  AttachFile
} from '@mui/icons-material';
import { useProjectStore } from '../../store/projectStore';
import { useUserStore } from '../../store/userStore';
import ProjectFileList from '../../components/projects/ProjectFileList';
import FileUploadManager from '../../components/projects/FileUploadManager';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { projects, getAllProjects, allProjects, deleteProject, isLoading } = useProjectStore();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
      default:
        return 'warning';
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError('');

      try {
        // Check if project is already in store
        let foundProject = null;
        
        if (user?.role === 'admin') {
          if (allProjects.length === 0) {
            await getAllProjects();
          }
          foundProject = allProjects.find(p => p.id === projectId);
        } else {
          if (projects.length === 0) {
            // Trigger project fetch if not already loaded
            // This would need to be implemented in the store
          }
          foundProject = projects.find(p => p.id === projectId);
        }

        if (foundProject) {
          setProject(foundProject);
        } else {
          setError('Project not found or access denied');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, user, projects, allProjects, getAllProjects]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(projectId);
        navigate('/');
      } catch (error) {
        setError('Failed to delete project');
      }
    }
  };

  const handleUploadComplete = (uploadedFiles) => {
    setFileRefreshTrigger(prev => prev + 1);
    setUploadDialogOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back
        </Button>
        <Skeleton variant="rectangular" height={300} sx={{ mb: 3 }} />
        <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={100} />
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back
        </Button>
        <Alert severity="error">
          {error || 'Project not found'}
        </Alert>
      </Container>
    );
  }

  const canManageFiles = user?.uid === project.userId || user?.role === 'admin';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        
        {canManageFiles && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Files
            </Button>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              color="warning"
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              startIcon={<Delete />}
              color="error"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      {/* Project Header Card */}
      <Card sx={{ mb: 3 }}>
        <Grid container>
          {project.imageUrl && (
            <Grid xs={12} md={4}>
              <CardMedia
                component="img"
                height="300"
                image={project.imageUrl}
                alt={project.title}
                sx={{ objectFit: 'cover' }}
              />
            </Grid>
          )}
          <Grid xs={12} md={project.imageUrl ? 8 : 12}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                  {project.title}
                </Typography>
                <Chip
                  label={project.status || 'pending'}
                  color={getStatusColor(project.status)}
                  size="large"
                />
              </Box>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                {project.description}
              </Typography>

              {/* Project Members */}
              {project.students && project.students.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PeopleIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Students ({project.students.length}):
                  </Typography>
                  <AvatarGroup max={5} sx={{ ml: 1 }}>
                    {project.students.map((student, index) => (
                      <Avatar key={index} sx={{ width: 32, height: 32 }}>
                        {student.name?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                </Box>
              )}

              {/* Supervisors */}
              {project.supervisor && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SchoolIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Supervisor: {project.supervisor.name || project.supervisor.fullName || 'N/A'}
                  </Typography>
                </Box>
              )}

              {project.coSupervisor && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SchoolIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Co-Supervisor: {project.coSupervisor.name || project.coSupervisor.fullName || 'N/A'}
                  </Typography>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Grid>
        </Grid>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            label="Overview" 
            icon={<Assignment />} 
            iconPosition="start"
          />
          <Tab 
            label="Files & Documents" 
            icon={<AttachFile />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {project.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Details
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={project.status || 'pending'}
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                {project.students && project.students.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Team Members
                    </Typography>
                    {project.students.map((student, index) => (
                      <Typography key={index} variant="body2">
                        {student.name}
                      </Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ProjectFileList 
          projectId={projectId} 
          refreshTrigger={fileRefreshTrigger}
        />
      </TabPanel>

      {/* Upload FAB */}
      {canManageFiles && (
        <Fab
          color="primary"
          aria-label="upload files"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => setUploadDialogOpen(true)}
        >
          <CloudUpload />
        </Fab>
      )}

      {/* File Upload Dialog */}
      <FileUploadManager
        projectId={projectId}
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </Container>
  );
};

export default ProjectDetails;
