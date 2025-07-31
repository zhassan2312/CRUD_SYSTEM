import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Card,
  CardContent,
  CardMedia,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/admin';
import { useAuthStore } from '../../store/user';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import CommentIcon from '@mui/icons-material/Comment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';

const ProjectReview = () => {
  const { projects, getAllProjects, updateProjectStatus, isLoading } = useProjectStore();
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [statusAction, setStatusAction] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [emailNotification, setEmailNotification] = useState(true);

  useEffect(() => {
    getAllProjects();
  }, [getAllProjects]);

  // Filter projects by status for tabs
  const projectsData = projects?.data || [];
  const getFilteredProjects = (status) => {
    if (status === 'all') return projectsData;
    return projectsData.filter(project => project.status === status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'under-review':
        return 'warning';
      case 'revision-required':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
  };

  const handleReviewProject = (project, action) => {
    setSelectedProject(project);
    setStatusAction(action);
    setReviewComment('');
    setEmailNotification(true);
    setReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedProject || !statusAction) return;

    const reviewData = {
      status: statusAction,
      reviewComment: reviewComment.trim(),
      reviewedBy: user.id,
      reviewedAt: new Date().toISOString(),
      sendEmail: emailNotification
    };

    const success = await updateProjectStatus(selectedProject.id, reviewData);
    
    if (success) {
      setReviewDialog(false);
      setSelectedProject(null);
      setReviewComment('');
      setStatusAction('');
    }
  };

  const handleViewHistory = (project) => {
    setSelectedProject(project);
    setHistoryDialog(true);
  };

  const tabLabels = [
    { label: 'All Projects', value: 'all', count: projectsData.length },
    { label: 'Pending', value: 'pending', count: getFilteredProjects('pending').length },
    { label: 'Under Review', value: 'under-review', count: getFilteredProjects('under-review').length },
    { label: 'Approved', value: 'approved', count: getFilteredProjects('approved').length },
    { label: 'Rejected', value: 'rejected', count: getFilteredProjects('rejected').length },
    { label: 'Revision Required', value: 'revision-required', count: getFilteredProjects('revision-required').length }
  ];

  const currentTabValue = selectedTab < tabLabels.length ? tabLabels[selectedTab].value : 'all';
  const filteredProjects = getFilteredProjects(currentTabValue);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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

      {/* Status Filter Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabLabels.map((tab, index) => (
            <Tab
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.label}
                  <Chip
                    label={tab.count}
                    size="small"
                    color={tab.value === 'pending' ? 'warning' : 'default'}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Projects List */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Creator</TableCell>
                <TableCell>Team Size</TableCell>
                <TableCell>Supervisor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No projects found for this status
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {project.imageUrl && (
                          <Avatar
                            src={project.imageUrl}
                            variant="rounded"
                            sx={{ width: 40, height: 40 }}
                          />
                        )}
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {project.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {project.description?.substring(0, 50)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {project.creatorName || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {project.students?.length || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {project.supervisor?.fullName || project.supervisor?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={project.status || 'pending'}
                        color={getStatusColor(project.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewProject(project)}
                          title="View Details"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        
                        {project.status !== 'approved' && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleReviewProject(project, 'approved')}
                            title="Approve"
                          >
                            <CheckIcon />
                          </IconButton>
                        )}
                        
                        {project.status !== 'rejected' && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReviewProject(project, 'rejected')}
                            title="Reject"
                          >
                            <CloseIcon />
                          </IconButton>
                        )}
                        
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleReviewProject(project, 'revision-required')}
                          title="Request Revision"
                        >
                          <EditIcon />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={() => handleViewHistory(project)}
                          title="View History"
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Project Details Dialog */}
      <Dialog 
        open={!!selectedProject && !reviewDialog && !historyDialog} 
        onClose={() => setSelectedProject(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Project Details
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Grid container spacing={3}>
              <Grid xs={12}>
                <Card>
                  {selectedProject.imageUrl && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={selectedProject.imageUrl}
                      alt={selectedProject.title}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      {selectedProject.title}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedProject.description}
                    </Typography>
                    
                    {/* Team Members */}
                    {selectedProject.students && selectedProject.students.length > 0 && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="h6">
                            Team Members ({selectedProject.students.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            {selectedProject.students.map((student, index) => (
                              <Grid xs={12} sm={6} key={index}>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Typography variant="subtitle2">
                                      {student.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {student.email}
                                    </Typography>
                                    <Typography variant="caption">
                                      ID: {student.studentId}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Supervisor Info */}
                    {selectedProject.supervisor && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Supervision
                        </Typography>
                        <Typography variant="body2">
                          <strong>Supervisor:</strong> {selectedProject.supervisor.fullName || selectedProject.supervisor.name}
                        </Typography>
                        {selectedProject.coSupervisor && (
                          <Typography variant="body2">
                            <strong>Co-Supervisor:</strong> {selectedProject.coSupervisor.fullName || selectedProject.coSupervisor.name}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Status History */}
                    {selectedProject.statusHistory && selectedProject.statusHistory.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Recent Status Changes
                        </Typography>
                        {selectedProject.statusHistory.slice(-3).map((history, index) => (
                          <Alert key={index} severity="info" sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              <strong>{history.status}</strong> by {history.reviewedBy} 
                              on {new Date(history.timestamp).toLocaleString()}
                              {history.comment && (
                                <>
                                  <br />
                                  <em>"{history.comment}"</em>
                                </>
                              )}
                            </Typography>
                          </Alert>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProject(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Review Project: {selectedProject?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              You are about to change the status to <strong>{statusAction}</strong>
            </Alert>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Review Comment"
              placeholder="Provide feedback for the project creator..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="action" />
                <Typography variant="body2">
                  Send email notification to project creator
                </Typography>
                <Select
                  value={emailNotification}
                  onChange={(e) => setEmailNotification(e.target.value)}
                  size="small"
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </Box>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReview} 
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Status History: {selectedProject?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {selectedProject?.statusHistory && selectedProject.statusHistory.length > 0 ? (
              selectedProject.statusHistory.map((history, index) => (
                <Card key={index} sx={{ mb: 2 }} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={history.status}
                        color={getStatusColor(history.status)}
                        size="small"
                      />
                      <Typography variant="caption">
                        {new Date(history.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      <strong>Reviewed by:</strong> {history.reviewedBy}
                    </Typography>
                    {history.comment && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        "{history.comment}"
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                No status history available
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectReview;
