import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Pagination,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Assignment as ReviewIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import api from '../../lib/axios';

const ProjectReview = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      status: 'pending',
      feedback: ''
    }
  });

  // Status counts for tab badges
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    'under-review': 0,
    approved: 0,
    rejected: 0,
    'revision-required': 0
  });

  useEffect(() => {
    fetchProjects();
  }, [activeTab, pagination.currentPage]);

  const fetchProjects = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/projects/review/list', {
        params: {
          status: activeTab,
          page,
          limit: 10
        }
      });
      
      setProjects(response.data.projects);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalProjects: response.data.totalProjects
      });

      // Update status counts
      const allProjectsResponse = await api.get('/projects/review/list', {
        params: { status: 'all', limit: 1000 }
      });
      
      const allProjects = allProjectsResponse.data.projects;
      const counts = {
        all: allProjects.length,
        pending: allProjects.filter(p => (p.status || 'pending') === 'pending').length,
        'under-review': allProjects.filter(p => p.status === 'under-review').length,
        approved: allProjects.filter(p => p.status === 'approved').length,
        rejected: allProjects.filter(p => p.status === 'rejected').length,
        'revision-required': allProjects.filter(p => p.status === 'revision-required').length
      };
      setStatusCounts(counts);

    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (project) => {
    setSelectedProject(project);
    reset({
      status: project.status || 'pending',
      feedback: ''
    });
    setReviewDialogOpen(true);
  };

  const handleOpenHistory = async (project) => {
    setSelectedProject(project);
    try {
      const response = await api.get(`/projects/${project.id}/status-history`);
      setStatusHistory(response.data.statusHistory);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error('Error fetching status history:', error);
      toast.error('Failed to fetch project history');
    }
  };

  const handleStatusUpdate = async (data) => {
    if (!selectedProject) return;

    try {
      await api.put(`/projects/${selectedProject.id}/status`, {
        status: data.status,
        feedback: data.feedback
      });

      toast.success('Project status updated successfully');
      setReviewDialogOpen(false);
      fetchProjects(pagination.currentPage);
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'under-review': return 'info';
      case 'revision-required': return 'warning';
      case 'pending':
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <ApproveIcon />;
      case 'rejected': return <RejectIcon />;
      case 'under-review': return <ReviewIcon />;
      case 'revision-required': return <EditIcon />;
      case 'pending':
      default: return <ScheduleIcon />;
    }
  };

  const tabLabels = {
    all: 'All Projects',
    pending: 'Pending',
    'under-review': 'Under Review',
    'revision-required': 'Needs Revision',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Project Review Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage project submissions
        </Typography>
      </Box>

      {/* Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {Object.entries(tabLabels).map(([key, label]) => (
            <Tab
              key={key}
              value={key}
              label={
                <Badge badgeContent={statusCounts[key]} color="primary" max={999}>
                  {label}
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Projects Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Students</TableCell>
                  <TableCell>Supervisor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Last Reviewed</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {project.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {project.description?.substring(0, 60)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {project.students?.length || 0} student(s)
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {project.supervisor || 'Not assigned'}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(project.status || 'pending')}
                        label={project.status?.replace('-', ' ').toUpperCase() || 'PENDING'}
                        color={getStatusColor(project.status || 'pending')}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(project.createdAt?.toDate ? project.createdAt.toDate() : project.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {project.lastReviewedAt ? 
                          new Date(project.lastReviewedAt?.toDate ? project.lastReviewedAt.toDate() : project.lastReviewedAt).toLocaleDateString() 
                          : 'Never'
                        }
                      </Typography>
                      {project.reviewerName && (
                        <Typography variant="caption" color="text.secondary">
                          by {project.reviewerName}
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenReview(project)}
                        color="primary"
                        title="Review Project"
                      >
                        <ReviewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenHistory(project)}
                        color="info"
                        title="View History"
                      >
                        <HistoryIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.currentPage}
                onChange={(e, page) => fetchProjects(page)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(handleStatusUpdate)}>
          <DialogTitle>
            Review Project: {selectedProject?.title}
          </DialogTitle>
          
          <DialogContent>
            {selectedProject && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Project Details</Typography>
                <Typography variant="body2" paragraph>
                  <strong>Description:</strong> {selectedProject.description}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Sustainability Impact:</strong> {selectedProject.sustainability}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Students:</strong> {selectedProject.students?.map(s => s.name).join(', ') || 'None'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Supervisor:</strong> {selectedProject.supervisor || 'Not assigned'}
                </Typography>
                {selectedProject.coSupervisor && (
                  <Typography variant="body2" paragraph>
                    <strong>Co-Supervisor:</strong> {selectedProject.coSupervisor}
                  </Typography>
                )}
                {selectedProject.imageUrl && (
                  <Box sx={{ mt: 2 }}>
                    <img 
                      src={selectedProject.imageUrl} 
                      alt="Project" 
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                    />
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Controller
                name="status"
                control={control}
                rules={{ required: 'Status is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status">
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="under-review">Under Review</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                      <MenuItem value="revision-required">Revision Required</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            <Controller
              name="feedback"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Feedback/Comments (Optional)"
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Provide feedback for the student..."
                />
              )}
            />
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Update Status</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Project Status History: {selectedProject?.title}
        </DialogTitle>
        
        <DialogContent>
          {statusHistory.length > 0 ? (
            <Box>
              {statusHistory.map((entry, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        icon={getStatusIcon(entry.status)}
                        label={entry.status?.replace('-', ' ').toUpperCase()}
                        color={getStatusColor(entry.status)}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.timestamp?.toDate ? entry.timestamp.toDate() : entry.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Reviewed by:</strong> {entry.reviewerName} ({entry.reviewerRole})
                    </Typography>
                    
                    {entry.feedback && (
                      <Typography variant="body2">
                        <strong>Feedback:</strong> {entry.feedback}
                      </Typography>
                    )}
                    
                    {entry.previousStatus && (
                      <Typography variant="caption" color="text.secondary">
                        Changed from: {entry.previousStatus.replace('-', ' ').toUpperCase()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Alert severity="info">No status history available for this project.</Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectReview;
